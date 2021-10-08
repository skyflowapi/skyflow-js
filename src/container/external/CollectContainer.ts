import bus from 'framebus';
import iframer, {
  setAttributes,
  getIframeSrc,
  setStyles,
} from '../../iframe-libs/iframer';
import deepClone from '../../libs/deepClone';
import { validateElementOptions } from '../../libs/element-options';
import uuid from '../../libs/uuid';
import properties from '../../properties';
import { IInsertRecordInput } from '../../Skyflow';
import {
  COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  FRAME_ELEMENT,
  ElementType,
  LogLevel,
  MessageType,
} from '../constants';
import Element from './element';
import logs from '../../utils/logs';
import { LogLevelOptions, printLog, parameterizedString } from '../../utils/helper';

interface CollectElementInput {
  table?: string;
  column?: string;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  errorTextStyles?: object;
  placeholder?: string;
  type: ElementType;
  altText?: string;
}

interface ICollectOptions {
  tokens?: boolean;
  additionalFields?: IInsertRecordInput;
}

class CollectContainer {
  #containerId: string;

  #elements: Record<string, Element> = {};

  #metaData: any;

  #logLevel:LogLevel;

  #showErrorLogs: boolean;

  #showInfoLogs: boolean;

  constructor(options, metaData, context) {
    this.#containerId = uuid();
    this.#metaData = metaData;
    this.#logLevel = context.logLevel;
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.#containerId}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    const { showInfoLogs, showErrorLogs } = LogLevelOptions[this.#logLevel];
    this.#showInfoLogs = showInfoLogs;
    this.#showErrorLogs = showErrorLogs;
    printLog(logs.infoLogs.CREATE_COLLECT_CONTAINER, MessageType.INFO,
      this.#showErrorLogs, this.#showInfoLogs);

    const sub = (data, callback) => {
      if (data.name === COLLECT_FRAME_CONTROLLER + this.#containerId) {
        callback({
          ...metaData,
          clientJSON: {
            ...metaData.clientJSON,
            config: {
              ...metaData.clientJSON.config,
              getBearerToken:
                metaData.clientJSON.config.getBearerToken.toString(),
            },
          },
          options: metaData.clientJSON.config.options,
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

  create = (input: CollectElementInput, options: any = { required: false }) => {
    const elementGroup = {
      rows: [
        {
          elements: [
            {
              elementType: input.type,
              name: input.column,
              ...(input.altText ? { value: input.altText } : {}),
              ...input,
              ...options,
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

        options.elementName = `${options.table}.${options.name}`;
        options.elementName = (options.table && options.name) ? `${options.elementType}:${btoa(
          options.elementName,
        )}` : `${options.elementType}:${btoa(uuid())}`;

        if (
          options.elementType === ELEMENTS.radio.name
          || options.elementType === ELEMENTS.checkbox.name
        ) {
          options.elementName = `${options.elementName}:${btoa(options.value)}`;
        }

        options.elementName = `${FRAME_ELEMENT}:${options.elementName}`;
        options.label = element.label;

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
      throw new Error(`${parameterizedString(logs.errorLogs.UNIQUE_ELEMENT_NAME, elements[0].name)}`);
    }

    let element = this.#elements[tempElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.update(elements[0]);
      } else {
        element.update(tempElements);
      }
    } else {
      element = new Element(
        tempElements,
        this.#metaData,
        this.#containerId,
        isSingleElementAPI,
        this.#destroyCallback,
        this.#updateCallback,
        { logLevel: this.#logLevel },
      );
      this.#elements[tempElements.elementName] = element;
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

  collect = (options: ICollectOptions = { tokens: true }) => new Promise((resolve, reject) => {
    try {
      const collectElements = Object.values(this.#elements);
      collectElements.forEach((element) => {
        if (!element.isMounted()) { throw new Error(logs.errorLogs.ELEMENT_NOT_MOUNTED); }
        if (!element.isValidElement()) { throw new Error(logs.errorLogs.INVALID_TABLE_OR_COLUMN); }
      });
      bus
      // .target(properties.IFRAME_SECURE_ORGIN)
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + this.#containerId,
          {
            ...options,
            tokens: options.tokens !== undefined ? options.tokens : true,
          },
          (data: any) => {
            if (!data || data?.error) {
              printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);
              reject(data);
            } else {
              printLog(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, MessageType.INFO,
                this.#showErrorLogs, this.#showInfoLogs);
              resolve(data);
            }
          },
        );
      printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
        ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
      MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
    } catch (err) {
      printLog(`${err.message}`, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);
      reject(err?.message);
    }
  });
}
export default CollectContainer;
