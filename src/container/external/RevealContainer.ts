import bus from 'framebus';
import { RedactionType, Context } from '../../Skyflow';
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
  MessageType,
} from '../constants';
import RevealElement from './reveal/RevealElement';
import uuid from '../../libs/uuid';
import EventEmitter from '../../event-emitter';
import properties from '../../properties';
import { validateRevealElementRecords } from '../../utils/validators';
import {
  LogLevelOptions, printLog,
  parameterizedString,
} from '../../utils/logsHelper';
import logs from '../../utils/logs';

export interface IRevealElementInput {
  token?: string;
  redaction?: RedactionType;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}

class RevealContainer {
  #revealRecords: IRevealElementInput[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: any;

  #containerId: string;

  #eventEmmiter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #showErrorLogs: boolean;

  #showInfoLogs: boolean;

  #context:Context;

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
    const { showInfoLogs, showErrorLogs } = LogLevelOptions[
      context.logLevel];
    this.#showInfoLogs = showInfoLogs;
    this.#showErrorLogs = showErrorLogs;
    printLog(logs.infoLogs.CREATE_REVEAL_CONTAINER, MessageType.INFO,
      this.#showErrorLogs, this.#showInfoLogs);

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

          this.#isElementsMounted = this.#mountedRecords.length === this.#revealRecords.length;

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
    this.#revealRecords.push(record);

    return new RevealElement(record, this.#metaData, this.#containerId, this.#context);
  }

  reveal() {
    this.#isRevealCalled = true;
    if (this.#isElementsMounted) {
      return new Promise((resolve, reject) => {
        try {
          printLog(logs.infoLogs.VALIDATE_REVEAL_RECORDS, MessageType.INFO,
            this.#showErrorLogs, this.#showInfoLogs);

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
                    this.#showErrorLogs, this.#showInfoLogs);

                  reject(revealData.error);
                } else {
                  printLog(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, MessageType.INFO,
                    this.#showErrorLogs, this.#showInfoLogs);
                  resolve(revealData);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST),
          MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
        } catch (err) {
          printLog(`Error: ${err.message}`, MessageType.ERROR,
            this.#showErrorLogs, this.#showInfoLogs);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        printLog(logs.infoLogs.VALIDATE_REVEAL_RECORDS, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);
        validateRevealElementRecords(this.#revealRecords);
        const elementMountTimeOut = setTimeout(() => {
          printLog(logs.errorLogs.ELEMENT_NOT_MOUNTED, MessageType.ERROR,
            this.#showErrorLogs, this.#showInfoLogs);
          reject('Elements Not Mounted');
        }, 30000);
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
                      this.#showErrorLogs, this.#showInfoLogs);
                    reject(revealData.error);
                  } else {
                    printLog(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, MessageType.INFO,
                      this.#showErrorLogs, this.#showInfoLogs);

                    resolve(revealData);
                  }
                },
              );
          },
        );
      } catch (err) {
        printLog(err.message, MessageType.ERROR,
          this.#showErrorLogs, this.#showInfoLogs);

        reject(err);
      }
    });
  }
}
export default RevealContainer;
