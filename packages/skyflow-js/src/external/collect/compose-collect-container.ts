/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
// privacyDB composable collect container: the shared @core ComposableContainerBase
// (controller-frame bootstrap, mount/grid layout, createMultipleElement shell,
// emitEvent, hasElementName, unmount) plus the collect-only surface — create()
// (CollectElement factory), collect()/uploadFiles(), the on() submit listener,
// the bus COMPOSABLE_CONTAINER handshake (registerReadyListener) and the
// per-element file-upload wiring (registerElementListeners).
import bus from 'framebus';
import deepClone from '@core/libs/deep-clone';
import uuid from '@core/libs/uuid';
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT,
  COLLECT_TYPES,
} from '@core/constants';
import ComposableContainerBase from '@core/external/common/composable-container';
import SkyflowError from '@core/errors';
import {
  formatValidations, formatOptions, validateElementOptions, getElements,
} from '@core/libs/element-options';
import Client from '@core/client';
import CollectElement from '@core/external/collect/collect-element';
import { ContainerType } from '../../skyflow';
import {
  MessageType,
  CollectElementInput,
  CollectElementOptions,
  ICollectOptions,
  CollectResponse,
  InputStyles,
  ErrorTextStyles,
  UploadFilesResponse,
} from '../../utils/common';
import { printLog, parameterizedString } from '../../utils/logs-helper';
import {
  validateCollectElementInput, validateInitConfig, validateAdditionalFieldsInCollect,
  validateUpsertOptions,
} from '../../utils/validators';
import ComposableElement from './compose-collect-element';
import { ElementGroup } from './collect-container';

export interface ComposableElementGroup extends ElementGroup {
  styles: InputStyles;
  errorTextStyles: ErrorTextStyles;
}

const CLASS_NAME = 'CollectContainer';
class ComposableContainer extends ComposableContainerBase {
  type:string = ContainerType.COMPOSABLE;

  protected elementGroup: ComposableElementGroup = { rows: [], styles: {}, errorTextStyles: {} };

  // eslint-disable-next-line class-methods-use-this
  protected getClassName(): string {
    return CLASS_NAME;
  }

  create = (input: CollectElementInput, options: CollectElementOptions = {
    required: false,
  }): ComposableElement => {
    validateCollectElementInput(input, this.context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.context.logLevel);

    const elementName = `${FRAME_ELEMENT}:${input.type}:${btoa(uuid())}`;

    this.elementsList.push({
      elementType: input.type,
      name: input.column,
      ...input,
      ...formattedOptions,
      validations,
      elementName,
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.tempElements)}:${this.containerId}:${this.context.logLevel}:${btoa(this.clientDomain)}`;
    this.iframeID = controllerIframeName;
    return new ComposableElement(
      elementName, this.eventEmitter, controllerIframeName,
      { ...this.metaData, type: input.type },
    );
  };

  protected createMultipleElement = (
    multipleElements: ComposableElementGroup,
    isSingleElementAPI: boolean = false,
  ): ComposableContainer => {
    const elements: any[] = [];
    this.tempElements = deepClone(multipleElements);
    this.tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const { elementType } = options;
        validateElementOptions(elementType, options);

        options.sensitive = options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern = options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        options.isMounted = false;

        options.label = element.label;
        options.skyflowID = element.skyflowID;

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
        element.update(elements[0]);
      } else {
        element.update(this.tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement(
        elementId,
        this.tempElements,
        this.metaData,
        {
          containerId: this.containerId,
          isMounted: this.containerMounted,
          type: this.type,
        },
        true,
        this.#destroyCallback,
        this.#updateCallback,
        this.context,
        this.eventEmitter,
      );
      this.elements[this.tempElements.elementName] = element;
      this.skyflowElements[elementId] = element;
    }
    return element;
  };

  #removeElement = (elementName: string) => {
    Object.keys(this.elements).forEach((element) => {
      if (element === elementName) delete this.elements[element];
    });
  };

  #destroyCallback = (elementNames: string[]) => {
    elementNames.forEach((elementName) => {
      this.#removeElement(elementName);
    });
  };

  #updateCallback = (elements: any[]) => {
    elements.forEach((element) => {
      if (this.elements[element.elementName]) {
        this.elements[element.elementName].update(element);
      }
    });
  };

  on = (eventName:string, handler:Function) => {
    if (!Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (!handler) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (typeof handler !== 'function') {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }

    this.eventEmitter.on(ELEMENT_EVENTS_TO_CLIENT.SUBMIT, () => {
      handler();
    });
  };

  // Handshake with the composable controller frame (bus). Invoked from the base
  // constructor, so it is a prototype method (available during super()).
  protected registerReadyListener(): void {
    this.updateListeners();
    bus
      // .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.INITIALIZE_COMPOSABLE_CLIENT, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        callback({
          client: this.metaData.clientJSON,
          context: this.context,
        });
        this.isComposableFrameReady = true;
      });
  }

  // Collect-only per-element file-upload wiring, run from the base mount().
  protected registerElementListeners(): void {
    this.elementsList.forEach((element) => {
      this.eventEmitter.on(`${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${element.elementName}`, (data, callback) => {
        this.getSkyflowBearerToken()?.then((authToken) => {
          printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
            MessageType.LOG,
            this.context.logLevel);
          this.emitEvent(
            `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${element.elementName}`,
            {
              elementName: element.name,
              data: {
                type: COLLECT_TYPES.FILE_UPLOAD,
                containerId: this.containerId,
              },
              clientConfig: {
                vaultURL: this.metaData?.clientJSON?.config?.vaultURL,
                vaultID: this.metaData?.clientJSON?.config?.vaultID,
                authToken,
              },
              options: {
                ...data?.options,
              },
              errorMessages: this.customErrorMessages,
            },
          );
        }).catch((err:any) => {
          printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
          callback(err);
        });
      });
    });
  }

  collect = (options: ICollectOptions = { tokens: true }) :
  Promise<CollectResponse> => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.metaData.clientJSON.config);
      if (!this.elementsList || this.elementsList.length === 0) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
      }
      if (!this.isMounted) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
      }
      const containerElements = getElements(this.tempElements);
      containerElements.forEach((element:any) => {
        if (!element?.isMounted) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
        }
      });
      const elementIds:{ frameId:string, elementId:string }[] = [];
      const collectElements = Object.values(this.elements);
      collectElements.forEach((element) => {
        element.isValidElement();
      });
      if (options && options.tokens && typeof options.tokens !== 'boolean') {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
      }
      if (options?.additionalFields) {
        validateAdditionalFieldsInCollect(options.additionalFields);
      }
      if (options?.upsert) {
        validateUpsertOptions(options?.upsert);
      }
      this.elementsList.forEach((element) => {
        elementIds.push({
          frameId: this.tempElements.elementName,
          elementId: element.elementName ?? '',
        });
      });
      const client = Client.fromJSON(this.metaData.clientJSON) as any;
      const clientId = client.toJSON()?.metaData?.uuid || '';
      this.getSkyflowBearerToken()?.then((authToken) => {
        printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        this.emitEvent(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + this.containerId, {
          data: {
            type: COLLECT_TYPES.COLLECT,
            ...options,
            tokens: options?.tokens !== undefined ? options.tokens : true,
            elementIds,
            containerId: this.containerId,
          },
          clientConfig: {
            vaultURL: this.metaData.clientJSON.config.vaultURL,
            vaultID: this.metaData.clientJSON.config.vaultID,
            authToken,
          },
          errorMessages: this.customErrorMessages,
        });
      }).catch((err:any) => {
        printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
        reject(err);
      });
      window.addEventListener('message', (event) => {
        if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
          if (event?.data?.type
              === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + this.containerId) {
            const data = event.data.data;
            if (!data || data?.error) {
              printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
              reject(data?.error);
            } else if (data?.records) {
              printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                MessageType.LOG,
                this.context.logLevel);
              resolve(data);
            } else {
              printLog(`${JSON.stringify(data)}`, MessageType.ERROR, this.context.logLevel);
              reject(data);
            }
          }
        }
      });
      printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
      MessageType.LOG, this.context.logLevel);
    } catch (err:any) {
      printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
      reject(err);
    }
  });

  uploadFiles = (options: ICollectOptions):
  Promise<UploadFilesResponse> => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.metaData.clientJSON.config);
      if (!this.elementsList || this.elementsList.length === 0) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
      }
      if (!this.isMounted) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
      }
      const elementIds:{ frameId:string, elementId:string }[] = [];
      this.elementsList.forEach((element) => {
        elementIds.push({
          frameId: this.tempElements.elementName,
          elementId: element.elementName ?? '',
        });
      });
      const client = Client.fromJSON(this.metaData.clientJSON) as any;
      const clientId = client.toJSON()?.metaData?.uuid || '';
      this.getSkyflowBearerToken()?.then((authToken) => {
        printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        this.emitEvent(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + this.containerId, {
          data: {
            type: COLLECT_TYPES.FILE_UPLOAD,
            ...options,
            // tokens: options?.tokens !== undefined ? options.tokens : true,
            elementIds,
            containerId: this.containerId,
          },
          clientConfig: {
            vaultURL: this.metaData.clientJSON.config.vaultURL,
            vaultID: this.metaData.clientJSON.config.vaultID,
            authToken,
          },
          errorMessages: this.customErrorMessages,
        });
        window.addEventListener('message', (event) => {
          if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
            if (event.data?.type
              === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + this.containerId) {
              const data = event.data.data;
              if (!data || data?.error) {
                printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
                reject(data?.error);
              } else if (data?.fileUploadResponse) {
                printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                  MessageType.LOG,
                  this.context.logLevel);
                resolve(data);
              } else {
                printLog(`${JSON.stringify(data)}`, MessageType.ERROR, this.context.logLevel);
                reject(data);
              }
            }
          }
        });
      }).catch((err:any) => {
        printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
        reject(err);
      });
    } catch (err:any) {
      printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
      reject(err);
    }
  });

  // Registered from registerReadyListener (prototype method, available during
  // super()); relays element-option updates to the mounted controller element.
  protected updateListeners(): void {
    this.eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, (data) => {
      let elementIndex;
      const elementList = this.elementsList.map((element, index) => {
        if (element.elementName === data.elementName) {
          elementIndex = index;
          return {
            elementName: element.elementName,
            ...data.elementOptions,
          };
        }
        return element;
      });

      if (this.containerElement) {
        this.containerElement.updateElement({
          ...elementList[elementIndex],
        });
      }
    });
  }
}
export default ComposableContainer;
