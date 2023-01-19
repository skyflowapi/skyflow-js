/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import _ from 'lodash';
import { IUpsertOptions } from '../../../core-utils/collect';
import EventEmitter from '../../../event-emitter';
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
} from '../../../utils/validators';
import {
  ElementType, COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT,
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

  type:string = ContainerType.COMPOSABLE;

  constructor(options, metaData, skyflowElements, context) {
    super();
    this.#containerId = uuid();
    this.#metaData = metaData;
    this.#skyflowElements = skyflowElements;
    this.#context = context;
    this.#options = options;
    this.#eventEmitter = new EventEmitter();

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

  create = (input: CollectElementInput, options: any = {
    required: false,
  }) => {
    validateCollectElementInput(input, this.#context.logLevel);
    const validations = formatValidations(input);
    const formattedOptions = formatOptions(input.type, options, this.#context.logLevel);
    let elementName;
    elementName = `${input.table}.${input.column}:${btoa(uuid())}`;
    elementName = (input.table && input.column) ? `${input.type}:${btoa(
      elementName,
    )}` : `${input.type}:${btoa(uuid())}`;

    elementName = `${FRAME_ELEMENT}:${elementName}`;

    this.#elementsList.push({
      elementType: input.type,
      name: input.column,
      ...input,
      ...formattedOptions,
      validations,
      elementName,
    });
    return new ComposableElement(elementName, this.#eventEmitter);
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
        true,
        this.#destroyCallback,
        this.#updateCallback,
        this.#context,
        this.#eventEmitter,
      );
      this.#elements[tempElements.elementName] = element;
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

  mount = (domElement) => {
    if (!domElement) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT,
        ['CollectElement'], true);
    }

    const { layout } = this.#options;
    if (_.sum(layout) !== this.#elementsList.length) {
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

    const composableElement = this.#createMultipleElement(this.#elementGroup, false);
    composableElement.mount(domElement);
    this.#isMounted = true;
  };

  collect = (options: ICollectOptions = { tokens: true }) => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.#metaData.clientJSON.config);
      if (!this.#isMounted) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
      }
      const collectElements = Object.values(this.#elements);
      collectElements.forEach((element) => {
        if (!element.isMounted()) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
        }
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
    } catch (err) {
      printLog(`${err.message}`, MessageType.ERROR, this.#context.logLevel);
      reject(err);
    }
  });
}
export default ComposableContainer;