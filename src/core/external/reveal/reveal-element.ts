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
import getCssClassesFromJss, { generateCssWithoutClass } from '../../../libs/jss-styles';
import { formatForRenderClient, formatRecordsForRender } from '../../../core-utils/reveal';
import { setStyles } from '../../../iframe-libs/iframer';

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

  #renderFileAltText : HTMLSpanElement;

  #renderFileErrorText: HTMLSpanElement;

  #domSelecter: string;

  #isRenderFileCalled: boolean;

  #inputStyles!: object;

  #errorTextStyles!: object;

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
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(uuid())}`,
      { metaData },
      this.#containerId,
      this.#context.logLevel,
    );
    this.#isRenderFileCalled = false;
    this.#renderFileAltText = document.createElement('span');
    this.#renderFileErrorText = document.createElement('span');
    this.#domSelecter = '';
    this.#isFrameReady = false;
    if (!this.#readyToMount) {
      this.#eventEmitter.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
        if (data?.containerId === this.#containerId) { this.#readyToMount = true; }
      });
    }
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector) {
    this.#domSelecter = domElementSelector;
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }
    if (!this.#recordData.skyflowID || this.#isRenderFileCalled) {
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
        this.#iframe.mount(domElementSelector, {
          record: JSON.stringify({
            ...this.#metaData,
            record: this.#recordData,
            context: this.#context,
          }),
        });
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
        return;
      }
      this.#eventEmitter?.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
        if (data?.containerId === this.#containerId) {
          this.#iframe.mount(domElementSelector, {
            record: JSON.stringify({
              ...this.#metaData,
              record: this.#recordData,
              context: this.#context,
            }),
          });
          bus
            .target(properties.IFRAME_SECURE_ORGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
        }
      });
    } else if (this.#recordData.skyflowID) {
      this.#isMounted = true;
      this.#addRenderFilePreElement(domElementSelector);
    }
  }

  #addRenderFilePreElement(domElementSelector) {
    this.#renderFileAltText.className = `SkyflowElement-${this.#elementId}-${STYLE_TYPE.BASE}`;
    this.#renderFileErrorText.className = `SkyflowElement-${this.#elementId}error-${STYLE_TYPE.BASE}`;
    this.#updateFileRenderAltText(this.#recordData.altText);
    this.#updateErrorText('');
    this.#iframe.container = document.querySelector(domElementSelector);
    this.#iframe.container?.appendChild(this.#renderFileAltText);
    this.#iframe.container?.appendChild(this.#renderFileErrorText);
  }

  #updateErrorText(error: string) {
    getCssClassesFromJss(REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES, `${this.#elementId}error`);
    this.#renderFileErrorText.innerText = error;
    if (
      Object.prototype.hasOwnProperty.call(this.#recordData, 'errorTextStyles')
      && Object.prototype.hasOwnProperty.call(this.#recordData.errorTextStyles, STYLE_TYPE.BASE)
    ) {
      this.#errorTextStyles = {};
      this.#errorTextStyles[STYLE_TYPE.BASE] = {
        ...REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES[STYLE_TYPE.BASE],
        ...this.#recordData.errorTextStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#errorTextStyles, `${this.#elementId}error`);
      if (this.#recordData.errorTextStyles[STYLE_TYPE.GLOBAL]) {
        generateCssWithoutClass(this.#recordData.errorTextStyles[STYLE_TYPE.GLOBAL]);
      }
    } else {
      getCssClassesFromJss(
        REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
        `${this.#elementId}error`,
      );
    }
  }

  #updateFileRenderAltText(altText: string) {
    getCssClassesFromJss(RENDER_FILE_ELEMENT_ALT_TEXT_DEFAULT_STYLES, this.#elementId);
    this.#renderFileAltText.innerText = altText;
    if (Object.prototype.hasOwnProperty.call(this.#recordData, 'inputStyles')) {
      this.#inputStyles = {};
      this.#inputStyles[STYLE_TYPE.BASE] = {
        ...this.#recordData.inputStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#inputStyles, this.#elementId);
      if (this.#recordData.inputStyles[STYLE_TYPE.GLOBAL]) {
        generateCssWithoutClass(this.#recordData.inputStyles[STYLE_TYPE.GLOBAL]);
      }
    }
  }

  #removeFilePreElement(responseValue) {
    if (this.#iframe.container?.hasChildNodes()) {
      const nodeExists = this.#iframe.container?.querySelector('span');

      if (nodeExists) {
        this.#iframe.container?.removeChild(this.#renderFileAltText);
        this.#iframe.container?.removeChild(this.#renderFileErrorText);
        this.mount(this.#domSelecter);
        if (Object.prototype.hasOwnProperty.call(this.#recordData, 'inputStyles')) {
          this.#inputStyles = {};
          this.#inputStyles[STYLE_TYPE.BASE] = {
            ...this.#recordData.inputStyles[STYLE_TYPE.BASE],
          };
          setStyles(this.#iframe.iframe, this.#inputStyles[STYLE_TYPE.BASE]);
        }
        this.#iframe.setAttributess(responseValue);
      }
    }
  }

  renderFile() {
    this.#updateFileRenderAltText('loading...');
    this.#updateErrorText('');
    return new Promise((resolve, reject) => {
      if (this.#isMounted) {
        try {
          this.#metaData.skyflowContainer.renderFile(this.#recordData, this.#metaData).then(
            (resolvedResult) => {
              printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                MessageType.LOG,
                this.#context.logLevel);
              this.#isRenderFileCalled = true;
              const formattedResult = formatRecordsForRender(
                resolvedResult,
                this.#recordData.column,
                this.#recordData.skyflowID,
              );
              const responseValue = formattedResult.url as string;
              printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                CLASS_NAME, this.#recordData.skyflowID),
              MessageType.LOG, this.#context.logLevel);
              this.#removeFilePreElement(responseValue);
              resolve(formatForRenderClient(resolvedResult, this.#recordData.column as string));
            },
            (rejectedResult) => {
              printLog(logs.errorLogs.FAILED_RENDER, MessageType.ERROR,
                this.#context.logLevel);
              this.#isRenderFileCalled = true;
              this.#updateFileRenderAltText(this.#recordData.altText);
              this.#updateErrorText(DEFAULT_FILE_RENDER_ERROR);
              reject(rejectedResult);
            },
          );
        } catch (error: any) {
          printLog(`Error: ${error.message}`, MessageType.ERROR,
            this.#context.logLevel);
          reject(error);
        }
      } else {
        printLog(logs.errorLogs.ELEMENT_NOT_MOUNTED_RENDER, MessageType.ERROR,
          this.#context.logLevel);
        reject(logs.errorLogs.ELEMENT_NOT_MOUNTED_RENDER);
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
}

export default RevealElement;
