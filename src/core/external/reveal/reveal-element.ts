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
  FRAME_REVEAL, ELEMENT_EVENTS_TO_IFRAME, ELEMENT_EVENTS_TO_CONTAINER, REVEAL_ELEMENT_OPTIONS_TYPES, ELEMENT_EVENTS_TO_CLIENT,
} from '../../constants';
import IFrame from '../common/iframe';
import SkyflowElement from '../common/skyflow-element';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import { formatRevealElementOptions } from '../../../utils/helpers';
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

  resizeObserver: ResizeObserver | null;

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
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(uuid())}`,
      { metaData },
      this.#containerId,
      this.#context.logLevel,
    );
    this.#domSelecter = '';
    this.#isFrameReady = false;
    this.resizeObserver = null;
    if (!this.#readyToMount) {
      this.#eventEmitter.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
        if (data?.containerId === this.#containerId) { this.#readyToMount = true; }
      });
    }
    this.resizeObserver = new ResizeObserver(() => {
      bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
        {}, (payload:any) => {
          this.#iframe.setIframeHeight(payload.height);
        });
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

        bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);

        bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
          {}, (payload:any) => {
            this.#iframe.setIframeHeight(payload.height);
          });
        bus
        // .target(location.origin)
          .emit(
            ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
            {
              id: this.#recordData.token,
              containerId: this.#containerId,
            },
          );
        this.#isMounted = true;
      }
    };

    if (this.#readyToMount) {
      this.#iframe.mount(domElementSelector);
      bus
        .target(properties.IFRAME_SECURE_ORGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
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
    if (typeof domElementSelector === 'string') {
      const targetElement = document.querySelector(domElementSelector);
      if (targetElement) {
        this.resizeObserver?.observe(targetElement);
      }
    } else if (domElementSelector instanceof HTMLElement) {
      this.resizeObserver?.observe(domElementSelector);
    }
  }

  renderFile() {
    this.setAltText('loading...');
    if (this.#isMounted) {
      return new Promise((resolve, reject) => {
        try {
          this.#metaData.skyflowContainer.renderFile(
            this.#recordData, this.#metaData, this.#containerId,
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
                this.#recordData, this.#metaData, this.#containerId,
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
    if (this.resizeObserver) {
      this.resizeObserver?.disconnect();
    }
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
