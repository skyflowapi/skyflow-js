/*
Copyright (c) 2023 Skyflow, Inc.
*/
// Shared composable collect element (the object returned by ComposableContainer's
// create()). Variant-agnostic: it only relays element-option updates and the
// per-element on()/uploadMultipleFiles() wiring through the event bus, so both
// privacyDB and flowDB use it unchanged. uploadMultipleFiles throws for any
// non-MULTI_FILE_INPUT element, so the flowDB build (no file upload) never
// exercises it.
import { Context } from 'vm';
import EventEmitter from '@core/event-emitter';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ElementType } from '@core/constants';
import logs from '@core/utils/logs';
import properties from '@core/properties';
import SkyflowError from '@core/errors';
import { formatValidations } from '@core/libs/element-options';
import {
  ICollectElementUpdateOptionsBase, EventName, MessageType, MetaData, ContainerType,
} from '@core/types';
import { printLog } from '@core/utils/logs-helper';

class ComposableElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType.COMPOSABLE;

  #isMounted = false;

  #isUpdateCalled = false;

  #metaData: any;

  #context: Context;

  #elementType: ElementType;

  constructor(name, eventEmitter, iframeName, metaData) {
    this.#elementName = name;
    this.#iframeName = iframeName;
    this.#eventEmitter = eventEmitter;

    this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
      this.#isMounted = true;
    });
    this.#metaData = metaData;
    this.#context = {
      logLevel: this.#metaData?.clientJSON?.config?.options?.logLevel,
      env: this.#metaData?.clientJSON?.config?.options?.env,
    };
    this.#elementType = this.#metaData?.type as ElementType;
  }

  on(eventName: string, handler: Function) {
    if (!Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (!handler) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (typeof handler !== 'function') {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }

    this.#eventEmitter.on(`${eventName}:${this.#elementName}`, (data) => {
      if (data.value === undefined) {
        data.value = '';
      }

      if (data.elementType !== ElementType.CARD_NUMBER) delete data.selectedCardScheme;

      delete data.isComplete;
      delete data.name;
      handler(data);
    });
  }

  iframeName(): string {
    return this.#iframeName;
  }

  getID(): string {
    return this.#elementName;
  }

  update = (options: ICollectElementUpdateOptionsBase) => {
    this.#isUpdateCalled = true;
    if (this.#isMounted) {
      options.validations = formatValidations(options.validations);
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter
        ._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: options,
        });
      this.#isUpdateCalled = false;
    } else if (this.#isUpdateCalled) {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        options.validations = formatValidations(options.validations);
        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter
          ._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
            elementName: this.#elementName,
            elementOptions: options,
          });
        this.#isMounted = true;
        this.#isUpdateCalled = false;
      });
    }
  };

  uploadMultipleFiles = (metaData?: MetaData) => new Promise((resolve, reject) => {
    try {
      if (this.#elementType !== ElementType.MULTI_FILE_INPUT) {
        throw new SkyflowError(
          SKYFLOW_ERROR_CODE.MULTI_FILE_NOT_SUPPORTED,
          [],
          true,
        );
      }
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter._emit(`${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${this.#elementName}`, {
        options: metaData,
      }, (response: any) => {
        if (response.error) {
          reject(response);
        }
      });
      window.addEventListener('message', (event) => {
        if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
          if (event?.data?.type === `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${this.#elementName}`) {
            if (event?.data?.data?.errorResponse || event?.data?.data?.error) {
              printLog(`${event?.data?.data.errorResponse || event?.data?.data.error}`, MessageType.ERROR, this.#context.logLevel);
              reject(event?.data?.data);
            } else if (event?.data?.data.fileUploadResponse) {
              printLog(logs.infoLogs.MULTI_UPLOAD_FILES_SUCCESS,
                MessageType.LOG, this.#context.logLevel);
              resolve(event?.data?.data);
            } else {
              printLog(`${event?.data?.data}`, MessageType.ERROR, this.#context.logLevel);
              reject(event?.data?.data);
            }
          }
        }
      });
    } catch (error) {
      printLog(`${error}`, MessageType.ERROR, this.#context.logLevel);
      reject(error);
    }
  });
}
export default ComposableElement;
