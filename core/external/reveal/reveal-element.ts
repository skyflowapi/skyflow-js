/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import uuid from '@core/libs/uuid';
import EventEmitter from '@core/event-emitter';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
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
  CUSTOM_ERROR_MESSAGES,
} from '@core/constants';
import properties from '@core/properties';
import SkyflowElement from '@core/external/common/skyflow-element';
import SkyflowError from '@core/errors';
import {
  initalizeMetricObject,
  pushElementEventWithTimeout,
  updateMetricObjectValue,
} from '@core/metrics';
import IFrame from '@core/external/common/iframe';
import {
  Context, ErrorType, IRevealElementOptions, ICoreMetadata, RevealContainerProps,
} from '@core/types';
import { formatRevealElementOptions } from '@core/helpers';

// Shared reveal-element base. Holds the iframe/mount/update/error DOM+bus
// machinery common to both SDKs. Generic over the reveal-input shape (`TInput`)
// since that diverges per package. The privacyDB file-render feature
// (`renderFile`, which pulls in package-only reveal transport) lives in the
// skyflow-js subclass; flowDB binds the generic and adds nothing.
class RevealElement<TInput = any> extends SkyflowElement {
  protected iframe: IFrame;

  protected metaData: ICoreMetadata;

  protected recordData: any;

  protected containerId: string;

  #isMounted:boolean = false;

  #isClientSetError:boolean = false;

  protected context: Context;

  #elementId: string;

  #readyToMount: boolean = false;

  #eventEmitter: EventEmitter;

  #isFrameReady: boolean;

  #domSelecter: string;

  #clientId: string;

  protected customerErrorMessages: Partial<Record<ErrorType, string>> = {};

  constructor(
    record: TInput,
    options: IRevealElementOptions = {},
    metaData: ICoreMetadata,
    container: RevealContainerProps,
    elementId: string,
    context: Context,
  ) {
    super();
    this.#elementId = elementId;
    this.metaData = metaData;
    this.#clientId = this.metaData.uuid;
    this.recordData = {
      ...record,
      ...formatRevealElementOptions(options),
    };
    this.containerId = container.containerId;
    this.#readyToMount = container.isMounted;
    this.#eventEmitter = container.eventEmitter;
    this.context = context;
    initalizeMetricObject(metaData, elementId);
    updateMetricObjectValue(this.#elementId, METRIC_TYPES.ELEMENT_TYPE_KEY, ELEMENT_TYPES.REVEAL);
    updateMetricObjectValue(this.#elementId, METRIC_TYPES.CONTAINER_NAME, ELEMENT_TYPES.REVEAL);
    this.iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(uuid())}`,
      metaData,
      this.containerId,
      this.context.logLevel,
    );
    this.#domSelecter = '';
    this.#isFrameReady = false;
    this.#readyToMount = true;
    bus.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.iframe.name, (data) => {
      this.iframe.setIframeHeight(data.height);
    });
    this.#eventEmitter.on(`${CUSTOM_ERROR_MESSAGES}:${this.containerId}`, (data) => {
      if (data?.errorMessages) {
        this.customerErrorMessages = data.errorMessages as Record<ErrorType, string>;
      }
    });
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
      this.metaData?.clientJSON?.config?.options?.trackMetrics
      && this.metaData.clientJSON.config?.options?.trackingKey
    ) {
      pushElementEventWithTimeout(this.#elementId);
    }

    this.#readyToMount = true;
    if (this.#readyToMount) {
      this.iframe.mount(domElementSelector, undefined, {
        record: JSON.stringify({
          ...this.metaData,
          record: this.recordData,
          context: this.context,
          containerId: this.containerId,
        }),
      });
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          if (this.recordData.skyflowID) {
            bus
            // .target(location.origin)
              .emit(
                ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.containerId,
                {
                  skyflowID: this.recordData.skyflowID,
                  containerId: this.containerId,
                },
              );
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
          } else {
            bus
            // .target(location.origin)
              .emit(
                ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.containerId,
                {
                  id: this.recordData.token,
                  containerId: this.containerId,
                },
              );
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
          }
          if (Object.prototype.hasOwnProperty.call(this.recordData, 'skyflowID')) {
            bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.iframe.name,
              {}, (payload:any) => {
                this.iframe.setIframeHeight(payload.height);
              });
          }
        });
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.READY);
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_START_TIME, Date.now());
    }
  }

  iframeName(): string {
    return this.iframe.name;
  }

  isMounted():boolean {
    return this.#isMounted;
  }

  hasToken():boolean {
    if (this.recordData.token) return true;
    return false;
  }

  isClientSetError():boolean {
    return this.#isClientSetError;
  }

  getRecordData() {
    return this.recordData;
  }

  setErrorOverride(clientErrorText: string) {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.iframe.name, {
        name: this.iframe.name,
        isTriggerError: true,
        clientErrorText,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.iframe.name, {
            name: this.iframe.name,
            isTriggerError: true,
            clientErrorText,
          });
        });
    }
    this.#isClientSetError = true;
  }

  setError(clientErrorText:string) {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.iframe.name, {
        name: this.iframe.name,
        isTriggerError: true,
        clientErrorText,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.iframe.name, {
            name: this.iframe.name,
            isTriggerError: true,
            clientErrorText,
          });
        });
    }
    this.#isClientSetError = true;
  }

  resetError() {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.iframe.name, {
        name: this.iframe.name,
        isTriggerError: false,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.iframe.name, {
            name: this.iframe.name,
            isTriggerError: false,
          });
        });
    }
    this.#isClientSetError = false;
  }

  setAltText(altText:string) {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
        name: this.iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
        updatedValue: altText,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
            name: this.iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
            updatedValue: altText,
          });
        });
    }
  }

  clearAltText() {
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
        name: this.iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
        updatedValue: null,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
            name: this.iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
            updatedValue: null,
          });
        });
    }
  }

  setToken(token:string) {
    this.recordData = {
      ...this.recordData,
      token,
    };
    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
        name: this.iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
        updatedValue: token,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
            name: this.iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
            updatedValue: token,
          });
        });
    }
  }

  unmount() {
    if (this.recordData.skyflowID) {
      this.#isMounted = false;
      this.iframe.container?.remove();
    }
    this.#isMounted = false;
    this.iframe.unmount();
  }

  update(options: TInput) {
    this.recordData = {
      ...this.recordData,
      ...options,
    };

    if (this.#isMounted) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
        name: this.iframe.name,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
        updatedValue: options,
      });
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.iframe.name, () => {
          this.#isMounted = true;
          bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.iframe.name, {
            name: this.iframe.name,
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
            updatedValue: options,
          });
        });
    }
  }
}

export default RevealElement;
