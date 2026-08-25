/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
// Shared composable-reveal container base (extends ComposableContainerBase). Owns
// the reveal() two-branch orchestration, the createMultipleElement shell, setError
// (with the custom-error-message broadcast), the window `message` MOUNTED
// readiness listener, and the errorMessages-decorated emitEvent. The divergence is
// injected as hooks so no package symbol enters @core:
//   - instantiateInternalElement — the product's (renderFile-capable) element.
//   - validateRecords            — each package's reveal-record validator.
//   - validateOptions            — flowDB validates reveal options; privacyDB no-op.
//   - revealExtraData            — flowDB forwards options into the frame payload.
//   - handleRevealResponse       — privacyDB rejects { errors } raw; flowDB maps a
//                                  { error } full-failure to SkyflowFlowDBError.
// create() stays in each package subclass — its typed input and the returned
// (renderFile-bearing) element are part of the public API surface.
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import uuid from '@core/libs/uuid';
import deepClone from '@core/libs/deep-clone';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_ELEMENT,
  COMPOSABLE_REVEAL,
  ELEMENT_EVENTS_TO_CLIENT,
  REVEAL_TYPES,
  CUSTOM_ERROR_MESSAGES,
} from '@core/constants';
import ComposableContainerBase from '@core/external/common/composable-container';
import ComposableRevealInternalElement from '@core/external/reveal/composable-reveal-internal';
import SkyflowError from '@core/errors';
import {
  ContainerType, MessageType, ErrorType,
  IRevealResponseBase,
} from '@core/types';
import { printLog, parameterizedString } from '@core/utils/logs-helper';
import { formatRevealElementOptions } from '@core/helpers';
import { validateInitConfig, validateInputFormatOptions } from '@core/validators';

abstract class CoreComposableRevealContainer<
  TRevealOptions,
  TResponse extends IRevealResponseBase,
> extends ComposableContainerBase<ComposableRevealInternalElement<any>> {
  type:string = ContainerType.COMPOSE_REVEAL;

  protected revealRecords: any[] = [];

  protected mountLabel: string = 'RevealElement';

  // eslint-disable-next-line class-methods-use-this
  protected getClassName(): string {
    return 'ComposableRevealContainer';
  }

  // eslint-disable-next-line class-methods-use-this
  protected getCreateContainerLog(): string {
    return logs.infoLogs.CREATE_REVEAL_CONTAINER;
  }

  setError(errors: Partial<Record<ErrorType, string>>) {
    this.customErrorMessages = errors;
    // eslint-disable-next-line no-underscore-dangle
    (this.eventEmitter as any)._emit(`${CUSTOM_ERROR_MESSAGES}:${this.containerId}`, {
      errorMessages: this.customErrorMessages,
    });
  }

  protected createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false,
  ): ComposableRevealInternalElement<any> => {
    try {
      const elements: any[] = [];
      this.tempElements = deepClone(multipleElements);
      this.tempElements?.rows?.forEach((row) => {
        row?.elements?.forEach((element) => {
          const options = element ?? {};
          const { elementType } = options;
          options.isMounted = false;

          options.label = element?.label;
          options.skyflowID = element?.skyflowID;

          elements.push(options);
        });
      });

      this.tempElements.elementName = isSingleElementAPI
        ? elements[0].elementName
        : `${FRAME_ELEMENT}:group:${btoa(this.tempElements)}`;
      if (
        isSingleElementAPI
        && !this.elements[elements[0].elementName]
        && this.hasElementName(elements[0].name)
      ) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
      }

      let element = this.elements[this.tempElements.elementName];
      if (element) {
        if (isSingleElementAPI) {
          // element.update(elements[0]);
        } else {
          // element.update(this.tempElements);
        }
      } else {
        const elementId = uuid();
        try {
          element = this.instantiateInternalElement(elementId, this.tempElements);
          this.elements[this.tempElements.elementName] = element;
        } catch (error: any) {
          printLog(logs.errorLogs.INVALID_REVEAL_COMPOSABLE_INPUT,
            MessageType.ERROR,
            this.context.logLevel);
          throw error;
        }
      }
      this.iframeID = element.iframeName();
      return element;
    } catch (error: any) {
      printLog(logs.errorLogs.INVALID_REVEAL_COMPOSABLE_INPUT,
        MessageType.ERROR,
        this.context.logLevel);
      throw error;
    }
  };

  protected decorateEmitOptions(options?: Record<string, any>): Record<string, any> {
    return {
      ...options,
      errorMessages: this.customErrorMessages,
    };
  }

  protected registerReadyListener(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === ELEMENT_EVENTS_TO_CLIENT.MOUNTED
                  + this.containerId) {
        this.isComposableFrameReady = true;
      }
    });
  }

  reveal(options?: TRevealOptions): Promise<TResponse> {
    this.revealRecords = [];
    if (this.isComposableFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.metaData.clientJSON.config);
          if (!this.elementsList || this.elementsList.length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
          }
          printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, this.getClassName()),
            MessageType.LOG,
            this.context.logLevel);
          this.elementsList.forEach((currentElement) => {
            if (!currentElement.skyflowID) {
              this.revealRecords.push(currentElement);
            }
          });
          this.validateRecords(this.revealRecords);
          this.validateOptions(options);
          const elementIds:{ frameId:string, token:string }[] = [];
          this.elementsList.forEach((element) => {
            elementIds.push({
              frameId: element.name,
              token: element.token,
            });
          });
          this.getSkyflowBearerToken()?.then((authToken) => {
            printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, this.getClassName()),
              MessageType.LOG,
              this.context.logLevel);
            this.emitEvent(
              ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + this.containerId,
              {
                data: {
                  type: REVEAL_TYPES.REVEAL,
                  containerId: this.containerId,
                  elementIds,
                  ...this.revealExtraData(options),
                },
                clientConfig: {
                  vaultURL: this.metaData?.clientJSON?.config?.vaultURL,
                  vaultID: this.metaData?.clientJSON?.config?.vaultID,
                  authToken,
                },
                context: this.context,
              },
            );

            window?.addEventListener('message', (event) => {
              if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
                if (event?.data?.type
                 === ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.containerId) {
                  this.handleRevealResponse(event?.data?.data, resolve, reject);
                }
              }
            });
          }).catch((err:any) => {
            printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
            reject(err);
          });
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR, this.context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.metaData.clientJSON.config);
        if (!this.elementsList || this.elementsList.length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
        }
        printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, this.getClassName()),
          MessageType.LOG,
          this.context.logLevel);
        this.elementsList.forEach((currentElement) => {
          if (!currentElement.skyflowID) {
            this.revealRecords.push(currentElement);
          }
        });
        this.validateRecords(this.revealRecords);
        this.validateOptions(options);
        const elementIds:{ frameId:string, token:string }[] = [];
        this.elementsList.forEach((element) => {
          elementIds.push({
            frameId: element.name,
            token: element.token,
          });
        });
        this.getSkyflowBearerToken()?.then((authToken) => {
          printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, this.getClassName()),
            MessageType.LOG,
            this.context.logLevel);
          window.addEventListener('message', (messagEevent) => {
            if (messagEevent?.origin === properties.IFRAME_SECURE_ORIGIN) {
              if (messagEevent?.data?.type === ELEMENT_EVENTS_TO_CLIENT.MOUNTED
                  + this.containerId) {
                this.emitEvent(
                  ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + this.containerId, {
                    data: {
                      type: REVEAL_TYPES.REVEAL,
                      containerId: this.containerId,
                      elementIds,
                      ...this.revealExtraData(options),
                    },
                    clientConfig: {
                      vaultURL: this.metaData.clientJSON.config.vaultURL,
                      vaultID: this.metaData.clientJSON.config.vaultID,
                      authToken,
                    },
                    context: this.context,
                  },
                );
                window.addEventListener('message', (event) => {
                  if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
                    if (event?.data?.type
               === ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.containerId) {
                      this.handleRevealResponse(event?.data?.data, resolve, reject);
                    }
                  }
                });
              }
            }
          });
        }).catch((err:any) => {
          printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
          reject(err);
        });
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR, this.context.logLevel);
        reject(err);
      }
    });
  }

  // Shared create() body: registers a composable reveal element (uuid, format-
  // option validation, elementsList push, controllerIframeName) and returns the
  // ids the package subclass needs. create() itself stays per-package because its
  // typed input and the returned (renderFile-bearing) element are public API.
  protected buildComposableRevealElement(
    input: any,
    options?: Record<string, any>,
  ): { elementName: string; controllerIframeName: string } {
    const elementId = uuid();
    validateInputFormatOptions(options);

    const elementName = `${COMPOSABLE_REVEAL}:${btoa(elementId)}`;
    this.elementsList?.push({
      name: elementName,
      ...input,
      elementName,
      elementId,
      ...formatRevealElementOptions(options ?? {}),
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.tempElements ?? {})}:${this.containerId}:${this.context?.logLevel}:${btoa(this.clientDomain ?? '')}`;
    return { elementName, controllerIframeName };
  }

  // ---- Injected divergence (see class doc) --------------------------------

  // Instantiates the product's composable reveal internal element (privacyDB's
  // carries renderFile; flowDB's is a token-only shim) — kept out of @core.
  protected abstract instantiateInternalElement(elementId: string, tempElements: any): any;

  // Each package's reveal-record validator (privacyDB validates skyflowID/table/
  // column/redaction; flowDB is token-only) — divergent, so package-injected.
  protected abstract validateRecords(records: any[]): void;

  // flowDB validates reveal options; privacyDB has none (no-op default).
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  protected validateOptions(options?: TRevealOptions): void {}

  // flowDB forwards reveal options into the frame payload; privacyDB omits them.
  // eslint-disable-next-line class-methods-use-this
  protected revealExtraData(options?: TRevealOptions): Record<string, any> {
    return {};
  }

  // privacyDB default: a partial failure ({ errors }) rejects raw. flowDB
  // overrides to map a full failure ({ error }) onto SkyflowFlowDBError.
  protected handleRevealResponse(
    revealData: any,
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
  ): void {
    if (revealData?.errors) {
      printLog(
        parameterizedString(logs?.errorLogs?.FAILED_REVEAL),
        MessageType.ERROR,
        this.context?.logLevel,
      );
      reject(revealData);
    } else {
      printLog(
        parameterizedString(logs?.infoLogs?.REVEAL_SUBMIT_SUCCESS, this.getClassName()),
        MessageType.LOG,
        this.context?.logLevel,
      );
      resolve(revealData);
    }
  }
}
export default CoreComposableRevealContainer;
