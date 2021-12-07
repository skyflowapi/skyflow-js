import bus from 'framebus';
import iframer, {
  setAttributes,
  getIframeSrc,
  setStyles,
} from '../../iframe-libs/iframer';
import {
  REVEAL_FRAME_CONTROLLER,
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CONTAINER,
} from '../constants';
import RevealElement from './reveal/RevealElement';
import uuid from '../../libs/uuid';
import EventEmitter from '../../event-emitter';
import properties from '../../properties';
import { validateInitConfig, validateRevealElementRecords } from '../../utils/validators';
import {
  printLog,
  parameterizedString,
} from '../../utils/logsHelper';
import logs from '../../utils/logs';
import { Context, RedactionType, MessageType } from '../../utils/common';
import SkyflowError from '../../libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../utils/constants';

export interface IRevealElementInput {
  token?: string;
  redaction?: RedactionType;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}
const CLASS_NAME = 'RevealContainer';
class RevealContainer {
  #revealRecords: IRevealElementInput[] = [];

  #revealElements: RevealElement[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: any;

  #containerId: string;

  #eventEmmiter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #context: Context;

  constructor(metaData, context) {
    this.#metaData = metaData;
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
              getBearerToken:
                metaData.clientJSON.config.getBearerToken.toString(),
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

  create(record: IRevealElementInput) {
    // this.#revealRecords.push(record);
    const revealElement = new RevealElement(record, this.#metaData,
      this.#containerId, this.#context);
    this.#revealElements.push(revealElement);
    return revealElement;
  }

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
        } catch (err) {
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
      } catch (err) {
        printLog(err.message, MessageType.ERROR,
          this.#context.logLevel);

        reject(err);
      }
    });
  }
}
export default RevealContainer;
