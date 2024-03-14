/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import properties from '../../../properties';
import { Context, MessageType } from '../../../utils/common';
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

  constructor(record: IRevealElementInput,
    options: IRevealElementOptions = {},
    metaData: any, container: any, elementId: string, context: Context) {
    super();
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
      { metaData },
      this.#containerId,
      this.#context.logLevel,
    );
    this.#domSelecter = '';
    this.#isFrameReady = false;
    if (!this.#readyToMount) {
      this.#eventEmitter.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
        if (data?.containerId === this.#containerId) { this.#readyToMount = true; }
      });
    }
    bus.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name, (data) => {
      this.#iframe.setIframeHeight(data.height);
    });
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector) {
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        callback({
          ...this.#metaData,
          record: this.#recordData,
          context: this.#context,
        });
        updateMetricObjectValue(this.#elementId, METRIC_TYPES.DIV_ID, domElementSelector);
        pushElementEventWithTimeout(this.#elementId);

        bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
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
        this.#isMounted = true;
        if (Object.prototype.hasOwnProperty.call(this.#recordData, 'skyflowID')) {
          bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
            {}, (payload:any) => {
              this.#iframe.setIframeHeight(payload.height);
            });
        }
      }
    };

    if (this.#readyToMount) {
      this.#iframe.mount(domElementSelector);
      bus
        .target(properties.IFRAME_SECURE_ORGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.READY);
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_START_TIME, Date.now());
      return;
    }
    this.#eventEmitter?.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
      if (data?.containerId === this.#containerId) {
        this.#iframe.mount(domElementSelector);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
      }
    });
  }

  renderFile() {
    let altText = '';
    if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
      altText = this.#recordData.altText;
    }
    this.setAltText('loading...');
    if (this.#isMounted) {
      return new Promise((resolve, reject) => {
        try {
          this.#metaData.skyflowContainer.renderFile(
            this.#recordData, this.#metaData, this.#containerId, this.#iframe.name,
          ).then(
            (resolvedResult) => {
              printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                MessageType.LOG,
                this.#context.logLevel);
              printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                CLASS_NAME, this.#recordData.skyflowID),
              MessageType.LOG, this.#context.logLevel);
              resolve(formatForRenderClient(resolvedResult, this.#recordData.column as string));
            },
            (rejectedResult) => {
              printLog(logs.errorLogs.FAILED_RENDER, MessageType.ERROR,
                this.#context.logLevel);
              if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
                this.setAltText(altText);
              }
              reject(rejectedResult);
            },
          );
        } catch (error: any) {
          printLog(`Error: ${error.message}`, MessageType.ERROR,
            this.#context.logLevel);
          reject(error);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        bus
        // .target()
          .on(
            ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId, () => {
              this.#metaData.skyflowContainer.renderFile(
                this.#recordData, this.#metaData, this.#containerId, this.#iframe.name,
              ).then(
                (resolvedResult) => {
                  printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context.logLevel);
                  printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                    CLASS_NAME, this.#recordData.skyflowID),
                  MessageType.LOG, this.#context.logLevel);
                  resolve(formatForRenderClient(resolvedResult, this.#recordData.column as string));
                },
                (rejectedResult) => {
                  printLog(logs.errorLogs.FAILED_RENDER, MessageType.ERROR,
                    this.#context.logLevel);
                  if (Object.prototype.hasOwnProperty.call(this.#recordData, 'altText')) {
                    this.setAltText(altText);
                  }
                  reject(rejectedResult);
                },
              );
            },
          );
      } catch (error: any) {
        printLog(`Error: ${error.message}`, MessageType.ERROR,
          this.#context.logLevel);
        reject(error);
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

  setError(clientErrorText:string) {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR, {
      name: this.#iframe.name,
      isTriggerError: true,
      clientErrorText,
    });
    this.#isClientSetError = true;
  }

  resetError() {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR, {
      name: this.#iframe.name,
      isTriggerError: false,
    });
    this.#isClientSetError = false;
  }

  setAltText(altText:string) {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, {
      name: this.#iframe.name,
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: altText,
    });
  }

  clearAltText() {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, {
      name: this.#iframe.name,
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: null,
    });
  }

  setToken(token:string) {
    this.#recordData = {
      ...this.#recordData,
      token,
    };
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, {
      name: this.#iframe.name,
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
      updatedValue: token,
    });
  }

  unmount() {
    if (this.#recordData.skyflowID) {
      this.#isMounted = false;
      this.#iframe.container?.remove();
    }
    this.#iframe.unmount();
  }

  update(options) {
    this.#recordData = {
      ...this.#recordData,
      ...options,
    };
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, {
      name: this.#iframe.name,
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      updatedValue: options,
    });
  }
}

export default RevealElement;
