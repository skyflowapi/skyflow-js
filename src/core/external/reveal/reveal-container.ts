/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import EventEmitter from '../../../event-emitter';
import iframer, { getIframeSrc, setAttributes, setStyles } from '../../../iframe-libs/iframer';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import { ContainerType } from '../../../skyflow';
import {
  ContainerOptions,
  Context, ErrorType, MessageType,
  RedactionType, RevealResponse,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { validateInitConfig, validateInputFormatOptions, validateRevealElementRecords } from '../../../utils/validators';
import {
  CONTROLLER_STYLES, CUSTOM_ERROR_MESSAGES,
  ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER,
  REVEAL_TYPES,
  SKYFLOW_FRAME_CONTROLLER,
} from '../../constants';
import Container from '../common/container';
import RevealElement from './reveal-element';
import properties from '../../../properties';
import { Metadata, SkyflowElementProps } from '../../internal/internal-types';
import { RevealElementInput } from '../../../index-node';

export interface IRevealElementInput {
  token?: string;
  skyflowID?: string;
  table?: string;
  column?: string;
  redaction?: RedactionType;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}

export interface IRevealElementOptions {
  enableCopy?: boolean;
  format?: string;
  translation?:Record<string, string>
}

const CLASS_NAME = 'RevealContainer';
class RevealContainer extends Container {
  #revealRecords: IRevealElementInput[] = [];

  #revealElements: RevealElement[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: Metadata;

  #containerId: string;

  #eventEmmiter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #context: Context;

  #skyflowElements: Array<SkyflowElementProps>;

  #isMounted: boolean = false;

  type:string = ContainerType.REVEAL;

  #isSkyflowFrameReady: boolean = false;

  #customErrorMessages: Partial<Record<ErrorType, string>> = {};

  #getSkyflowBearerToken: () => Promise<string> | undefined;

  #shadowRoot: ShadowRoot | null = null;

  #clientId: string = '';

  constructor(
    metaData: Metadata,
    skyflowElements: Array<SkyflowElementProps>,
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
    this.#getSkyflowBearerToken = metaData?.getSkyflowBearerToken;
    this.#skyflowElements = skyflowElements;
    this.#containerId = uuid();
    this.#eventEmmiter = new EventEmitter();
    this.#context = context;
    const clientDomain = this.#metaData.clientDomain || '';
    // console.log('Reveal Container Client Domain',
    // // `${SKYFLOW_FRAME_CONTROLLER}:${this.#metaData.uuid}:${btoa(clientDomain)}`);
    this.#clientId = `${SKYFLOW_FRAME_CONTROLLER}:${this.#metaData.uuid}:${btoa(clientDomain)}:${!!this.#metaData.clientJSON?.config?.options?.trackingKey}`;
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

  create(record: IRevealElementInput, options?: IRevealElementOptions) {
    // this.#revealRecords.push(record);
    const elementId = uuid();
    validateInputFormatOptions(options);
    const revealElement = new RevealElement(record, options, this.#metaData,
      {
        containerId: this.#containerId,
        isMounted: this.#isMounted,
        eventEmitter: this.#eventEmmiter,
        type: ContainerType.REVEAL,
      }, elementId, this.#context);
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

  reveal(): Promise<RevealResponse> {
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
          validateRevealElementRecords(this.#revealRecords);
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
                this.#emitRevealRequest(resolve, reject);
              },
            );
          } else {
            this.#emitRevealRequest(resolve, reject);
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
        validateRevealElementRecords(this.#revealRecords);
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
                this.#emitRevealRequest(resolve, reject);
              } else {
                bus
                  .target(properties.IFRAME_SECURE_ORIGIN)
                  .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY
         + this.#metaData.uuid, () => {
                    this.#emitRevealRequest(resolve, reject);
                  });
              }
            },
          );
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY
         + this.#metaData.uuid, () => {
              this.#emitRevealRequest(resolve, reject);
            });
        }
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
        reject(err);
      }
    });
  }

  #emitRevealRequest(resolve, reject) {
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#metaData.uuid,
      {
        type: REVEAL_TYPES.REVEAL,
        records: this.#revealRecords,
        containerId: this.#containerId,
        errorMessages: this.#customErrorMessages,
      },
      (revealData: any) => {
        this.#mountedRecords = [];
        if (revealData.error) {
          printLog(parameterizedString(logs.errorLogs.FAILED_REVEAL),
            MessageType.ERROR, this.#context.logLevel);
          reject(revealData.error);
        } else {
          printLog(parameterizedString(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          resolve(revealData);
        }
      },
    );
  }

  #emitEvent = (eventName: string, options?: Record<string, any>) => {
    const option = {
      ...options,
      errorMessages: this.#customErrorMessages,
    };
    console.log('emitEvent called for ', this.#metaData, this.#shadowRoot, this.#clientId);
    if (this.#shadowRoot) {
      const iframe = this.#shadowRoot.getElementById(this.#clientId) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          name: eventName,
          ...option,
        }, properties.IFRAME_SECURE_ORIGIN);
      }
    } else {
      const iframe = document.getElementById(`${this.#clientId}`) as HTMLIFrameElement;
      console.log('iframe for emitEvent', iframe);
      if (iframe?.contentWindow) {
        iframe?.contentWindow?.postMessage({
          name: eventName,
          ...option,
        }, properties.IFRAME_SECURE_ORIGIN);
      }
    }
  };

  getZipFiles(input: RevealElementInput,
    options?: IRevealElementOptions): Promise<RevealElement[]> {
    const elementsArray: RevealElement[] = [];
    // Object.keys(this.#elements).forEach((key) => {
    //   elementsArray.push(this.#elements[key]);
    // });
    this.#isSkyflowFrameReady = true;
    const eventName = ELEMENT_EVENTS_TO_IFRAME.GET_ZIP_FILES + this.#metaData.uuid;
    if (this.#isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          this.#getSkyflowBearerToken()?.then((authToken) => {
            printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
              MessageType.LOG,
              this.#context.logLevel);
            this.#emitEvent(
              eventName,
              {
                data: {
                  containerId: this.#containerId,
                  element: input,
                  options,
                },
                clientConfig: {
                  vaultURL: this.#metaData?.clientJSON?.config?.vaultURL,
                  vaultID: this.#metaData?.clientJSON?.config?.vaultID,
                  authToken,
                },
                context: this.#context,
              },
            );

            window?.addEventListener('message', (event) => {
              // console.log('getZipFiles message event received in parent', event);
              if (event?.data?.name
                   === ELEMENT_EVENTS_TO_IFRAME.ZIP_FILES_RESPONSE + this.#containerId) {
                const revealData = event?.data?.data;
                if (revealData?.errors) {
                  printLog(
                    parameterizedString(logs?.errorLogs?.FAILED_ZIP_FILES),
                    MessageType.ERROR,
                    this.#context?.logLevel,
                  );
                  reject(revealData);
                } else {
                  printLog(
                    parameterizedString(logs?.infoLogs?.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context?.logLevel,
                  );
                  // console.log('revealData received in getZipFiles', revealData);
                  for (let index = 0; index < revealData?.fileCount; index += 1) {
                    console.log('creating reveal element for url', revealData?.fileUrls[index]);
                    elementsArray.push(
                      this.create({
                        skyflowID: revealData?.fileUrls[index]?.url as string,
                        column: revealData?.fileUrls[index]?.name as string,
                        table: revealData?.fileUrls[index]?.buffer,
                      },
                      options) as RevealElement,
                    );
                  }
                  // console.log('elementsArray in getZipFiles', elementsArray);
                  // elementsArray.forEach((element) => {
                  // console.log('elements ids in getZipFiles', element.getID());
                  // });
                  // send back the array of reveal elements ids
                  this.#emitEvent(
                    ELEMENT_EVENTS_TO_IFRAME.ZIP_FILES_ELEMENTS_ID + this.#containerId,
                    {
                      elementIds: elementsArray.map((element) => element.iframeName()),
                    },
                  );
                  resolve(elementsArray);
                }
              }
            });
          }).catch((err:any) => {
            printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
            reject(err);
          });
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
          reject(err);
        }
      });
    }
    return Promise.resolve(elementsArray);
  }
}
export default RevealContainer;
