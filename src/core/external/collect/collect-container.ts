/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { IUpsertOptions } from '../../../core-utils/collect';
import iframer, { setAttributes, getIframeSrc, setStyles } from '../../../iframe-libs/iframer';
import deepClone from '../../../libs/deep-clone';
import {
  formatValidations, formatOptions, validateElementOptions,
} from '../../../libs/element-options';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import { ContainerType } from '../../../skyflow';
import {
  IValidationRule, IInsertRecordInput, Context, MessageType,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  validateCollectElementInput, validateInitConfig,
  validateAdditionalFieldsInCollect,
  validateUpsertOptions,
  validateBooleanOptions,
} from '../../../utils/validators';
import {
  ElementType, COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT,
} from '../../constants';
import Container from '../common/container';
import CollectElement from './collect-element';
import EventEmitter from '../../../event-emitter';

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
class CollectContainer extends Container {
  #containerId: string;

  #elements: Record<string, CollectElement> = {};

  #metaData: any;

  #context:Context;

  #skyflowElements:any;

  type:string = ContainerType.COLLECT;

  #eventEmitter: EventEmitter;

  #isMounted: boolean = false;

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
    this.#skyflowElements = skyflowElements;
    this.#context = context;
    this.#eventEmitter = new EventEmitter();

    const clientDomain = this.#metaData.clientDomain || '';
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.#containerId}:${this.#context.logLevel}:${btoa(clientDomain)}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
    this.#isMounted = true;
    // bus
    //   .target(properties.IFRAME_SECURE_ORIGIN)
    //   .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#metaData.uuid,
    //     (data, callback) => {
    //       callback('data');
    //     });
  }

  create = (input: CollectElementInput, options: any = {
    required: false,
  }) => {
    validateCollectElementInput(input, this.#context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.#context.logLevel);
    const elementGroup = {
      rows: [
        {
          elements: [
            {
              elementType: input.type,
              name: input.column,
              accept: options.allowedFileType,
              ...input,
              ...formattedOptions,
              validations,
            },
          ],
        },
      ],
    };
    return this.#createMultipleElement(elementGroup, true);
  };

  #createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false,
  ) => {
    const elements: any[] = [];
    const tempElements = deepClone(multipleElements);
    tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const { elementType } = options;
        validateElementOptions(elementType, options);

        options.sensitive = options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern = options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        // options.elementName = `${options.table}.${options.name}:${btoa(uuid())}`;
        // options.elementName = (options.table && options.name) ? `${options.elementType}:${btoa(
        //   options.elementName,
        // )}` : `${options.elementType}:${btoa(uuid())}`;

        options.isMounted = false;

        if (
          options.elementType === ELEMENTS.radio.name
          || options.elementType === ELEMENTS.checkbox.name
        ) {
          options.elementName = `${options.elementName}:${btoa(options.value)}`;
        }

        options.elementName = `${FRAME_ELEMENT}:${options.elementType}:${btoa(uuid())}`;
        options.label = element.label;
        options.skyflowID = element.skyflowID;

        elements.push(options);
      });
    });

    tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_ELEMENT}:group:${btoa(tempElements.name)}`;

    if (
      isSingleElementAPI
      && !this.#elements[elements[0].elementName]
      && this.#hasElementName(elements[0].name)
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
    }

    let element = this.#elements[tempElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.updateElementGroup(elements[0]);
      } else {
        element.updateElementGroup(tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement(
        elementId,
        tempElements,
        this.#metaData,
        {
          containerId: this.#containerId,
          isMounted: this.#isMounted,
          type: this.type,
        },
        isSingleElementAPI,
        this.#destroyCallback,
        this.#updateCallback,
        this.#context,
        this.#eventEmitter,
      );
      this.#elements[tempElements.elementName] = element;
      this.#skyflowElements[elementId] = element;
    }

    if (!isSingleElementAPI) {
      elements.forEach((iElement) => {
        const name = iElement.elementName;
        if (!this.#elements[name]) {
          this.#elements[name] = this.create(iElement.elementType, element);
        } else {
          this.#elements[name].updateElementGroup(iElement);
        }
      });
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
        this.#elements[element.elementName].updateElementGroup(element);
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

  collect = (options: ICollectOptions = { tokens: true }) => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.#metaData.clientJSON.config);
      const collectElements = Object.values(this.#elements);
      const elementIds = Object.keys(this.#elements)
        .map((element) => ({ frameId: element, elementId: element }));
      collectElements.forEach((element) => {
        if (!element.isMounted()) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
        }
        element.isValidElement();
      });
      if (Object.prototype.hasOwnProperty.call(options, 'tokens') && !validateBooleanOptions(options.tokens)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
      }
      if (options?.additionalFields) {
        validateAdditionalFieldsInCollect(options.additionalFields);
      }
      if (options?.upsert) {
        validateUpsertOptions(options?.upsert);
      }
      bus
      // .target(properties.IFRAME_SECURE_ORIGIN)
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + this.#metaData.uuid,
          {
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

  uploadFiles = (options) => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.#metaData.clientJSON.config);
      const fileElements = Object.values(this.#elements);
      const elementIds = Object.keys(this.#elements);
      fileElements.forEach((element) => {
        if (!element.isMounted()) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
        }
        element.isValidElement();
      });
      bus
      // .target(properties.IFRAME_SECURE_ORIGIN)
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD + this.#metaData.uuid,
          {
            ...options,
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
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
      MessageType.LOG, this.#context.logLevel);
    } catch (err:any) {
      printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
      reject(err);
    }
  });
}
export default CollectContainer;
