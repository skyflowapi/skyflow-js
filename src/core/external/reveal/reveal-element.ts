/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * This is the doc comment for RevealElement Module
 * @module RevealElement
 */
import bus from 'framebus';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import properties from '../../../properties';
import { Context, MessageType } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  FRAME_REVEAL, ELEMENT_EVENTS_TO_IFRAME, ELEMENT_EVENTS_TO_CONTAINER, REVEAL_ELEMENT_OPTIONS_TYPES,
} from '../../constants';
import IFrame from '../common/iframe';
import SkyflowElement from '../common/skyflow-element';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import { formatRevealElementOptions } from '../../../utils/helpers';

const CLASS_NAME = 'RevealElement';

/**
  * This is the documentation for RevealElement Class
  * @class RevealElement
  */
class RevealElement extends SkyflowElement {
  #iframe: IFrame;

  #metaData: any;

  #recordData: any;

  #containerId: string;

  #isMounted:boolean = false;

  #isClientSetError:boolean = false;

  #context: Context;

  #elementId: string;

  /**
  * Some documentation for constructor
  * @param record This is a description of the record parameter.
  * @param options This is a description of the options parameter.
  * @param metaData This is a description of the metaData parameter.
  * @param containerId This is a description of the containerId parameter.
  * @param elementId This is a description of the elementId parameter.
  * @param context This is a description of the context parameter.
  */
  constructor(record: IRevealElementInput,
    options: IRevealElementOptions = {},
    metaData: any, containerId: string, elementId: string, context: Context) {
    super();
    this.#elementId = elementId;
    this.#metaData = metaData;
    this.#recordData = {
      ...record,
      ...formatRevealElementOptions(options),
    };
    this.#containerId = containerId;
    this.#context = context;
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(uuid())}`,
      { metaData },
      this.#containerId,
      this.#context.logLevel,
    );
    printLog(parameterizedString(logs.infoLogs.CREATED_ELEMENT, CLASS_NAME, `${record.token || ''} reveal `), MessageType.LOG, this.#context.logLevel);
  }

  /** @internal */
  getID() {
    return this.#elementId;
  }

  /**
  * Some documentation for mount method
  * @param domElementSelector This is a description of the domElementSelector parameter.
  * @returns This is a description of what the method returns.
  */
  mount(domElementSelector) {
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }
    this.#iframe.mount(domElementSelector);
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
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
  }

  /** @internal */
  iframeName(): string {
    return this.#iframe.name;
  }

  /** @internal */
  isMounted():boolean {
    return this.#isMounted;
  }

  /** @internal */
  hasToken():boolean {
    if (this.#recordData.token) return true;
    return false;
  }

  /** @internal */
  isClientSetError():boolean {
    return this.#isClientSetError;
  }

  /** @internal */
  getRecordData() {
    return this.#recordData;
  }

  /**
  * Some documentation for setError method
  * @param clientErrorText This is a description of the clientErrorText parameter.
  * @returns This is a description of what the method returns.
  */
  setError(clientErrorText:string) {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR, {
      name: this.#iframe.name,
      isTriggerError: true,
      clientErrorText,
    });
    this.#isClientSetError = true;
  }

  /**
  * Some documentation for resetError method
  * @returns This is a description of what the method returns.
  */
  resetError() {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR, {
      name: this.#iframe.name,
      isTriggerError: false,
    });
    this.#isClientSetError = false;
  }

  /**
  * Some documentation for setAltText method
  * @param altText This is a description of the altText parameter.
  * @returns This is a description of what the method returns.
  */
  setAltText(altText:string) {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, {
      name: this.#iframe.name,
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: altText,
    });
  }

  /**
  * Some documentation for clearAltText method
  * @returns This is a description of what the method returns.
  */
  clearAltText() {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, {
      name: this.#iframe.name,
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: null,
    });
  }

  /**
  * Some documentation for setToken method
  * @param token This is a description of the token parameter.
  * @returns This is a description of what the method returns.
  */
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

  /**
  * Some documentation for unmount method
  * @returns This is a description of what the method returns.
  */
  unmount() {
    this.#iframe.unmount();
  }
}

export default RevealElement;
