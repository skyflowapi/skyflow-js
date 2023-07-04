/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * This is the doc comment for RevealContainer Module
 * @module RevealContainer
 */
import bus from 'framebus';
import EventEmitter from '../../../event-emitter';
import iframer, { getIframeSrc, setAttributes, setStyles } from '../../../iframe-libs/iframer';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import properties from '../../../properties';
import { ContainerType } from '../../../skyflow';
import { Context, MessageType, RedactionType } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { validateInitConfig, validateInputFormatOptions, validateRevealElementRecords } from '../../../utils/validators';
import {
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER,
} from '../../constants';
import Container from '../common/container';
import RevealElement from './reveal-element';

/** This is documentation for interface IRevealElementInput. */
export interface IRevealElementInput {
  /** This is the description for token property */
  token?: string;
  /** This is the description for redaction property */
  redaction?: RedactionType;
  /** This is the description for inputStyles property */
  inputStyles?: object;
  /** This is the description for label property */
  label?: string;
  /** This is the description for labelStyles property */
  labelStyles?: object;
  /** This is the description for altText property */
  altText?: string;
  /** This is the description for errorTextStyles property */
  errorTextStyles?: object;
}

/** This is documentation for interface IRevealElementOptions. */
export interface IRevealElementOptions {
  /** This is the description for enableCopy property */
  enableCopy?: boolean;
  /** This is the description for format property */
  format?: string;
  /** This is the description for translation property */
  translation?:Record<string, string>
}

const CLASS_NAME = 'RevealContainer';

/**
  * This is the documentation for RevealContainer Class
  * @class RevealContainer
  */
class RevealContainer extends Container {
  #revealRecords: IRevealElementInput[] = [];

  #revealElements: RevealElement[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: any;

  #containerId: string;

  #eventEmmiter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #context: Context;

  #skyflowElements: any;

  type:string = ContainerType.REVEAL;

  /**
  * Some documentation for constructor
  * @param metaData This is a description of the metaData parameter.
  * @param skyflowElements This is a description of the skyflowElements parameter.
  * @param context This is a description of the context parameter.
  */
  constructor(metaData, skyflowElements, context) {
    super();
    this.#metaData = metaData;
    this.#skyflowElements = skyflowElements;
    this.#containerId = uuid();
    this.#eventEmmiter = new EventEmitter();
    this.#context = context;
    const iframe = iframer({
      name: `${REVEAL_FRAME_CONTROLLER}:${this.#containerId}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_REVEAL_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);

    const sub = (data, callback) => {
      if (data.name === REVEAL_FRAME_CONTROLLER) {
        callback({
          ...metaData,
          clientJSON: {
            ...metaData.clientJSON,
            config: {
              ...metaData.clientJSON.config,
            },
            context,
          },
        });
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .off(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId,
            sub,
          );
      }
    };
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId, sub);

    document.body.append(iframe);
    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
        (data) => {
          this.#mountedRecords.push(data as any);

          this.#isElementsMounted = this.#mountedRecords.length === this.#revealElements.length;

          if (this.#isRevealCalled && this.#isElementsMounted) {
            // eslint-disable-next-line no-underscore-dangle
            this.#eventEmmiter._emit(
              ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED
                + this.#containerId,
              {
                containerId: this.#containerId,
              },
            );
          }
        },
      );
  }

  /**
  * Some documentation for create method
  * @param record This is a description of the record parameter.
  * @param options This is a description of the options parameter.
  * @returns This is a description of what the method returns.
  */
  create(record: IRevealElementInput, options?: IRevealElementOptions) {
    // this.#revealRecords.push(record);
    const elementId = uuid();
    validateInputFormatOptions(options);
    const revealElement = new RevealElement(record, options, this.#metaData,
      this.#containerId, elementId, this.#context);
    this.#revealElements.push(revealElement);
    this.#skyflowElements[elementId] = revealElement;
    return revealElement;
  }

  /**
  * Some documentation for reveal method
  * @returns This is a description of what the method returns.
  */
  reveal() {
    this.#isRevealCalled = true;
    if (this.#isElementsMounted) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          this.#revealElements.forEach((currentElement) => {
            if (currentElement.isClientSetError()) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
            }
            this.#revealRecords.push(currentElement.getRecordData());
          });
          validateRevealElementRecords(this.#revealRecords);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId,
              {
                records: this.#revealRecords,
              },
              (revealData: any) => {
                this.#mountedRecords = [];
                this.#revealRecords = [];
                if (revealData.error) {
                  printLog(logs.errorLogs.FAILED_REVEAL, MessageType.ERROR,
                    this.#context.logLevel);

                  reject(revealData.error);
                } else {
                  printLog(parameterizedString(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.#context.logLevel);
                  resolve(revealData);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST),
          MessageType.LOG, this.#context.logLevel);
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR,
            this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_REVEAL_RECORDS, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        const elementMountTimeOut = setTimeout(() => {
          printLog(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL, MessageType.ERROR,
            this.#context.logLevel);
          reject(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL);
        }, 30000);
        this.#revealElements.forEach((currentElement) => {
          if (currentElement.isClientSetError()) {
            clearTimeout(elementMountTimeOut);
            throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
          }
          this.#revealRecords.push(currentElement.getRecordData());
        });
        validateRevealElementRecords(this.#revealRecords);
        this.#eventEmmiter.on(
          ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
          () => {
            clearTimeout(elementMountTimeOut);
            bus
              // .target(properties.IFRAME_SECURE_ORGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId,
                {
                  records: this.#revealRecords,
                },
                (revealData: any) => {
                  this.#revealRecords = [];
                  this.#mountedRecords = [];
                  if (revealData.error) {
                    printLog(logs.errorLogs.FAILED_REVEAL, MessageType.ERROR,
                      this.#context.logLevel);
                    reject(revealData.error);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.#context.logLevel);

                    resolve(revealData);
                  }
                },
              );
          },
        );
      } catch (err: any) {
        printLog(err.message, MessageType.ERROR,
          this.#context.logLevel);

        reject(err);
      }
    });
  }
}
export default RevealContainer;
