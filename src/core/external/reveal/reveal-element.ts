/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import { Context, MessageType, RenderFileResponse } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import {
  // eslint-disable-next-line max-len
  FRAME_REVEAL,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CONTAINER,
  REVEAL_ELEMENT_OPTIONS_TYPES,
  METRIC_TYPES,
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_TYPES,
  EVENT_TYPES,
  REVEAL_TYPES,
} from '../../constants';
import IFrame from '../common/iframe';
import SkyflowElement from '../common/skyflow-element';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import { formatRevealElementOptions } from '../../../utils/helpers';
import {
  initalizeMetricObject,
  pushElementEventWithTimeout,
  updateMetricObjectValue,
} from '../../../metrics';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { formatForRenderClient } from '../../../core-utils/reveal';
import properties from '../../../properties';
import { validateInitConfig, validateRenderElementRecord } from '../../../utils/validators';
import EventWrapper from '../../../utils/bus-events/event-wrapper';

const CLASS_NAME = 'RevealElement';

class RevealElement extends SkyflowElement {
  #iframe: IFrame;

  #metaData: any;

  #recordData: any;

  #containerId: any;

  #isMounted:boolean = false;

  #isClientSetError:boolean = false;

  #context: Context;

  #elementId: string;

  #readyToMount: boolean = false;

  #eventEmitter:any;

  #isFrameReady: boolean;

  #domSelecter: string;

  #clientId: string;

  #isSkyflowFrameReady: boolean = false;

  eventWrapper: EventWrapper;

  #skyflowFrameControllerId: string;

  #isShadowDom: boolean = true;

  #getSkyflowBearerToken: () => Promise<string> | undefined;

  constructor(record: IRevealElementInput,
    options: IRevealElementOptions = {},
    metaData: any, container: any, elementId: string, context: Context) {
    super();
    this.eventWrapper = new EventWrapper();
    this.#elementId = elementId;
    this.#metaData = metaData;
    this.#clientId = this.#metaData.uuid;
    this.#recordData = {
      ...record,
      ...formatRevealElementOptions(options),
    };
    this.#containerId = container.containerId;
    this.#readyToMount = container.isMounted;
    this.#eventEmitter = container.eventEmitter;
    this.#context = context;
    initalizeMetricObject(metaData, elementId);
    updateMetricObjectValue(this.#elementId, METRIC_TYPES.ELEMENT_TYPE_KEY, ELEMENT_TYPES.REVEAL);
    updateMetricObjectValue(this.#elementId, METRIC_TYPES.CONTAINER_NAME, ELEMENT_TYPES.REVEAL);
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(uuid())}`,
      metaData,
      this.#containerId,
      this.#context.logLevel,
    );
    this.#domSelecter = '';
    this.#isFrameReady = false;
    this.#readyToMount = true;
    this.#isSkyflowFrameReady = metaData.skyflowContainer.isControllerFrameReady;
    this.#skyflowFrameControllerId = metaData.skyflowContainer.skyflowFrameControllerName;
    this.#getSkyflowBearerToken = metaData.getSkyflowBearerToken;

    bus.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name, (data) => {
      this.#iframe.setIframeHeight(data.height);
    });
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type
        && event.data.type === ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name) {
        this.#iframe.setIframeHeight(event.data.data.height);
      }
    };
    this.eventWrapper
      .on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT
             + this.#iframe.name, () => {}, true, window, messageHandler);
    this.#recordData = {
      ...this.#recordData,
      iframeName: this.iframeName(),
    };
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector: HTMLElement | string) {
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }
    updateMetricObjectValue(this.#elementId, METRIC_TYPES.DIV_ID, domElementSelector);
    if (
      this.#metaData?.clientJSON?.config?.options?.trackMetrics
      && this.#metaData.clientJSON.config?.options?.trackingKey
    ) {
      pushElementEventWithTimeout(this.#elementId);
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
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type
          && event.data.type === ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name) {
          this.#isMounted = true;
          // eslint-disable-next-line no-underscore-dangle
          this.#eventEmitter._emit(
            ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
            {
              skyflowID: this.#recordData.skyflowID,
              containerId: this.#containerId,
              iframeName: this.#iframe.name,
            },
          );
        }
      };
      if (Object.prototype.hasOwnProperty.call(this.#recordData, 'skyflowID')) {
        this.eventWrapper
          .on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT
             + this.#iframe.name, () => {}, true, window, messageHandler);
      }
      this.eventWrapper.on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED
         + this.#iframe.name, () => {}, true, window, messageHandler);
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
  }

  renderFile(): Promise<RenderFileResponse> {
    this.#isSkyflowFrameReady = this.#metaData.skyflowContainer.isControllerFrameReady;
    let altText = '';
    if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
      altText = this.#recordData.altText;
    }
    this.setAltText('loading...');
    const loglevel = this.#context.logLevel;
    if (this.#isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
            MessageType.LOG,
            loglevel);
          validateRenderElementRecord(this.#recordData);
          if (this.#isShadowDom) {
            this.#emitRenderFileRequest(resolve, reject, altText);
          } else {
            bus
            // .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#metaData.uuid,
                {
                  type: REVEAL_TYPES.RENDER_FILE,
                  records: this.#recordData,
                  containerId: this.#containerId,
                  iframeName: this.#iframe.name,
                },
                (revealData: any) => {
                  if (revealData.errors) {
                    printLog(parameterizedString(
                      logs.errorLogs.FAILED_RENDER,
                    ), MessageType.ERROR,
                    this.#context.logLevel);
                    if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
                      this.setAltText(altText);
                    }
                    reject(formatForRenderClient(revealData, this.#recordData.column as string));
                  } else {
                    printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);
                    printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                      CLASS_NAME, this.#recordData.skyflowID),
                    MessageType.LOG, this.#context.logLevel);
                    resolve(formatForRenderClient(revealData, this.#recordData.column as string));
                  }
                },
              );
          }
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
        validateRenderElementRecord(this.#recordData);
        if (this.#isShadowDom) {
          const messageHandler = (event: MessageEvent) => {
            if (event.data && event.data.type
              && event.data.type === ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_CONTROLLER_READY
        + this.#metaData.uuid) {
              this.#isSkyflowFrameReady = true;
              if (this.#isSkyflowFrameReady) {
                this.#emitRenderFileRequest(resolve, reject, altText);
              }
            }
          };
          this.eventWrapper.on(
            ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_CONTROLLER_READY
        + this.#containerId, () => {}, true, window, messageHandler,
          );
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(
              ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#metaData.uuid, () => {
                bus
                // .target(properties.IFRAME_SECURE_ORIGIN)
                  .emit(
                    ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#metaData.uuid,
                    {
                      type: REVEAL_TYPES.RENDER_FILE,
                      records: this.#recordData,
                      containerId: this.#containerId,
                      iframeName: this.#iframe.name,
                    },
                    (revealData: any) => {
                      if (revealData.errors) {
                        printLog(parameterizedString(
                          logs.errorLogs.FAILED_RENDER,
                        ), MessageType.ERROR,
                        this.#context.logLevel);
                        if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
                          this.setAltText(altText);
                        }
                        reject(
                          formatForRenderClient(revealData, this.#recordData.column as string),
                        );
                      } else {
                        printLog(
                          parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                          MessageType.LOG,
                          this.#context.logLevel,
                        );
                        printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                          CLASS_NAME, this.#recordData.skyflowID),
                        MessageType.LOG, this.#context.logLevel);
                        resolve(
                          formatForRenderClient(revealData, this.#recordData.column as string),
                        );
                      }
                    },
                  );
                printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
                  CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
                MessageType.LOG, loglevel);
              },
            );
        }
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

  #emitRenderFileRequest(resolve, reject, altText) {
    this.#getSkyflowBearerToken()?.then((token:string) => {
      const payload = {
        data: {
          type: REVEAL_TYPES.RENDER_FILE,
          records: this.#recordData,
          containerId: this.#containerId,
          iframeName: this.#iframe.name,
        },
        skyflowConfig: {
          client: {
            config: {
              vaultID: this.#metaData.clientJSON.config.vaultID || '',
              vaultURL: this.#metaData.clientJSON.config.vaultURL || '',
              token: this.#metaData.clientJSON.config.token || '',
            },
            bearerToken: token,
          },
          context: this.#context,
        },
      };
      this.eventWrapper.emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_CALL_WINDOW_REQUEST
           + this.#metaData.uuid, payload, undefined, true,
      this.#skyflowFrameControllerId, undefined, false);

      const messageHandler = (event: MessageEvent) => {
        this.#handleRevealSuccess(event, resolve, reject, altText);
      };
      this.eventWrapper
        .on(ELEMENT_EVENTS_TO_IFRAME.RENDER_CALL_WINDOW_RESPONSE
             + this.#metaData.uuid, () => {}, true, window, messageHandler);
    }).catch((tokenError) => {
      printLog(`${JSON.stringify(tokenError)}`, MessageType.ERROR, this.#context.logLevel);
      reject(tokenError);
    });
  }

  #handleRevealSuccess =
  (event: MessageEvent, resolve: Function, reject: Function, altText): void => {
    if (event.data && event.data.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_CALL_WINDOW_RESPONSE
       + this.#metaData.uuid) {
      const revealData = event.data.data;
      if (revealData.error) {
        printLog(parameterizedString(
          logs.errorLogs.FAILED_RENDER,
        ), MessageType.ERROR,
        this.#context.logLevel);
        if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
          this.setAltText(altText);
        }
        reject(formatForRenderClient(revealData, this.#recordData.column as string));
      } else {
        printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
          CLASS_NAME, this.#recordData.skyflowID),
        MessageType.LOG, this.#context.logLevel);
        resolve(formatForRenderClient(revealData, this.#recordData.column as string));
      }
    }
  };

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

  update(options: IRevealElementInput) {
    this.#recordData = {
      ...this.#recordData,
      ...options,
    };

    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
        name: this.#iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
        updatedValue: options,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#iframe.name, {
            name: this.#iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
            updatedValue: options,
          });
        });
    }
  }
}

export default RevealElement;
