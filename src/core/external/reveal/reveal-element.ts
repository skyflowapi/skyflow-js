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
  FRAME_REVEAL, ELEMENT_EVENTS_TO_IFRAME, ELEMENT_EVENTS_TO_CONTAINER, REVEAL_ELEMENT_OPTIONS_TYPES, DEFAULT_FILE_RENDER_ERROR, STYLE_TYPE, RENDER_FILE_ELEMENT_ALT_TEXT_DEFAULT_STYLES, REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
} from '../../constants';
import IFrame from '../common/iframe';
import SkyflowElement from '../common/skyflow-element';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import { formatRevealElementOptions } from '../../../utils/helpers';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { validateInitConfig, validateRenderElementRecord } from '../../../utils/validators';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../../libs/jss-styles';

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

  renderFileAltText : HTMLSpanElement;

  renderFileErrorText: HTMLSpanElement;

  domSelecter: string;

  isRenderFileCalled: boolean;

  #inputStyles!: object;

  #errorTextStyles!: object;

  constructor(record: IRevealElementInput,
    options: IRevealElementOptions = {},
    metaData: any, container: any, elementId: string, context: Context) {
    super();
    this.#elementId = elementId;
    this.#metaData = metaData;
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
      this.#recordData,
    );
    this.isRenderFileCalled = false;
    this.renderFileAltText = document.createElement('span');
    this.renderFileErrorText = document.createElement('span');
    this.domSelecter = '';
    if (!this.#readyToMount) {
      this.#eventEmitter.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
        if (data?.containerId === this.#containerId) { this.#readyToMount = true; }
      });
    }
    const sub2 = (data) => {
      if (data.skyflowID === this.#recordData.skyflowID
        && data.column === this.#recordData.column && data.url !== '') {
        this.isRenderFileCalled = true;
        const responseValue = data.url as string;
        printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
          CLASS_NAME, this.#recordData.skyflowID), MessageType.LOG, this.#context.logLevel);
        this.removeFilePreElement(responseValue);
      } else if (data.url === '') {
        this.isRenderFileCalled = true;
        setTimeout(() => {
          this.updateFileRenderAltText(this.#recordData.altText);
          this.updateErrorText(DEFAULT_FILE_RENDER_ERROR);
        }, 1000);
      }
    };
    bus
      // .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY + this.#containerId,
        sub2,
      );
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector) {
    this.domSelecter = domElementSelector;
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }
    if (!this.#recordData.skyflowID || this.isRenderFileCalled) {
      const sub = (data, callback) => {
        if (data.name === this.#iframe.name) {
          callback({
            ...this.#metaData,
            record: this.#recordData,
            context: this.#context,
          });

          bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);

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
    } else if (this.#recordData.skyflowID) {
      this.#isMounted = true;
      this.addRenderFilePreElement(domElementSelector);
    }
  }

  addRenderFilePreElement(domElementSelector) {
    this.renderFileAltText.className = `SkyflowElement-span-${STYLE_TYPE.BASE}`;
    this.renderFileErrorText.className = `SkyflowElement-error-${STYLE_TYPE.BASE}`;
    this.updateFileRenderAltText(this.#recordData.altText);
    this.updateErrorText('');
    this.#iframe.container = document.querySelector(domElementSelector);
    this.#iframe.container?.appendChild(this.renderFileAltText);
    this.#iframe.container?.appendChild(this.renderFileErrorText);
  }

  updateErrorText(error: string) {
    this.renderFileErrorText.innerText = error;
    if (
      Object.prototype.hasOwnProperty.call(this.#recordData, 'errorTextStyles')
      && Object.prototype.hasOwnProperty.call(this.#recordData.errorTextStyles, STYLE_TYPE.BASE)
    ) {
      this.#errorTextStyles = {};
      this.#errorTextStyles[STYLE_TYPE.BASE] = {
        ...REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES[STYLE_TYPE.BASE],
        ...this.#recordData.errorTextStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#errorTextStyles, 'error');
      if (this.#recordData.errorTextStyles[STYLE_TYPE.GLOBAL]) {
        generateCssWithoutClass(this.#recordData.errorTextStyles[STYLE_TYPE.GLOBAL]);
      }
    } else {
      getCssClassesFromJss(
        REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
        'error',
      );
    }
  }

  updateFileRenderAltText(altText: string) {
    getCssClassesFromJss(RENDER_FILE_ELEMENT_ALT_TEXT_DEFAULT_STYLES, 'span');
    this.renderFileAltText.innerText = altText;
    if (Object.prototype.hasOwnProperty.call(this.#recordData, 'inputStyles')) {
      this.#inputStyles = {};
      this.#inputStyles[STYLE_TYPE.BASE] = {
        ...this.#recordData.inputStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#inputStyles, 'span');
      if (this.#recordData.inputStyles[STYLE_TYPE.GLOBAL]) {
        generateCssWithoutClass(this.#recordData.inputStyles[STYLE_TYPE.GLOBAL]);
      }
    }
  }

  removeFilePreElement(responseValue) {
    if (this.#iframe.container?.hasChildNodes()) {
      const nodeExists = this.#iframe.container?.querySelector('span');

      if (nodeExists) {
        this.#iframe.container?.removeChild(this.renderFileAltText);
        this.#iframe.container?.removeChild(this.renderFileErrorText);
        this.mount(this.domSelecter);
        this.#iframe.setAttributess(responseValue);
      }
    }
  }

  renderFile() {
    // this.mount(this.#iframe);
    this.updateFileRenderAltText('loading...');
    this.updateErrorText('');
    if (this.#isMounted) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          // validateRenderElementRecord(this.#recordData);
          // bus
          // // .target
          //   .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, (data, callback) => {
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + this.#containerId,
              {
                records: this.#recordData,
                metaData: this.#metaData.clientJSON,
              },
              (revealData: any) => {
                if (revealData.errors) {
                  printLog(logs.errorLogs.FAILED_RENDER, MessageType.ERROR,
                    this.#context.logLevel);
                  reject(revealData);
                } else {
                  printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context.logLevel);
                  resolve(revealData);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
          MessageType.LOG, this.#context.logLevel);
          // });
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR,
            this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        validateRenderElementRecord(this.#recordData);
        bus
        // .target(properties.IFRAME_SECURE_ORGIN)
          .emit(
            ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + this.#containerId,
            {
              records: this.#recordData,
              metaData: this.#metaData.clientJSON,
            },
            (revealData: any) => {
              if (revealData.errors) {
                printLog(logs.errorLogs.FAILED_RENDER, MessageType.ERROR,
                  this.#context.logLevel);
                reject(revealData);
              } else {
                printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                  MessageType.LOG,
                  this.#context.logLevel);
                resolve(revealData);
              }
            },
          );
        printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
          CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
        MessageType.LOG, this.#context.logLevel);
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR,
          this.#context.logLevel);
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
    this.#iframe.unmount();
  }
}

export default RevealElement;
