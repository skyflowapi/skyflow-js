/* eslint-disable no-plusplus */
/*
Copyright (c) 2025 Skyflow, Inc.
*/
import bus from 'framebus';
import sum from 'lodash/sum';
import EventEmitter from '../../../event-emitter';
import iframer, { setAttributes, getIframeSrc, setStyles } from '../../../iframe-libs/iframer';
import uuid from '../../../libs/uuid';
import SkyflowError from '../../../libs/skyflow-error';
import { ContainerType } from '../../../skyflow';
import {
  Context, MessageType,
  IRevealElementInput,
  IRevealElementOptions,
  RevealResponse,
} from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  validateRevealElementRecords, validateInitConfig, validateInputFormatOptions,
} from '../../../utils/validators';
import {
  REVEAL_FRAME_CONTROLLER,
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_REVEAL,
  ELEMENT_EVENTS_TO_CLIENT,
  REVEAL_TYPES,
} from '../../constants';
import Container from '../common/container';
import ComposableRevealElement from './compose-reveal-element';
import properties from '../../../properties';
import deepClone from '../../../libs/deep-clone';
import RevealElement from './reveal-element';

const CLASS_NAME = 'RevealContainer';

class RevealComposableContainer extends Container {
  #revealElements: ComposableRevealElement[] = [];

  #elementsList: any = [];

  #containerId: string;

  #elements: Record<string, any> = {};

  #elementGroup: any = { rows: [] };

  #tempElements: any = {};

  #skyflowElements: any;

  #eventEmitter: EventEmitter;

  #context: Context;

  #metaData: any;

  #options: any;

  #containerElement: any;

  #isMounted: boolean = false;

  #containerMounted: boolean = false;

  #clientDomain: string = '';

  type: string = ContainerType.REVEAL;

  #isSkyflowFrameReady: boolean = false;

  #isRevealCalled: boolean = false;

  #revealRecords: any[] = [];

  constructor(options, metaData, skyflowElements, context) {
    super();
    this.#containerId = uuid();
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
    this.#isSkyflowFrameReady = metaData.skyflowContainer.isControllerFrameReady;
    this.#skyflowElements = skyflowElements;
    this.#context = context;
    this.#options = options;
    this.#eventEmitter = new EventEmitter();
    this.#clientDomain = this.#metaData.clientDomain || '';

    const iframe = iframer({
      name: `${REVEAL_FRAME_CONTROLLER}:${this.#containerId}:${btoa(this.#clientDomain)}`,
      referrer: this.#clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });

    printLog(parameterizedString(logs.infoLogs.CREATE_REVEAL_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);

    this.#containerMounted = true;
    this.#setupListeners();
  }

  create(record: IRevealElementInput, options: IRevealElementOptions = {}) {
    validateInputFormatOptions(options);
    const elementName = `${FRAME_REVEAL}:reveal:${btoa(uuid())}`;

    this.#elementsList.push({
      ...record,
      ...options,
      elementName,
      elementType: 'compose-reveal',
    });

    const controllerIframeName = `${FRAME_REVEAL}:group:${btoa(this.#elementsList)}:${this.#containerId}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`;
    const element = new ComposableRevealElement(
      elementName,
      this.#eventEmitter,
      controllerIframeName,
    );

    this.#revealElements.push(element);
    return element;
  }

  mount = (domElement: HTMLElement | string) => {
    if (!domElement) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealContainer'], true);
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
      // this.#containerElement = this.#createMultipleElement(this.#elementGroup, false);
      this.#containerElement.mount(domElement);
      this.#isMounted = true;
    }
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
        options.isMounted = false;
        elements.push(options);
      });
    });

    this.#tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_REVEAL}:group:${btoa(this.#tempElements)}`;
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
      element = new RevealElement();
      this.#elements[this.#tempElements.elementName] = element;
      this.#skyflowElements[elementId] = element;
    }
    return element;
  };

  unmount = () => {
    this.#containerElement.unmount();
  };

  reveal(): Promise<RevealResponse> {
    this.#isRevealCalled = true;
    this.#revealRecords = [];

    if (this.#isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#metaData.clientJSON.config);
          this.#revealElements.forEach((element) => {
            if (!element.getRecordData().skyflowID) {
              this.#revealRecords.push(element.getRecordData());
            }
          });

          if (this.#revealRecords.length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_REVEAL, [], true);
          }
          validateRevealElementRecords(this.#revealRecords);
          this.#emitRevealRequest(resolve, reject);
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR, this.#context.logLevel);
          reject(err);
        }
      });
    }

    // Handle case when frame is not ready
    return new Promise((resolve, reject) => {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#containerId,
          () => {
            this.reveal()
              .then(resolve)
              .catch(reject);
          });
    });
  }

  #hasElementName = (name: string) => {
    const tempElements = Object.keys(this.#elements);
    for (let i = 0; i < tempElements.length; i += 1) {
      if (atob(tempElements[i].split(':')[2]) === name) {
        return true;
      }
    }
    return false;
  };

  #emitRevealRequest(resolve, reject) {
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#metaData.uuid,
      {
        type: REVEAL_TYPES.REVEAL,
        records: this.#revealRecords,
        containerId: this.#containerId,
      },
      (revealData: any) => {
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

  #setupListeners() {
    // bus.target(window.location.origin)
    //   .on(ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
    //     (data) => {
    //       if (!data.skyflowID) {
    //         this.#mountedRecords.push(data as any);
    //       }

    //       let revealElementLength = 0;
    //       this.#revealElements.forEach((currentElement) => {
    //         if (!currentElement.getRecordData().skyflowID) {
    //           revealElementLength += 1;
    //         }
    //       });

    //       this.#isElementsMounted = this.#mountedRecords.length === revealElementLength;

    //       if (this.#isRevealCalled && this.#isElementsMounted) {
    //         this.#eventEmitter._emit(
    //           ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
    //           {
    //             containerId: this.#containerId,
    //           },
    //         );
    //       }
    //     });

    this.#eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, (data) => {
      const elementIndex = this.#elementsList.findIndex(
        (element) => element.elementName === data.elementName,
      );

      if (elementIndex !== -1) {
        this.#elementsList[elementIndex] = {
          ...this.#elementsList[elementIndex],
          ...data.elementOptions,
        };

        // if (this.#containerElement) {
        //   bus.emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + data.elementName, {
        //     name: data.elementName,
        //     options: data.elementOptions,
        //   });
        // }
      }
    });
  }

  on(eventName: string, handler: Function) {
    if (!Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER, [], true);
    }
    if (!handler) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER, [], true);
    }
    if (typeof handler !== 'function') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER, [], true);
    }

    this.#eventEmitter.on(ELEMENT_EVENTS_TO_CLIENT.SUBMIT, () => {
      handler();
    });
  }
}

export default RevealComposableContainer;
