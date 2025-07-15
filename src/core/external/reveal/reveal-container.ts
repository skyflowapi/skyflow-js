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
  Context, IRevealElementInput, IRevealElementOptions, MessageType, RevealResponse,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { validateInitConfig, validateInputFormatOptions, validateRevealElementRecords } from '../../../utils/validators';
import {
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_CONTAINER,
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_REVEAL,
  REVEAL_FRAME_CONTROLLER,
  REVEAL_TYPES,
} from '../../constants';
import Container from '../common/container';
import properties from '../../../properties';
import deepClone from '../../../libs/deep-clone';
import RevealElement from './reveal-element copy';

const CLASS_NAME = 'RevealContainer';
class RevealContainer extends Container {
  #revealRecords: IRevealElementInput[] = [];

  #elements: Record<string, RevealElement> = {};

  #revealElements: RevealElement[] = [];

  #mountedRecords: { id: string }[] = [];

  #metaData: any;

  #containerId: string;

  #eventEmitter: EventEmitter;

  #isRevealCalled: boolean = false;

  #isElementsMounted: boolean = false;

  #context: Context;

  #skyflowElements: any;

  #isMounted:any;

  type:string = ContainerType.REVEAL;

  #isSkyflowFrameReady: boolean = false;

  constructor(metaData, skyflowElements, context, options = {}) {
    super();
    this.#isSkyflowFrameReady = metaData.skyflowContainer.isControllerFrameReady;
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
    this.#eventEmitter = new EventEmitter();
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
            this.#eventEmitter._emit(
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
    const elementGroup = {
      rows: [
        {
          elements: [
            {
              elementId,
              containerType: ContainerType.REVEAL,
              record,
              options,
            },
          ],
        },
      ],
    };
    return this.#createMultipleElement(elementGroup, true);

    // if (this.#hasElementName(record.name)) {
    // const revealElement = new RevealElement(record, options, this.#metaData,
    //   {
    //     containerId: this.#containerId,
    //     isMounted: this.#isMounted,
    //     eventEmitter: this.#eventEmmiter,
    //   }, elementId, this.#context);
    // this.#revealElements.push(revealElement);
    // this.#skyflowElements[elementId] = revealElement;
    // return revealElement;
  }

  #createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false,
  ) => {
    const elements: any[] = [];
    const tempElements = deepClone(multipleElements);
    tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        options.isMounted = false;
        elements.push(options);
      });
    });

    tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_REVEAL}:group:${btoa(tempElements.name)}`;

    if (
      isSingleElementAPI
      && !this.#elements[elements[0].elementName]
      && this.#hasElementName(elements[0].name)
    ) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true,
      );
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
      element = new RevealElement(
        elementId,
        tempElements,
        this.#metaData,
        {
          containerId: this.#containerId,
          isMounted: this.#isMounted,
          type: ContainerType.REVEAL,
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
          this.#elements[name] = this.create(iElement.elementType, iElement);
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

            this.#eventEmitter.on(
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

          this.#eventEmitter.on(
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
