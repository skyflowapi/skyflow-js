/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
import bus from 'framebus';
import sum from 'lodash/sum';
import EventEmitter from '../../../event-emitter';
import iframer, { setAttributes, getIframeSrc, setStyles } from '../../../iframe-libs/iframer';
import deepClone from '../../../libs/deep-clone';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import properties from '../../../properties';
import { ContainerType } from '../../../skyflow';
import {
  Context, MessageType,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  validateInitConfig,
  validateInputFormatOptions,
  validateRevealElementRecords,
} from '../../../utils/validators';
import {
  COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT,
  COMPOSABLE_REVEAL,
  REVEAL_TYPES,
} from '../../constants';
import Container from '../common/container';

import ComposableRevealElement from './composable-reveal-element';
import { RevealElementInput, RevealResponse } from '../../../index-node';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import ComposableRevealInternalElement from './composable-reveal-internal';

const CLASS_NAME = 'ComposableRevealContainer';
class ComposableRevealContainer extends Container {
  #containerId: string;

  #elements: Record<string, any> = {};

  #metaData: any;

  #elementGroup: any = { rows: [] };

  #elementsList:any = [];

  #context:Context;

  #skyflowElements:any;

  #eventEmitter: EventEmitter;

  #isMounted: boolean = false;

  #options: any;

  #containerElement:any;

  type:string = ContainerType.COMPOSE_REVEAL;

  #containerMounted: boolean = false;

  #tempElements: any = {};

  #clientDomain: string = '';

  #isComposableFrameReady: boolean = false;

  #shadowRoot: ShadowRoot | null = null;

  #iframeID: string = '';

  #revealRecords: IRevealElementInput[] = [];

  #getSkyflowBearerToken: () => Promise<string> | undefined;

  constructor(options, metaData, skyflowElements, context) {
    super();
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
    this.#getSkyflowBearerToken = metaData.getSkyflowBearerToken;
    this.#skyflowElements = skyflowElements;
    this.#context = context;
    this.#options = options;
    this.#eventEmitter = new EventEmitter();

    this.#clientDomain = this.#metaData.clientDomain || '';
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.#containerId}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`,
      referrer: this.#clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
    this.#containerMounted = true;
    bus
      // .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.#containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.INITIALIZE_COMPOSABLE_CLIENT, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        callback({
          client: this.#metaData.clientJSON,
          context,
        });
        this.#isComposableFrameReady = true;
      });
    window.addEventListener('message', (event) => {
      if (event.data.type === ELEMENT_EVENTS_TO_CLIENT.MOUNTED
                  + this.#containerId) {
        this.#isComposableFrameReady = true;
      }
    });
  }

  create = (input: RevealElementInput, options?: IRevealElementOptions) => {
    const elementId = uuid();
    validateInputFormatOptions(options);

    const elementName = `${COMPOSABLE_REVEAL}:${btoa(elementId)}`;
    this.#elementsList?.push({
      name: elementName,
      ...input,
      elementName,
      elementId,
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.#tempElements ?? {})}:${this.#containerId}:${this.#context?.logLevel}:${btoa(this.#clientDomain ?? '')}`;
    return new ComposableRevealElement(elementName,
      this.#eventEmitter,
      controllerIframeName);
  };

  #createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false,
  ) => {
    try {
      const elements: any[] = [];
      this.#tempElements = deepClone(multipleElements);
      this.#tempElements?.rows?.forEach((row) => {
        row?.elements?.forEach((element) => {
          const options = element ?? {};
          const { elementType } = options;
          options.isMounted = false;

          options.label = element?.label;
          options.skyflowID = element?.skyflowID;

          elements.push(options);
        });
      });

      this.#tempElements.elementName = isSingleElementAPI
        ? elements[0].elementName
        : `${FRAME_ELEMENT}:group:${btoa(this.#tempElements)}`;
      if (
        isSingleElementAPI
        && !this.#elements[elements[0].elementName]
        && this.#hasElementName(elements[0].name)
      ) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
      }

      let element = this.#elements[this.#tempElements.elementName];
      if (element) {
        if (isSingleElementAPI) {
          element.update(elements[0]);
        } else {
          element.update(this.#tempElements);
        }
      } else {
        const elementId = uuid();
        try {
          element = new ComposableRevealInternalElement(
            elementId,
            this.#tempElements,
            this.#metaData,
            {
              containerId: this.#containerId,
              isMounted: this.#containerMounted,
              type: this.type,
              eventEmitter: this.#eventEmitter,
            },
            true,
            this.#context,
          );
          this.#elements[this.#tempElements.elementName] = element;
          this.#skyflowElements[elementId] = element;
        } catch (error: any) {
          printLog(logs.errorLogs.INVALID_REVEAL_COMPOSABLE_INPUT,
            MessageType.ERROR,
            this.#context.logLevel);
          throw error;
        }
      }
      this.#iframeID = element.iframeName();
      return element;
    } catch (error: any) {
      printLog(logs.errorLogs.INVALID_REVEAL_COMPOSABLE_INPUT,
        MessageType.ERROR,
        this.#context.logLevel);
      throw error;
    }
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

  mount = (domElement: HTMLElement | string) => {
    if (!domElement) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT,
        ['RevealElement'], true);
    }

    const { layout } = this.#options;
    if (sum(layout) !== this.#elementsList.length) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISMATCH_ELEMENT_COUNT_LAYOUT_SUM, [], true);
    }
    let count = 0;
    layout.forEach((rowCount, index) => {
      this.#elementGroup.rows = [
        ...this.#elementGroup.rows,
        { elements: [] },
      ];
      for (let i = 0; i < rowCount; i++) {
        this.#elementGroup.rows[index].elements.push(
          this.#elementsList[count],
        );
        count++;
      }
    });
    if (this.#options.styles) {
      this.#elementGroup.styles = {
        ...this.#options.styles,
      };
    }
    if (this.#options.errorTextStyles) {
      this.#elementGroup.errorTextStyles = {
        ...this.#options.errorTextStyles,
      };
    }
    if (this.#containerMounted) {
      this.#containerElement = this.#createMultipleElement(this.#elementGroup, false);
      this.#containerElement.mount(domElement);
      this.#isMounted = true;
    }
    if (domElement instanceof HTMLElement
      && (domElement as HTMLElement).getRootNode() instanceof ShadowRoot) {
      this.#shadowRoot = domElement.getRootNode() as ShadowRoot;
    } else if (typeof domElement === 'string') {
      const element = document.getElementById(domElement);
      if (element && element.getRootNode() instanceof ShadowRoot) {
        this.#shadowRoot = element.getRootNode() as ShadowRoot;
      }
    }
    if (this.#shadowRoot !== null) {
      this.#eventEmitter.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT, (data) => {
        this.#emitEvent(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + data.iframeName, {});
      });
      this.#emitEvent(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframeID, {});
    }
  };

  unmount = () => {
    this.#containerElement.unmount();
  };

  #emitEvent = (eventName: string, options?: Record<string, any>, callback?: any) => {
    if (this.#shadowRoot) {
      const iframe = this.#shadowRoot.getElementById(this.#iframeID) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          name: eventName,
          ...options,
        }, properties.IFRAME_SECURE_ORIGIN);
      }
    } else {
      const iframe = document.getElementById(this.#iframeID) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          name: eventName,
          ...options,
        }, properties.IFRAME_SECURE_ORIGIN);
      }
    }
  };

  reveal(): Promise<RevealResponse> {
    this.#revealRecords = [];
    if (this.#isComposableFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          if (!this.#elementsList || this.#elementsList.length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
          }
          printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          this.#elementsList.forEach((currentElement) => {
            // if (currentElement.isClientSetError()) {
            //   throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
            // }
            if (!currentElement.skyflowID) {
              this.#revealRecords.push(currentElement);
            }
          });
          validateRevealElementRecords(this.#revealRecords);
          const elementIds:{ frameId:string, token:string }[] = [];
          this.#elementsList.forEach((element) => {
            elementIds.push({
              frameId: element.name,
              token: element.token,
            });
          });
          this.#getSkyflowBearerToken()?.then((authToken) => {
            printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
              MessageType.LOG,
              this.#context.logLevel);
            this.#emitEvent(
              ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + this.#containerId,
              {
                data: {
                  type: REVEAL_TYPES.REVEAL,
                  containerId: this.#containerId,
                  elementIds,
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
              if (event?.data?.type
                 === ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId) {
                const revealData = event?.data?.data;
                if (revealData?.errors) {
                  printLog(
                    parameterizedString(logs?.errorLogs?.FAILED_REVEAL),
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
                  resolve(revealData);
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
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        if (!this.#elementsList || this.#elementsList.length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
        }
        printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        this.#elementsList.forEach((currentElement) => {
          // if (currentElement.isClientSetError()) {
          //   throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
          // }
          if (!currentElement.skyflowID) {
            this.#revealRecords.push(currentElement);
          }
        });
        validateRevealElementRecords(this.#revealRecords);
        const elementIds:{ frameId:string, token:string }[] = [];
        this.#elementsList.forEach((element) => {
          elementIds.push({
            frameId: element.name,
            token: element.token,
          });
        });
        this.#getSkyflowBearerToken()?.then((authToken) => {
          printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          window.addEventListener('message', (messagEevent) => {
            if (messagEevent.data.type === ELEMENT_EVENTS_TO_CLIENT.MOUNTED
                  + this.#containerId) {
              this.#emitEvent(
                ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + this.#containerId, {
                  data: {
                    type: REVEAL_TYPES.REVEAL,
                    containerId: this.#containerId,
                    elementIds,
                  },
                  clientConfig: {
                    vaultURL: this.#metaData.clientJSON.config.vaultURL,
                    vaultID: this.#metaData.clientJSON.config.vaultID,
                    authToken,
                  },
                  context: this.#context,
                },
              );
              window.addEventListener('message', (event) => {
                if (event.data.type
               === ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId) {
                  const revealData = event.data.data;
                  if (revealData.errors) {
                    printLog(parameterizedString(logs.errorLogs.FAILED_REVEAL),
                      MessageType.ERROR, this.#context.logLevel);
                    reject(revealData);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);
                    resolve(revealData);
                  }
                }
              });
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
}
export default ComposableRevealContainer;
