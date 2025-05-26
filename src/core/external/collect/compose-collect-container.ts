/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
import bus from 'framebus';
import sum from 'lodash/sum';
import { IUpsertOptions } from '../../../core-utils/collect';
import EventEmitter from '../../../event-emitter';
import iframer, { setAttributes, getIframeSrc, setStyles } from '../../../iframe-libs/iframer';
import deepClone from '../../../libs/deep-clone';
import {
  formatValidations, formatOptions, validateElementOptions, getElements,
} from '../../../libs/element-options';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import properties from '../../../properties';
import { ContainerType } from '../../../skyflow';
import {
  IValidationRule, IInsertRecordInput, Context, MessageType,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  validateCollectElementInput, validateInitConfig, validateAdditionalFieldsInCollect,
  validateUpsertOptions,
} from '../../../utils/validators';
import {
  ElementType, COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_CONTAINER,
  COLLECT_TYPES,
} from '../../constants';
import Container from '../common/container';
import CollectElement from './collect-element';
import ComposableElement from './compose-collect-element';

export interface CollectElementInput {
  table?: string;
  column?: string;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  errorTextStyles?: object;
  placeholder?: string;
  type: ElementType;
  altText?: string;
  validations?: IValidationRule[]
  skyflowID?: string;
}

interface ICollectOptions {
  tokens?: boolean;
  additionalFields?: IInsertRecordInput;
  upsert?: Array<IUpsertOptions>
}
const CLASS_NAME = 'CollectContainer';
class ComposableContainer extends Container {
  #containerId: string;

  #elements: Record<string, any> = {};

  #metaData: any;

  #elementGroup: any = { rows: [] };

  #elementsList:any = [];

  #context:Context;

  #skyflowElements:any;

  #eventEmitter: EventEmitter;

  #isMounted: boolean = false;

  #options: any;

  #containerElement:any;

  type:string = ContainerType.COMPOSABLE;

  #containerMounted: boolean = false;

  #tempElements: any = {};

  #clientDomain: string = '';

  #isSkyflowFrameReady: boolean = false;

  constructor(options, metaData, skyflowElements, context) {
    super();
    this.#containerId = uuid();
    this.#metaData = {
      ...metaData,
      clientJSON: {
        ...metaData.clientJSON,
        config: {
          ...metaData.clientJSON.config,
          options: {
            ...metaData.clientJSON.config?.options,
            ...options,
          },
        },
      },
    };
    this.#isSkyflowFrameReady = metaData.skyflowContainer.isControllerFrameReady;

    this.#skyflowElements = skyflowElements;
    this.#context = context;
    this.#options = options;
    this.#eventEmitter = new EventEmitter();

    this.#clientDomain = this.#metaData.clientDomain || '';
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.#containerId}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`,
      referrer: this.#clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
    this.#containerMounted = true;
    this.#updateListeners();
  }

  create = (input: CollectElementInput, options: any = {
    required: false,
  }) => {
    validateCollectElementInput(input, this.#context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.#context.logLevel);
    // let elementName;
    // elementName = `${input.table}.${input.column}:${btoa(uuid())}`;
    // elementName = (input.table && input.column) ? `${input.type}:${btoa(
    //   elementName,
    // )}` : ;

    const elementName = `${FRAME_ELEMENT}:${input.type}:${btoa(uuid())}`;

    this.#elementsList.push({
      elementType: input.type,
      name: input.column,
      ...input,
      ...formattedOptions,
      validations,
      elementName,
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.#tempElements)}:${this.#containerId}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`;
    return new ComposableElement(elementName, this.#eventEmitter, controllerIframeName);
  };

  #createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false,
  ) => {
    const elements: any[] = [];
    this.#tempElements = deepClone(multipleElements);
    this.#tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const { elementType } = options;
        validateElementOptions(elementType, options);

        options.sensitive = options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern = options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        options.isMounted = false;

        options.label = element.label;
        options.skyflowID = element.skyflowID;

        elements.push(options);
      });
    });

    this.#tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_ELEMENT}:group:${btoa(this.#tempElements)}`;
    if (
      isSingleElementAPI
      && !this.#elements[elements[0].elementName]
      && this.#hasElementName(elements[0].name)
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
    }

    let element = this.#elements[this.#tempElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.update(elements[0]);
      } else {
        element.update(this.#tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement(
        elementId,
        this.#tempElements,
        this.#metaData,
        {
          containerId: this.#containerId,
          isMounted: this.#containerMounted,
          type: this.type,
        },
        true,
        this.#destroyCallback,
        this.#updateCallback,
        this.#context,
        this.#eventEmitter,
      );
      this.#elements[this.#tempElements.elementName] = element;
      this.#skyflowElements[elementId] = element;
    }
    return element;
  };

  #removeElement = (elementName: string) => {
    Object.keys(this.#elements).forEach((element) => {
      if (element === elementName) delete this.#elements[element];
    });
  };

  #destroyCallback = (elementNames: string[]) => {
    elementNames.forEach((elementName) => {
      this.#removeElement(elementName);
    });
  };

  #updateCallback = (elements: any[]) => {
    elements.forEach((element) => {
      if (this.#elements[element.elementName]) {
        this.#elements[element.elementName].update(element);
      }
    });
  };

  #hasElementName = (name: string) => {
    const tempElements = Object.keys(this.#elements);
    for (let i = 0; i < tempElements.length; i += 1) {
      if (atob(tempElements[i].split(':')[2]) === name) {
        return true;
      }
    }
    return false;
  };

  on = (eventName:string, handler:any) => {
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

    this.#eventEmitter.on(ELEMENT_EVENTS_TO_CLIENT.SUBMIT, () => {
      handler();
    });
  };

  mount = (domElement) => {
    if (!domElement) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT,
        ['CollectElement'], true);
    }

    const { layout } = this.#options;
    if (sum(layout) !== this.#elementsList.length) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISMATCH_ELEMENT_COUNT_LAYOUT_SUM, [], true);
    }
    let count = 0;
    layout.forEach((rowCount, index) => {
      this.#elementGroup.rows = [
        ...this.#elementGroup.rows,
        { elements: [] },
      ];
      for (let i = 0; i < rowCount; i++) {
        this.#elementGroup.rows[index].elements.push(
          this.#elementsList[count],
        );
        count++;
      }
    });
    if (this.#options.styles) {
      this.#elementGroup.styles = {
        ...this.#options.styles,
      };
    }
    if (this.#options.errorTextStyles) {
      this.#elementGroup.errorTextStyles = {
        ...this.#options.errorTextStyles,
      };
    }

    if (this.#containerMounted) {
      this.#containerElement = this.#createMultipleElement(this.#elementGroup, false);
      this.#containerElement.mount(domElement);
      this.#isMounted = true;
    }
  };

  unmount = () => {
    this.#containerElement.unmount();
  };

  collect = (options: ICollectOptions = { tokens: true }) :Promise<any> => {
    if (this.#isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          if (!this.#isMounted) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
          }

          const containerElements = getElements(this.#tempElements);
          containerElements.forEach((element:any) => {
            if (!element?.isMounted) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
            }
          });
          const elementIds:{ frameId:string, elementId:string }[] = [];
          const collectElements = Object.values(this.#elements);
          collectElements.forEach((element) => {
            element.isValidElement();
          });
          if (options && options.tokens && typeof options.tokens !== 'boolean') {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
          }
          if (options?.additionalFields) {
            validateAdditionalFieldsInCollect(options.additionalFields);
          }
          if (options?.upsert) {
            validateUpsertOptions(options?.upsert);
          }
          this.#elementsList.forEach((element) => {
            elementIds.push({
              frameId: this.#tempElements.elementName,
              elementId: element.elementName,
            });
          });
          bus
          // .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#metaData.uuid,
              {
                type: COLLECT_TYPES.COLLECT,
                ...options,
                tokens: options?.tokens !== undefined ? options.tokens : true,
                elementIds,
                containerId: this.#containerId,
              },
              (data: any) => {
                if (!data || data?.error) {
                  printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(data?.error);
                } else {
                  printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context.logLevel);

                  resolve(data);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
          MessageType.LOG, this.#context.logLevel);
        } catch (err:any) {
          printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        if (!this.#isMounted) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
        }

        const containerElements = getElements(this.#tempElements);
        containerElements.forEach((element:any) => {
          if (!element?.isMounted) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
          }
        });
        const elementIds:{ frameId:string, elementId:string }[] = [];
        const collectElements = Object.values(this.#elements);
        collectElements.forEach((element) => {
          element.isValidElement();
        });

        if (options && options.tokens && typeof options.tokens !== 'boolean') {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
        }
        if (options?.additionalFields) {
          validateAdditionalFieldsInCollect(options.additionalFields);
        }
        if (options?.upsert) {
          validateUpsertOptions(options?.upsert);
        }
        this.#elementsList.forEach((element) => {
          elementIds.push({
            frameId: this.#tempElements.elementName,
            elementId: element.elementName,
          });
        });
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#containerId, () => {
            bus
            // .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#metaData.uuid,
                {
                  type: COLLECT_TYPES.COLLECT,
                  ...options,
                  tokens: options?.tokens !== undefined ? options.tokens : true,
                  elementIds,
                  containerId: this.#containerId,
                },
                (data: any) => {
                  if (!data || data?.error) {
                    printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#context.logLevel);
                    reject(data?.error);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);
                    resolve(data);
                  }
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
          CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
        MessageType.LOG, this.#context.logLevel);
      } catch (err:any) {
        printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
        reject(err);
      }
    });
  };

  #updateListeners = () => {
    this.#eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, (data) => {
      let elementIndex;
      const elementList = this.#elementsList.map((element, index) => {
        if (element.elementName === data.elementName) {
          elementIndex = index;
          return {
            elementName: element.elementName,
            ...data.elementOptions,
          };
        }
        return element;
      });

      if (this.#containerElement) {
        this.#containerElement.updateElement({
          ...elementList[elementIndex],
        });
      }
    });
  };
}
export default ComposableContainer;
