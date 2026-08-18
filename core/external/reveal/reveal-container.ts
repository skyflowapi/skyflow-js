/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import EventEmitter from '@core/event-emitter';
import uuid from '@core/libs/uuid';
import iframer, { getIframeSrc, setAttributes, setStyles } from '@core/iframe-libs/iframer';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  CONTROLLER_STYLES, CUSTOM_ERROR_MESSAGES,
  ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER,
  REVEAL_TYPES,
} from '@core/constants';
import properties from '@core/properties';
import {
  ContainerType, IRevealElementOptions, ContainerOptions, Context, ErrorType,
  MessageType, IRevealResponseBase, ICoreMetadata, RevealContainerProps,
  ISkyflowElement,
} from '@core/types';
import Container from '@core/external/common/container';
import SkyflowError from '@core/errors';
import { validateInitConfig, validateInputFormatOptions } from '@core/validators';
import { parameterizedString, printLog } from '@core/utils/logs-helper';
import CoreRevealElement from '@core/external/reveal/reveal-element';

const CLASS_NAME = 'RevealContainer';
// Shared reveal-container base. Owns the controller-frame bootstrap and the
// mount/reveal orchestration common to both SDKs. Generic over the reveal-input
// shape (TInput), the reveal() options (TRevealOptions), and the concrete
// element type (TElement). Divergence is injected via hooks — validateOptions
// (reveal options), validateRecords (reveal-record validation), wrapRevealError
// (error mapping) — and the createRevealElement factory (each package's own
// RevealElement, kept out of @core). The reveal input/option TYPE definitions
// stay in each package's reveal-container subclass (imported by the element
// files as `./reveal-container`).
abstract class RevealContainer<
  TInput extends object,
  TRevealOptions,
  TResponse extends IRevealResponseBase,
  TElement extends CoreRevealElement<TInput>,
> extends Container {
  #revealRecords: TInput[] = [];

  #revealElements: TElement[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: ICoreMetadata;

  #containerId: string;

  #eventEmmiter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #context: Context;

  #skyflowElements: Record<string, ISkyflowElement>;

  #isMounted: boolean = false;

  type:string = ContainerType.REVEAL;

  #isSkyflowFrameReady: boolean = false;

  #customErrorMessages: Partial<Record<ErrorType, string>> = {};

  constructor(
    metaData: ICoreMetadata,
    skyflowElements: Record<string, ISkyflowElement>,
    context: Context,
    options?: ContainerOptions,
  ) {
    super();
    this.#isSkyflowFrameReady = metaData?.skyflowContainer?.isControllerFrameReady;
    this.#metaData = {
      ...metaData,
      clientJSON: {
        ...metaData.clientJSON,
        config: {
          ...metaData.clientJSON?.config,
          options: {
            ...metaData.clientJSON?.config?.options,
            ...options,
          },
        },
      },
    };
    this.#skyflowElements = skyflowElements;
    this.#containerId = uuid();
    this.#eventEmmiter = new EventEmitter();
    this.#context = context;
    const clientDomain = this.#metaData.clientDomain || '';
    const iframe = iframer({
      name: `${REVEAL_FRAME_CONTROLLER}:${this.#containerId}:${btoa(clientDomain)}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_REVEAL_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
        (data) => {
          if (!data.skyflowID) {
            this.#mountedRecords.push(data as any);
          }
          let revealElementLength = 0;
          this.#revealElements.forEach((currentElement) => {
            if (!currentElement.getRecordData().skyflowID) {
              revealElementLength += 1;
            }
          });

          this.#isElementsMounted = this.#mountedRecords.length === revealElementLength;
          // this.#mountedRecords.length === this.#revealElements.length;
          if (this.#isRevealCalled && this.#isElementsMounted) {
            // eslint-disable-next-line no-underscore-dangle
            this.#eventEmmiter._emit(
              ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED
                + this.#containerId,
              {
                containerId: this.#containerId,
              },
            );
          }
        },
      );
  }

  create(record: TInput, options?: IRevealElementOptions): TElement {
    // this.#revealRecords.push(record);
    const elementId = uuid();
    validateInputFormatOptions(options);
    const revealElement = this.createRevealElement(
      record, options, this.#metaData,
      {
        containerId: this.#containerId,
        isMounted: this.#isMounted,
        eventEmitter: this.#eventEmmiter,
        type: ContainerType.REVEAL,
      }, elementId, this.#context,
    );
    this.#revealElements.push(revealElement);
    this.#skyflowElements[elementId] = revealElement;
    return revealElement;
  }

  setError(errors: Partial<Record<ErrorType, string>>) {
    this.#customErrorMessages = errors;
    // eslint-disable-next-line no-underscore-dangle
    this.#eventEmmiter._emit(`${CUSTOM_ERROR_MESSAGES}:${this.#containerId}`, {
      errorMessages: this.#customErrorMessages,
    });
  }

  reveal(options?: TRevealOptions): Promise<TResponse> {
    this.#isRevealCalled = true;
    this.#revealRecords = [];
    if (this.#metaData.skyflowContainer.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          this.#revealElements.forEach((currentElement) => {
            if (currentElement.isClientSetError()) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
            }
            if (!currentElement.getRecordData().skyflowID) {
              this.#revealRecords.push(currentElement.getRecordData());
            }
          });
          if (this.#revealRecords.length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_REVEAL, [], true);
          }
          this.validateRecords(this.#revealRecords);
          this.validateOptions(options);
          if (!this.#isElementsMounted) {
            const timeout = setTimeout(() => {
              printLog(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL,
                MessageType.ERROR, this.#context.logLevel);
              reject(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL));
            }, 10000);

            this.#eventEmmiter.on(
              ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
              () => {
                clearTimeout(timeout);
                this.#emitRevealRequest(resolve, reject, options);
              },
            );
          } else {
            this.#emitRevealRequest(resolve, reject, options);
          }
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        this.#revealElements.forEach((currentElement) => {
          if (currentElement.isClientSetError()) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
          }
          if (!currentElement.getRecordData().skyflowID) {
            this.#revealRecords.push(currentElement.getRecordData());
          }
        });
        if (this.#revealRecords.length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_REVEAL, [], true);
        }
        this.validateRecords(this.#revealRecords);
        this.validateOptions(options);
        if (!this.#isElementsMounted) {
          const timeout = setTimeout(() => {
            printLog(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL,
              MessageType.ERROR, this.#context.logLevel);
            reject(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL));
          }, 10000);

          this.#eventEmmiter.on(
            ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
            () => {
              clearTimeout(timeout);
              if (this.#metaData.skyflowContainer.isControllerFrameReady) {
                this.#emitRevealRequest(resolve, reject, options);
              } else {
                bus
                  .target(properties.IFRAME_SECURE_ORIGIN)
                  .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY
         + this.#metaData.uuid, () => {
                    this.#emitRevealRequest(resolve, reject, options);
                  });
              }
            },
          );
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY
         + this.#metaData.uuid, () => {
              this.#emitRevealRequest(resolve, reject, options);
            });
        }
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
        reject(err);
      }
    });
  }

  #emitRevealRequest(resolve, reject, options?: TRevealOptions) {
    bus
      .target(properties.IFRAME_SECURE_ORIGIN)
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#metaData.uuid,
        {
          type: REVEAL_TYPES.REVEAL,
          records: this.#revealRecords,
          containerId: this.#containerId,
          errorMessages: this.#customErrorMessages,
          // Only include `options` when present. flowDB passes reveal options here;
          // privacyDB's value is always undefined and fetchRevealRecords ignores it,
          // so the key is omitted rather than sent as `undefined`.
          ...(options ? { options } : {}),
        },
        (revealData: any) => {
          this.#mountedRecords = [];
          if (revealData.error) {
            printLog(parameterizedString(logs.errorLogs.FAILED_REVEAL),
              MessageType.ERROR, this.#context.logLevel);
            reject(this.wrapRevealError(revealData.error));
          } else {
            printLog(parameterizedString(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
              MessageType.LOG,
              this.#context.logLevel);
            resolve(revealData);
          }
        },
      );
  }

  // ---- Injected divergence (see class doc) --------------------------------
  // Factory: each package builds its own RevealElement (kept out of @core).
  protected abstract createRevealElement(
    record: TInput,
    options: IRevealElementOptions | undefined,
    metaData: ICoreMetadata,
    container: RevealContainerProps,
    elementId: string,
    context: Context,
  ): TElement;

  // Reveal-record validation (privacyDB allows skyflowID/redaction/format;
  // flowDB is token-only), so each package supplies its validator.
  protected abstract validateRecords(records: TInput[]): void;

  // Reveal-options validation: no-op for privacyDB (no reveal options),
  // validateRevealOptions for flowDB.
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected validateOptions(options?: TRevealOptions): void {}

  // Error mapping: identity for privacyDB, SkyflowFlowDBError for flowDB.
  // eslint-disable-next-line class-methods-use-this
  protected wrapRevealError(err: any): any {
    return err;
  }
}
export default RevealContainer;
