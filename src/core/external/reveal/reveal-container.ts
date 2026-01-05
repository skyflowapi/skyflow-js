/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import EventEmitter from '../../../event-emitter';
import iframer, { getIframeSrc, setAttributes, setStyles } from '../../../iframe-libs/iframer';
import SkyflowError from '../../../libs/skyflow-error';
import uuid from '../../../libs/uuid';
import { ContainerType } from '../../../skyflow';
import {
  ContainerOptions,
  Context, MessageType,
  RedactionType, RevealResponse,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { validateInitConfig, validateInputFormatOptions, validateRevealElementRecords } from '../../../utils/validators';
import {
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER,
  REVEAL_TYPES,
} from '../../constants';
import Container from '../common/container';
import RevealElement from './reveal-element';
import properties from '../../../properties';
import { Metadata, SkyflowElementProps } from '../../internal/internal-types';

export interface IRevealElementInput {
  token?: string;
  skyflowID?: string;
  table?: string;
  column?: string;
  redaction?: RedactionType;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}

export interface IRevealElementOptions {
  enableCopy?: boolean;
  format?: string;
  translation?:Record<string, string>
}

const CLASS_NAME = 'RevealContainer';
class RevealContainer extends Container {
  #revealRecords: IRevealElementInput[] = [];

  #revealElements: RevealElement[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: Metadata;

  #containerId: string;

  #eventEmmiter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #context: Context;

  #skyflowElements: Array<SkyflowElementProps>;

  #isMounted: boolean = false;

  type:string = ContainerType.REVEAL;

  #isSkyflowFrameReady: boolean = false;

  constructor(
    metaData: Metadata,
    skyflowElements: Array<SkyflowElementProps>,
    context: Context,
    options?: ContainerOptions,
  ) {
    super();
    this.#isSkyflowFrameReady = metaData?.skyflowContainer?.isControllerFrameReady;
    this.#metaData = {
      ...metaData,
      clientJSON: {
        ...metaData.clientJSON,
        config: {
          ...metaData.clientJSON?.config,
          options: {
            ...metaData.clientJSON?.config?.options,
            ...options,
          },
        },
      },
    };
    this.#skyflowElements = skyflowElements;
    this.#containerId = uuid();
    this.#eventEmmiter = new EventEmitter();
    this.#context = context;
    const clientDomain = this.#metaData.clientDomain || '';
    const iframe = iframer({
      name: `${REVEAL_FRAME_CONTROLLER}:${this.#containerId}:${btoa(clientDomain)}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_REVEAL_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
        (data) => {
          if (!data.skyflowID) {
            this.#mountedRecords.push(data as any);
          }
          let revealElementLength = 0;
          this.#revealElements.forEach((currentElement) => {
            if (!currentElement.getRecordData().skyflowID) {
              revealElementLength += 1;
            }
          });

          this.#isElementsMounted = this.#mountedRecords.length === revealElementLength;
          // this.#mountedRecords.length === this.#revealElements.length;
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

  create(record: IRevealElementInput, options?: IRevealElementOptions) {
    // this.#revealRecords.push(record);
    const elementId = uuid();
    validateInputFormatOptions(options);
    const revealElement = new RevealElement(record, options, this.#metaData,
      {
        containerId: this.#containerId,
        isMounted: this.#isMounted,
        eventEmitter: this.#eventEmmiter,
        type: ContainerType.REVEAL,
      }, elementId, this.#context);
    this.#revealElements.push(revealElement);
    this.#skyflowElements[elementId] = revealElement;
    return revealElement;
  }

  reveal(): Promise<RevealResponse> {
    this.#isRevealCalled = true;
    this.#revealRecords = [];
    if (this.#metaData.skyflowContainer.isControllerFrameReady) {
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
            if (!currentElement.getRecordData().skyflowID) {
              this.#revealRecords.push(currentElement.getRecordData());
            }
          });
          if (this.#revealRecords.length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_REVEAL, [], true);
          }
          validateRevealElementRecords(this.#revealRecords);
          if (!this.#isElementsMounted) {
            const timeout = setTimeout(() => {
              printLog(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL,
                MessageType.ERROR, this.#context.logLevel);
              reject(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL));
            }, 10000);

            this.#eventEmmiter.on(
              ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
              () => {
                clearTimeout(timeout);
                this.#emitRevealRequest(resolve, reject);
              },
            );
          } else {
            this.#emitRevealRequest(resolve, reject);
          }
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
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
        this.#revealElements.forEach((currentElement) => {
          if (currentElement.isClientSetError()) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.REVEAL_ELEMENT_ERROR_STATE);
          }
          if (!currentElement.getRecordData().skyflowID) {
            this.#revealRecords.push(currentElement.getRecordData());
          }
        });
        if (this.#revealRecords.length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_REVEAL, [], true);
        }
        validateRevealElementRecords(this.#revealRecords);
        if (!this.#isElementsMounted) {
          const timeout = setTimeout(() => {
            printLog(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL,
              MessageType.ERROR, this.#context.logLevel);
            reject(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED_REVEAL));
          }, 10000);

          this.#eventEmmiter.on(
            ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
            () => {
              clearTimeout(timeout);
              if (this.#metaData.skyflowContainer.isControllerFrameReady) {
                this.#emitRevealRequest(resolve, reject);
              } else {
                bus
                  .target(properties.IFRAME_SECURE_ORIGIN)
                  .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY
         + this.#metaData.uuid, () => {
                    this.#emitRevealRequest(resolve, reject);
                  });
              }
            },
          );
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY
         + this.#metaData.uuid, () => {
              this.#emitRevealRequest(resolve, reject);
            });
        }
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
        reject(err);
      }
    });
  }

  #emitRevealRequest(resolve, reject) {
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#metaData.uuid,
      {
        type: REVEAL_TYPES.REVEAL,
        records: this.#revealRecords,
        containerId: this.#containerId,
      },
      (revealData: any) => {
        this.#mountedRecords = [];
        if (revealData.error) {
          printLog(parameterizedString(logs.errorLogs.FAILED_REVEAL),
            MessageType.ERROR, this.#context.logLevel);
          reject(revealData.error);
        } else {
          printLog(parameterizedString(logs.infoLogs.REVEAL_SUBMIT_SUCCESS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          resolve(revealData);
        }
      },
    );
  }
}
export default RevealContainer;
