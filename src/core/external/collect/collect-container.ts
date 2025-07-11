/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import iframer, { setAttributes, getIframeSrc, setStyles } from '../../../iframe-libs/iframer';
import deepClone from '../../../libs/deep-clone';
import {
  formatValidations, formatOptions, validateElementOptions,
} from '../../../libs/element-options';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import { ContainerType } from '../../../skyflow';
import {
  Context, MessageType,
  CollectElementInput,
  CollectElementOptions,
  CollectResponse,
  ICollectOptions,
  UploadFilesResponse,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  validateCollectElementInput, validateInitConfig,
  validateAdditionalFieldsInCollect,
  validateUpsertOptions,
  validateBooleanOptions,
} from '../../../utils/validators';
import {
  COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT,
  COLLECT_TYPES,
} from '../../constants';
import Container from '../common/container';
import CollectElement from './collect-element';
import EventEmitter from '../../../event-emitter';
import properties from '../../../properties';

// declare global {
//   interface Window {
//     _pendingCallbacks?: Record<string, (responseData: any) => void>;
//   }
// }
const CLASS_NAME = 'CollectContainer';
class CollectContainer extends Container {
  #containerId: string;

  #elements: Record<string, CollectElement> = {};

  #metaData: any;

  #context:Context;

  #skyflowElements:any;

  type:string = ContainerType.COLLECT;

  #eventEmitter: EventEmitter;

  #isMounted: boolean = false;

  #isSkyflowFrameReady: boolean = false;

  constructor(options, metaData, skyflowElements, context) {
    super();
    this.#isSkyflowFrameReady = metaData.skyflowContainer.isControllerFrameReady;
    this.#containerId = uuid();
    this.#metaData = {
      ...metaData,
      clientJSON: {
        ...metaData.clientJSON,
        config: {
          ...metaData.clientJSON.config,
          options: {
            ...metaData.clientJSON.config?.options,
            ...options,
          },
        },
      },
    };
    this.#skyflowElements = skyflowElements;
    this.#context = context;
    this.#eventEmitter = new EventEmitter();

    const clientDomain = this.#metaData.clientDomain || '';
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.#containerId}:${this.#context.logLevel}:${btoa(clientDomain)}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);

    this.#isMounted = true;
  }

  create = (input: CollectElementInput, options: CollectElementOptions = {
    required: false,
  }) => {
    validateCollectElementInput(input, this.#context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.#context.logLevel);
    const elementGroup = {
      rows: [
        {
          elements: [
            {
              elementType: input.type,
              name: input.column,
              accept: options.allowedFileType,
              ...input,
              ...formattedOptions,
              validations,
            },
          ],
        },
      ],
    };
    return this.#createMultipleElement(elementGroup, true);
  };

  #createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false,
  ) => {
    const elements: any[] = [];
    const tempElements = deepClone(multipleElements);
    tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const { elementType } = options;
        validateElementOptions(elementType, options);

        options.sensitive = options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern = options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        // options.elementName = `${options.table}.${options.name}:${btoa(uuid())}`;
        // options.elementName = (options.table && options.name) ? `${options.elementType}:${btoa(
        //   options.elementName,
        // )}` : `${options.elementType}:${btoa(uuid())}`;

        options.isMounted = false;

        if (
          options.elementType === ELEMENTS.radio.name
          || options.elementType === ELEMENTS.checkbox.name
        ) {
          options.elementName = `${options.elementName}:${btoa(options.value)}`;
        }

        options.elementName = `${FRAME_ELEMENT}:${options.elementType}:${btoa(uuid())}`;
        options.label = element.label;
        options.skyflowID = element.skyflowID;

        elements.push(options);
      });
    });

    tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_ELEMENT}:group:${btoa(tempElements.name)}`;

    if (
      isSingleElementAPI
      && !this.#elements[elements[0].elementName]
      && this.#hasElementName(elements[0].name)
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
    }

    let element = this.#elements[tempElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.updateElementGroup(elements[0]);
      } else {
        element.updateElementGroup(tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement(
        elementId,
        tempElements,
        this.#metaData,
        {
          containerId: this.#containerId,
          isMounted: this.#isMounted,
          type: this.type,
        },
        isSingleElementAPI,
        this.#destroyCallback,
        this.#updateCallback,
        this.#context,
        this.#eventEmitter,
      );
      this.#elements[tempElements.elementName] = element;
      this.#skyflowElements[elementId] = element;
    }

    if (!isSingleElementAPI) {
      elements.forEach((iElement) => {
        const name = iElement.elementName;
        if (!this.#elements[name]) {
          this.#elements[name] = this.create(iElement.elementType, iElement);
        } else {
          this.#elements[name].updateElementGroup(iElement);
        }
      });
    }
    return element;
  };

  #removeElement = (elementName: string) => {
    Object.keys(this.#elements).forEach((element) => {
      if (element === elementName) delete this.#elements[element];
    });
  };

  #destroyCallback = (elementNames: string[]) => {
    elementNames.forEach((elementName) => {
      this.#removeElement(elementName);
    });
  };

  #updateCallback = (elements: any[]) => {
    elements.forEach((element) => {
      if (this.#elements[element.elementName]) {
        this.#elements[element.elementName].updateElementGroup(element);
      }
    });
  };

  #hasElementName = (name: string) => {
    const tempElements = Object.keys(this.#elements);
    for (let i = 0; i < tempElements.length; i += 1) {
      if (atob(tempElements[i].split(':')[2]) === name) {
        return true;
      }
    }
    return false;
  };

  collect = (options: ICollectOptions = { tokens: true }): Promise<CollectResponse> => {
    this.#isSkyflowFrameReady = this.#metaData.skyflowContainer.isControllerFrameReady;
    const transId = uuid();
    if (this.#isSkyflowFrameReady) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          if (Object.keys(this.#elements).length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
          }
          this.#removeStaleElements();
          const collectElements = Object.values(this.#elements);
          const elementIds = Object.keys(this.#elements)
            .map((element, index) => ({
              frameId: element,
              elementId: element,
              shadowRoot: collectElements[index].getShadowRoot() !== null,
              transId,
            }));
          collectElements.forEach((element) => {
            if (!element.isMounted()) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
            }
            element.isValidElement();
          });
          if (Object.prototype.hasOwnProperty.call(options, 'tokens') && !validateBooleanOptions(options.tokens)) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
          }
          if (options?.additionalFields) {
            validateAdditionalFieldsInCollect(options.additionalFields);
          }
          if (options?.upsert) {
            validateUpsertOptions(options?.upsert);
          }
          const shadowRootElementsCount = collectElements.reduce((count, element) => {
            if (element.getShadowRoot() !== null) {
              return count + 1;
            }
            return count;
          }, 0);
          if (shadowRootElementsCount > 0) {
            const requestId = `req_${Math.random()}`;
            collectElements.forEach((element) => {
              if (element.getShadowRoot() != null) {
                element.emitEventFromShadowRoot(
                  ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, // + this.#containerId,
                  {
                    shadowRootElementsCount,
                    type: COLLECT_TYPES.COLLECT,
                    ...options,
                    tokens: options?.tokens !== undefined ? options.tokens : true,
                    elementIds,
                    containerId: this.#containerId,
                    requestId,
                    transId,
                  },
                );
              }
            });
            // eslint-disable-next-line prefer-template
            bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, {
              transId,
              clientId: this.#metaData.uuid,
            }, (data: any) => {
              // clearTimeout(timeout);
              if (!data || data?.error) {
                printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                reject(data?.error);
              } else {
                printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                  MessageType.LOG,
                  this.#context.logLevel);
                resolve(data);
              }
            });
          } else {
            bus
            // .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#metaData.uuid,
                {
                  type: COLLECT_TYPES.COLLECT,
                  ...options,
                  tokens: options?.tokens !== undefined ? options.tokens : true,
                  elementIds,
                  containerId: this.#containerId,
                },
                (data: any) => {
                  if (!data || data?.error) {
                    printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                    reject(data?.error);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);
                    resolve(data);
                  }
                },
              );
          }
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
          MessageType.LOG, this.#context.logLevel);
        } catch (err: any) {
          printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        if (Object.keys(this.#elements).length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
        }
        this.#removeStaleElements();
        const collectElements = Object.values(this.#elements);
        const elementIds = Object.keys(this.#elements)
          .map((element, index) => ({
            frameId: element,
            elementId: element,
            shadowRoot: collectElements[index].getShadowRoot() !== null,
            transId,
          }));
        collectElements.forEach((element) => {
          if (!element.isMounted()) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
          }
          element.isValidElement();
        });
        if (Object.prototype.hasOwnProperty.call(options, 'tokens') && !validateBooleanOptions(options.tokens)) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
        }
        if (options?.additionalFields) {
          validateAdditionalFieldsInCollect(options.additionalFields);
        }
        if (options?.upsert) {
          validateUpsertOptions(options?.upsert);
        }
        const shadowRootElementsCount = collectElements.reduce((count, element) => {
          if (element.getShadowRoot() !== null) {
            return count + 1;
          }
          return count;
        }, 0);
        if (shadowRootElementsCount > 0) {
          const requestId = `req_${Math.random()}`;
          collectElements.forEach((element) => {
            if (element.getShadowRoot() != null) {
              element.emitEventFromShadowRoot(
                ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, // + this.#containerId,
                {
                  shadowRootElementsCount,
                  type: COLLECT_TYPES.COLLECT,
                  ...options,
                  tokens: options?.tokens !== undefined ? options.tokens : true,
                  elementIds,
                  containerId: this.#containerId,
                  requestId,
                  transId,
                },
              );
            }
          });
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#containerId, () => {
              bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, {
                transId,
                clientId: this.#metaData.uuid,
              }, (data: any) => {
                // clearTimeout(timeout);
                if (!data || data?.error) {
                  printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(data?.error);
                } else {
                  printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context.logLevel);
                  resolve(data);
                }
              });
            });
          // eslint-disable-next-line prefer-template
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#containerId, () => {
              bus
              // .target(properties.IFRAME_SECURE_ORIGIN)
                .emit(
                  ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#metaData.uuid,
                  {
                    type: COLLECT_TYPES.COLLECT,
                    ...options,
                    tokens: options?.tokens !== undefined ? options.tokens : true,
                    elementIds,
                    containerId: this.#containerId,
                  },
                  (data: any) => {
                    if (!data || data?.error) {
                      printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                      reject(data?.error);
                    } else {
                      // eslint-disable-next-line max-len
                      printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                        MessageType.LOG,
                        this.#context.logLevel);

                      resolve(data);
                    }
                  },
                );
            });
        }
      } catch (err:any) {
        printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
        reject(err);
      }
    });
  };

  uploadFiles = (options: ICollectOptions) :Promise<UploadFilesResponse> => {
    this.#isSkyflowFrameReady = this.#metaData.skyflowContainer.isControllerFrameReady;
    const transId = uuid();
    if (this.#isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          if (Object.keys(this.#elements).length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
          }
          this.#removeStaleElements();
          const fileElements = Object.values(this.#elements);
          const elementIds = Object.keys(this.#elements)
            .map((element, index) => ({
              frameId: element,
              elementId: element,
              elementType: fileElements[index].elementType,
              shadowRoot: fileElements[index].getShadowRoot() !== null,
              transId,
            }));
          fileElements.forEach((element) => {
            if (!element.isMounted()) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
            }
            element.isValidElement();
          });
          const shadowRootElementsCount = fileElements.reduce((count, element) => {
            if (element.getShadowRoot() !== null
             && element.elementType === ELEMENTS.FILE_INPUT.name) {
              return count + 1;
            }
            return count;
          }, 0);
          if (shadowRootElementsCount > 0) {
            const requestId = `req_${Math.random()}`;
            fileElements.forEach((element) => {
              if (element.getShadowRoot() != null
                && element.elementType === ELEMENTS.FILE_INPUT.name) {
                element.emitEventFromShadowRoot(
                  ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, // + this.#containerId,
                  {
                    shadowRootElementsCount,
                    type: COLLECT_TYPES.FILE_UPLOAD,
                    ...options,
                    tokens: options?.tokens !== undefined ? options.tokens : true,
                    elementIds,
                    containerId: this.#containerId,
                    requestId,
                    transId,
                  },
                );
              }
            });
            bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, {
              transId,
              clientId: this.#metaData.uuid,
              type: COLLECT_TYPES.FILE_UPLOAD,
              ...options,
              elementIds,
              containerId: this.#containerId,
            }, (data: any) => {
              if (!data || data?.error) {
                printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                reject(data?.error);
              } else if (!data || data.errorResponse) {
                printLog(`${JSON.stringify(data)}`, MessageType.ERROR, this.#context.logLevel);
                reject(data);
              } else {
                printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                  MessageType.LOG,
                  this.#context.logLevel);
                resolve(data);
              }
            });
          } else {
            bus
            // .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#metaData.uuid,
                {
                  type: COLLECT_TYPES.FILE_UPLOAD,
                  ...options,
                  elementIds,
                  containerId: this.#containerId,
                },
                (data: any) => {
                  if (!data || data?.error) {
                    printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                    reject(data?.error);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);

                    resolve(data);
                  }
                },
              );
          }
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
          MessageType.LOG, this.#context.logLevel);
        } catch (err:any) {
          printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        if (Object.keys(this.#elements).length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
        }
        this.#removeStaleElements();
        const fileElements = Object.values(this.#elements);
        const elementIds = Object.keys(this.#elements)
          .map((element, index) => ({
            frameId: element,
            elementId: element,
            elementType: fileElements[index].elementType,
            shadowRoot: fileElements[index].getShadowRoot() !== null,
            transId,
          }));
        fileElements.forEach((element) => {
          if (!element.isMounted()) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
          }
          element.isValidElement();
        });
        const shadowRootElementsCount = fileElements.reduce((count, element) => {
          if (element.getShadowRoot() !== null
             && element.elementType === ELEMENTS.FILE_INPUT.name) {
            return count + 1;
          }
          return count;
        }, 0);
        if (shadowRootElementsCount > 0) {
          const requestId = `req_${Math.random()}`;
          fileElements.forEach((element) => {
            if (element.getShadowRoot() != null
                && element.elementType === ELEMENTS.FILE_INPUT.name) {
              element.emitEventFromShadowRoot(
                ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, // + this.#containerId,
                {
                  shadowRootElementsCount,
                  type: COLLECT_TYPES.FILE_UPLOAD,
                  ...options,
                  tokens: options?.tokens !== undefined ? options.tokens : true,
                  elementIds,
                  containerId: this.#containerId,
                  requestId,
                  transId,
                },
              );
            }
          });
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#containerId, () => {
              bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_INVOKE_REQUEST, {
                transId,
                clientId: this.#metaData.uuid,
                type: COLLECT_TYPES.FILE_UPLOAD,
                ...options,
                elementIds,
                containerId: this.#containerId,
              }, (data: any) => {
                if (!data || data?.error) {
                  printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(data?.error);
                } else if (data.errorResponse) {
                  printLog(`${JSON.stringify(data)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(data);
                } else {
                  printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context.logLevel);
                  resolve(data);
                }
              });
            });
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#containerId, () => {
              try {
                bus
                // .target(properties.IFRAME_SECURE_ORIGIN)
                  .emit(
                    ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#metaData.uuid,
                    {
                      type: COLLECT_TYPES.FILE_UPLOAD,
                      ...options,
                      elementIds,
                      containerId: this.#containerId,
                    },
                    (data: any) => {
                      if (!data || data?.error) {
                        printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                        reject(data?.error);
                      } else {
                        // eslint-disable-next-line max-len
                        printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                          MessageType.LOG,
                          this.#context.logLevel);

                        resolve(data);
                      }
                    },
                  );
                printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
                  CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
                MessageType.LOG, this.#context.logLevel);
              } catch (err:any) {
                printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
                reject(err);
              }
            });
        }
      } catch (err:any) {
        printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
        reject(err);
      }
    });
  };

  #removeStaleElements = (): void => {
    try {
      if (this.#hasNoElements()) return;

      const mountedIframeIds = this.#getMountedIframeIds();
      if (!mountedIframeIds.length) return;

      this.#removeUnmountedElements(mountedIframeIds);
    } catch (error) {
      printLog(`${error}`, MessageType.LOG, this.#context.logLevel);
    }
  };

  #hasNoElements = (): boolean => Object.keys(this.#elements).length === 0;

  #getMountedIframeIds = (): string[] => {
    const body = document?.body;
    if (!body) return [];

    const iframes = body.getElementsByTagName('iframe');
    if (!iframes?.length) return [];

    return Array.from(iframes).map((iframe) => iframe.id);
  };

  #removeUnmountedElements = (mountedIframeIds: string[]): void => {
    Object.entries(this.#elements).forEach(([key, element]) => {
      if (this.#shouldRemoveElement(element, mountedIframeIds)) {
        delete this.#elements[key];
      }
    });
  };

  #shouldRemoveElement = (
    element: CollectElement,
    mountedIframeIds: string[],
  ): boolean => (
    element.isMounted()
    && !mountedIframeIds.includes(element.iframeName())
    && !(element.getShadowRoot() === null)
    && !this.checkIfFrameExistsInShadowRoot(element.getShadowRoot(), element.iframeName())
  );

  // Check if the frame exists in the shadow root
  checkIfFrameExistsInShadowRoot = (
    shadowRoot: ShadowRoot | null,
    frameName: string,
  ): boolean => {
    if (!shadowRoot) return false;
    const frames = shadowRoot.querySelectorAll('iframe');
    return Array.from(frames).some((frame) => frame.name === frameName);
  };
}
export default CollectContainer;
