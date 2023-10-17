/*
Copyright (c) 2022 Skyflow, Inc.
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
import {
  formatRevealElementOptions,
  initalizeMetricObject,
  pushElementEventWithTimeout,
  updateMetricObjectValue,
} from '../../../utils/helpers';

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
    initalizeMetricObject(metaData, elementId);
    updateMetricObjectValue(this.#elementId, 'element_type', 'REVEAL');
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(uuid())}`,
      { metaData },
      this.#containerId,
      this.#context.logLevel,
    );

    if (!this.#readyToMount) {
      this.#eventEmitter.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
        if (data?.containerId === this.#containerId) { this.#readyToMount = true; }
      });
    }
    printLog(parameterizedString(logs.infoLogs.CREATED_ELEMENT, CLASS_NAME, `${record.token || ''} reveal `), MessageType.LOG, this.#context.logLevel);
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector) {
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }
    updateMetricObjectValue(this.#elementId, 'div_id', domElementSelector);
    pushElementEventWithTimeout(this.#elementId);
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        updateMetricObjectValue(this.#elementId, 'events', 'FRAME_READY');
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
        updateMetricObjectValue(this.#elementId, 'mount_end_time', Date.now());
        updateMetricObjectValue(this.#elementId, 'events', 'MOUNTED');
      }
    };

    if (this.#readyToMount) {
      this.#iframe.mount(domElementSelector, this.#elementId);
      bus
        .target(properties.IFRAME_SECURE_ORGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
      return;
    }
    this.#eventEmitter?.on(ELEMENT_EVENTS_TO_CONTAINER.REVEAL_CONTAINER_MOUNTED, (data) => {
      if (data?.containerId === this.#containerId) {
        this.#iframe.mount(domElementSelector, this.#elementId);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
        updateMetricObjectValue(this.#elementId, 'mount_start_time', Date.now());
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
