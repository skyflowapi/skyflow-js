/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * @module CollectContainer
 */
import bus from 'framebus';
import { IUpsertOptions } from '../../../core-utils/collect';
import iframer, { setAttributes, getIframeSrc, setStyles } from '../../../iframe-libs/iframer';
import deepClone from '../../../libs/deep-clone';
import { formatValidations, formatOptions, validateElementOptions } from '../../../libs/element-options';
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
  validateBooleanOptions,
} from '../../../utils/validators';
import {
  ElementType, COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT,
} from '../../constants';
import Container from '../common/container';
import CollectElement from './collect-element';

/** Type of Skyflow element. */
export interface CollectElementInput {
  /** The table this data belongs to */
  table?: string;
  /** The data should be inserted into the column. */
  column?: string;
  /** The styles should be applied to the form element. */
  inputStyles?: object;
  /** The label for the form element. */
  label?: string;
  /** The styles applied to the label of the collect element. */
  labelStyles?: object;
  /** The styles that apply to the error text of the collect element will be added. */
  errorTextStyles?: object;
  /** This is a placeholder for the form element. */
  placeholder?: string;
  /** Skyflow.ElementType enum */
  type: ElementType;
  /** The string acts as an initial value for the collect element. */
  altText?: string;
  /** A set of validations for collect element. */
  validations?: IValidationRule[]
  /** The element's SkyflowID. */
  skyflowID?: string;
}

/** This class wraps the options for the Collect method. */
export interface ICollectOptions {
  /** The property indicates whether to return tokens for the collected data. It defaults to 'true'. */
  tokens?: boolean;
  /** Insert the non-PCI elements data into the vault in the format of the records object. */
  additionalFields?: IInsertRecordInput;
  /** To support upsert operations while collecting data from Skyflow elements, you should pass the table and column marked as unique in the table. */
  upsert?: Array<IUpsertOptions>
}
const CLASS_NAME = 'CollectContainer';

/**
  * @class This class wraps all collect elements.
  */
class CollectContainer extends Container {
  #containerId: string;

  #elements: Record<string, CollectElement> = {};

  #metaData: any;

  #context:Context;

  #skyflowElements:any;
  /** The type of the container. */
  type:string = ContainerType.COLLECT;

  /** @internal */
  constructor(options, metaData, skyflowElements, context) {
    super();
    this.#containerId = uuid();
    this.#metaData = metaData;
    this.#skyflowElements = skyflowElements;
    this.#context = context;
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.#containerId}:${this.#context.logLevel}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);

    const sub = (data, callback) => {
      if (data.name === COLLECT_FRAME_CONTROLLER + this.#containerId) {
        callback({
          ...metaData,
          clientJSON: {
            ...metaData.clientJSON,
            config: {
              ...metaData.clientJSON.config,
            },
          },
          context,
        });
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.#containerId, sub);
      }
    };
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.#containerId, sub);
    document.body.append(iframe);
  }

  /**
  * We call this method to create the Skyflow Collect element.
  * @param input Collect element input.
  * @param options Collect element options.
  * @returns The method returns the collect element.
  */
  create = (input: CollectElementInput, options: any = {
    required: false,
  }) => {
    validateCollectElementInput(input, this.#context.logLevel);
    const validations = formatValidations(input);
    const formattedOptions = formatOptions(input.type, options, this.#context.logLevel);
    const elementGroup = {
      rows: [
        {
          elements: [
            {
              elementType: input.type,
              name: input.column,
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
        element.update(elements[0]);
      } else {
        element.update(tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement(
        elementId,
        tempElements,
        this.#metaData,
        this.#containerId,
        isSingleElementAPI,
        this.#destroyCallback,
        this.#updateCallback,
        this.#context,
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
          this.#elements[name].update(iElement);
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

  /**
  * This method collects the data and sends it to the vault.
  * @param options It collects the data and sends it to the vault.
  * @returns It returns the inserted data or the error.
  */
  collect = (options: ICollectOptions = { tokens: true }) => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.#metaData.clientJSON.config);
      const collectElements = Object.values(this.#elements);
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
      // .target(properties.IFRAME_SECURE_ORGIN)
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + this.#containerId,
          {
            ...options,
            tokens: options?.tokens !== undefined ? options.tokens : true,
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
    } catch (err: any) {
      printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
      reject(err);
    }
  });

  /**
  * This method inserts file type data into the vault.
  * @returns It returns the inserted data.
  */
  uploadFiles = (options) => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.#metaData.clientJSON.config);
      const fileElements = Object.values(this.#elements);
      fileElements.forEach((element) => {
        if (!element.isMounted()) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
        }
        element.isValidElement();
      });
      bus
      // .target(properties.IFRAME_SECURE_ORGIN)
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD + this.#containerId,
          {
            ...options,
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
    } catch (err: any) {
      printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
      reject(err);
    }
  });
}
export default CollectContainer;
