/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import { Context, MessageType, RenderFileResponse } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CONTAINER,
  REVEAL_ELEMENT_OPTIONS_TYPES,
  METRIC_TYPES,
  ELEMENT_EVENTS_TO_CLIENT,
  EVENT_TYPES,
  REVEAL_TYPES,
  COMPOSABLE_REVEAL,
} from '../../constants';
import IFrame from '../common/iframe';
import SkyflowElement from '../common/skyflow-element';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import {
  pushElementEventWithTimeout,
  updateMetricObjectValue,
} from '../../../metrics';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import properties from '../../../properties';
import { validateInitConfig, validateRenderElementRecord } from '../../../utils/validators';
import EventEmitter from '../../../event-emitter';
import { formatRevealElementOptions } from '../../../utils/helpers';
import { Metadata, RevealContainerProps } from '../../internal/internal-types';

const CLASS_NAME = 'RevealElementInteranalElement';

export interface RevealComposableGroup{
  record: IRevealElementInput
  options: IRevealElementOptions
}

class ComposableRevealInternalElement extends SkyflowElement {
  #iframe: IFrame;

  #metaData: Metadata;

  #recordData: any;

  #containerId: string;

  #isMounted:boolean = false;

  #isClientSetError:boolean = false;

  #context: Context;

  #elementId: string;

  resizeObserver: ResizeObserver | null;

  #readyToMount: boolean = false;

  #eventEmitter: EventEmitter;

  #shadowRoot: ShadowRoot | null = null;

  #getSkyflowBearerToken: () => Promise<string> | undefined;

  #isComposableFrameReady: boolean = false;

  constructor(elementId: string,
    recordGroup: RevealComposableGroup[],
    metaData: Metadata,
    container: RevealContainerProps,
    context: Context) {
    super();
    this.#elementId = elementId;
    this.#metaData = metaData;
    this.resizeObserver = null;
    this.#recordData = recordGroup;
    this.#containerId = container?.containerId;
    this.#readyToMount = container?.isMounted ?? true;
    this.#eventEmitter = container?.eventEmitter;
    this.#context = context;

    this.#iframe = new IFrame(
      `${COMPOSABLE_REVEAL}:${btoa(uuid())}`,
      metaData,
      this.#containerId,
      this.#context?.logLevel,
    );

    this.#readyToMount = true;
    this.#getSkyflowBearerToken = metaData?.getSkyflowBearerToken;

    bus?.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe?.name, (data) => {
      this.#iframe?.setIframeHeight(data?.height);
    });

    window?.addEventListener('message', (event) => {
      if (event?.data?.type === ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + this.#iframe?.name) {
        this.#iframe?.setIframeHeight(event?.data?.data?.height);
      }
    });

    // eslint-disable-next-line max-len
    if (this.#recordData?.rows) {
      this.setupRenderFileEventListener(this.getRecordData()?.rows);
    }
  }

  private setupRenderFileEventListener(rows: any[]): void {
    if (!rows?.length) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REVEAL_COMPOSABLE_INPUT, ['COMPOSABLE_REVEAL'], true);
    }

    try {
      rows?.forEach((row, rowIndex) => {
        row?.elements?.forEach((element: any, elementIndex: number) => {
          if (!element?.name) return;
          window?.addEventListener('message', (event) => {
            if (event?.data?.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                        + element?.name) {
              this.#isComposableFrameReady = true;
            }
          });
          this.#eventEmitter?.on(
            `${ELEMENT_EVENTS_TO_IFRAME?.RENDER_FILE_REQUEST}:${element?.name}`,
            (data, callback) => {
              this.renderFile(element)?.then((response) => {
                callback?.(response);
              })?.catch((error) => {
                callback?.({ error });
              });
            },
          );
          this.#eventEmitter?.on(
            `${ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS}:${element?.name}`,
            (data) => {
              if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS) {
              // make this change in original elememt that is inside rows
                const updatedElement = {
                  ...element,
                  ...data.options,
                  ...formatRevealElementOptions(data.options as IRevealElementOptions),
                };

                // Update element in this.#recordData.rows structure
                if (this.#recordData?.rows?.[rowIndex]?.elements?.[elementIndex]) {
                  this.#recordData.rows[rowIndex].elements[elementIndex] = updatedElement;
                }

                // Update local element reference
                element = updatedElement;

                // Call update method
                this.update(data.options, element);
              }
            },
          );
        });
      });
    } catch (error) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REVEAL_COMPOSABLE_INPUT, ['COMPOSABLE_REVEAL'], true);
    }
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector: HTMLElement | string) {
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }

    if (domElementSelector instanceof HTMLElement) {
      this.resizeObserver = new ResizeObserver(() => {
        const iframeElements = domElementSelector.getElementsByTagName('iframe');
        if (iframeElements && iframeElements.length > 0) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < iframeElements.length; i++) {
            const iframeElement = iframeElements[i];
            if (
              iframeElement.name === this.#iframe.name
              && iframeElement.contentWindow
            ) {
              iframeElement?.contentWindow?.postMessage(
                {
                  name: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
                },
                properties.IFRAME_SECURE_ORIGIN,
              );
            }
          }
        }
      });
    }

    updateMetricObjectValue(this.#elementId, METRIC_TYPES.DIV_ID, domElementSelector);
    if (
      this.#metaData?.clientJSON?.config?.options?.trackMetrics
      && this.#metaData.clientJSON.config?.options?.trackingKey
    ) {
      pushElementEventWithTimeout(this.#elementId);
    }

    if (typeof domElementSelector === 'string') {
      const targetElement = document.querySelector(domElementSelector);
      if (targetElement) {
        this.resizeObserver?.observe(targetElement);
      }
    } else if (domElementSelector instanceof HTMLElement) {
      this.resizeObserver?.observe(domElementSelector);
    }

    this.#readyToMount = true;
    if (this.#readyToMount) {
      this.#iframe.mount(domElementSelector, undefined, {
        record: JSON.stringify({
          ...this.#metaData,
          record: this.#recordData,
          context: this.#context,
          containerId: this.#containerId,
        }),
      });
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          if (this.#recordData.skyflowID) {
            bus
            // .target(location.origin)
              .emit(
                ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
                {
                  skyflowID: this.#recordData.skyflowID,
                  containerId: this.#containerId,
                },
              );
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
          } else {
            bus
            // .target(location.origin)
              .emit(
                ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
                {
                  id: this.#recordData.token,
                  containerId: this.#containerId,
                },
              );
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
          }
          if (Object.prototype.hasOwnProperty.call(this.#recordData, 'skyflowID')) {
            bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
              {}, (payload:any) => {
                this.#iframe.setIframeHeight(payload.height);
              });
          }
        });
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.READY);
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_START_TIME, Date.now());
    }
    if (domElementSelector instanceof HTMLElement
      && (domElementSelector as HTMLElement).getRootNode() instanceof ShadowRoot) {
      this.#shadowRoot = domElementSelector.getRootNode() as ShadowRoot;
    } else if (typeof domElementSelector === 'string') {
      const element = document.getElementById(domElementSelector);
      if (element && element.getRootNode() instanceof ShadowRoot) {
        this.#shadowRoot = element.getRootNode() as ShadowRoot;
      }
    }
  }

  #emitEvent = (eventName: string, options?: Record<string, any>) => {
    if (this.#shadowRoot) {
      const iframe = this.#shadowRoot?.getElementById(this.#iframe?.name) as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage({
        name: eventName,
        ...options,
      }, properties?.IFRAME_SECURE_ORIGIN);
    } else {
      const iframe = document?.getElementById(this.#iframe?.name) as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage({
        name: eventName,
        ...options,
      }, properties?.IFRAME_SECURE_ORIGIN);
    }
  };

  renderFile(recordData: any): Promise<RenderFileResponse> {
    let altText = '';
    if (Object.prototype.hasOwnProperty.call(recordData, 'altText')) {
      altText = recordData.altText;
    }
    this.setAltText('loading...');
    const loglevel = this.#context.logLevel;
    if (this.#isComposableFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
            MessageType.LOG,
            loglevel);
          validateRenderElementRecord(recordData);

          this.#getSkyflowBearerToken()?.then((authToken) => {
            printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
              MessageType.LOG,
              this.#context.logLevel);
            this.#emitEvent(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + recordData.name,
              {
                data: {
                  type: REVEAL_TYPES.RENDER_FILE,
                  containerId: this.#containerId,
                  iframeName: recordData.name,
                },
                clientConfig: {
                  vaultURL: this.#metaData.clientJSON.config.vaultURL,
                  vaultID: this.#metaData.clientJSON.config.vaultID,
                  authToken,
                },
              },
            );
            window?.addEventListener('message', (event) => {
              if (event?.data && event?.data?.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE
       + recordData.name) {
                if (event?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
                  const revealData = event?.data?.data?.result;
                  if (revealData?.error || revealData?.errors) {
                    printLog(parameterizedString(
                      logs.errorLogs.FAILED_RENDER,
                    ), MessageType.ERROR,
                    this.#context.logLevel);
                    if (Object.prototype.hasOwnProperty.call(recordData, 'altText')) {
                      this.setAltText(altText);
                    }
                    reject(revealData?.error || revealData?.errors);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);
                    printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                      CLASS_NAME, recordData.skyflowID),
                    MessageType.LOG, this.#context.logLevel);
                    resolve(revealData);
                  }
                }
              }
            });
          }).catch((err:any) => {
            printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
            reject(err);
          });
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
          MessageType.LOG, loglevel);
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR,
            loglevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
          MessageType.LOG,
          loglevel);
        validateRenderElementRecord(recordData);
        window.addEventListener('message', (event) => {
          if (event.data.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                  + recordData?.name) {
            this.#isMounted = true;
            this.#getSkyflowBearerToken()?.then((authToken) => {
              printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
                MessageType.LOG,
                this.#context.logLevel);
              this.#emitEvent(
                ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + recordData.name,
                {
                  data: {
                    type: REVEAL_TYPES.RENDER_FILE,
                    containerId: this.#containerId,
                    iframeName: recordData.name,
                  },
                  clientConfig: {
                    vaultURL: this.#metaData.clientJSON.config.vaultURL,
                    vaultID: this.#metaData.clientJSON.config.vaultID,
                    authToken,
                  },
                },
              );
              window.addEventListener('message', (event1) => {
                if (event1?.data
                         && event1?.data?.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE
             + recordData.name) {
                  if (event1?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
                    const revealData = event1?.data?.data?.result;
                    if (revealData?.error) {
                      printLog(parameterizedString(
                        logs.errorLogs.FAILED_RENDER,
                      ), MessageType.ERROR,
                      this.#context.logLevel);
                      if (Object.prototype.hasOwnProperty.call(recordData, 'altText')) {
                        this.setAltText(altText);
                      }
                      reject(revealData);
                    } else {
                      // eslint-disable-next-line max-len
                      printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                        MessageType.LOG,
                        this.#context.logLevel);
                      printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                        CLASS_NAME, recordData.skyflowID),
                      MessageType.LOG, this.#context.logLevel);
                      resolve(revealData);
                    }
                  }
                }
              });
            }).catch((err:any) => {
              printLog(`${err?.message}`, MessageType.ERROR, this.#context.logLevel);
              reject(err);
            });
          }
        });
        printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
          CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
        MessageType.LOG, loglevel);
      } catch (err: any) {
        printLog(`Error: ${err?.message}`, MessageType.ERROR,
          loglevel);
        reject(err);
      }
    });
  }

  iframeName(): string {
    return this.#iframe.name;
  }

  isMounted():boolean {
    return this.#isMounted;
  }

  hasToken():boolean {
    if (this.#recordData.token) return true;
    return false;
  }

  isClientSetError():boolean {
    return this.#isClientSetError;
  }

  getRecordData() {
    return this.#recordData;
  }

  setErrorOverride(clientErrorText: string) {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#iframe.name, {
        name: this.#iframe.name,
        isTriggerError: true,
        clientErrorText,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#iframe.name, {
            name: this.#iframe.name,
            isTriggerError: true,
            clientErrorText,
          });
        });
    }
    this.#isClientSetError = true;
  }

  setError(clientErrorText:string) {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#iframe.name, {
        name: this.#iframe.name,
        isTriggerError: true,
        clientErrorText,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#iframe.name, {
            name: this.#iframe.name,
            isTriggerError: true,
            clientErrorText,
          });
        });
    }
    this.#isClientSetError = true;
  }

  resetError() {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#iframe.name, {
        name: this.#iframe.name,
        isTriggerError: false,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#iframe.name, {
            name: this.#iframe.name,
            isTriggerError: false,
          });
        });
    }
    this.#isClientSetError = false;
  }

  setAltText(altText:string) {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
        name: this.#iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
        updatedValue: altText,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
            name: this.#iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
            updatedValue: altText,
          });
        });
    }
  }

  clearAltText() {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
        name: this.#iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
        updatedValue: null,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
            name: this.#iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
            updatedValue: null,
          });
        });
    }
  }

  setToken(token:string) {
    this.#recordData = {
      ...this.#recordData,
      token,
    };
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
        name: this.#iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
        updatedValue: token,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
            name: this.#iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
            updatedValue: token,
          });
        });
    }
  }

  unmount() {
    if (this.#recordData.skyflowID) {
      this.#isMounted = false;
      this.#iframe.container?.remove();
    }
    this.#isMounted = false;
    this.#iframe.unmount();
  }

  update(options: IRevealElementInput | IRevealElementOptions, record) {
    if (this.#isComposableFrameReady) {
      this.#emitEvent(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
        {
          name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
          updatedValue: options,
        },
      );
    } else {
      window.addEventListener('message', (event) => {
        if (event.data.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                  + record?.name) {
          this.#emitEvent(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
            {
              name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
              updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
              updatedValue: options,
            },
          );
        }
      });
    }
  }
}

export default ComposableRevealInternalElement;
