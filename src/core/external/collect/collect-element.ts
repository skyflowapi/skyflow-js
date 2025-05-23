/*
Copyright (c) 2022 Skyflow, Inc.
*/
/* eslint-disable no-underscore-dangle */
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  EVENT_TYPES,
  METRIC_TYPES,
  ELEMENT_TYPES,
  ElementType,
} from '../../constants';
import EventEmitter from '../../../event-emitter';
import Bus from '../../../libs/bus';
import deepClone from '../../../libs/deep-clone';
import {
  formatValidations,
  getElements,
  validateAndSetupGroupOptions,
} from '../../../libs/element-options';
import IFrame from '../common/iframe';
import {
  printLog, getElementName, parameterizedString, EnvOptions,
} from '../../../utils/logs-helper';
import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import {
  Context, Env, EventName, MessageType,
} from '../../../utils/common';
import {
  formatFrameNameToId,
  getReturnValue,
} from '../../../utils/helpers';
import SkyflowElement from '../common/skyflow-element';
import { ContainerType } from '../../../skyflow';
import {
  initalizeMetricObject,
  pushElementEventWithTimeout,
  updateMetricObjectValue,
} from '../../../metrics';

const CLASS_NAME = 'Element';
class CollectElement extends SkyflowElement {
  elementType: string;

  type: string = ContainerType.COLLECT;

  #elementId: string;

  containerId: string;

  #isSingleElementAPI: boolean = false;

  #states: any[];

  #elements: any[];

  resizeObserver: ResizeObserver | null;

  #state = {
    isEmpty: true,
    isComplete: false,
    isValid: false,
    isFocused: false,
    value: <string | Object | Blob | undefined>undefined,
    isRequired: false,
    selectedCardScheme: '',
  };

  #group: any;

  #metaData: any;

  #eventEmitter: EventEmitter = new EventEmitter();

  #groupEmitter: EventEmitter | undefined = undefined;

  #bus = new Bus();

  #iframe: IFrame;

  #updateCallbacks: Function[] = [];

  #mounted = false;

  #context:Context;

  #doesReturnValue:boolean;

  #readyToMount: boolean = false;

  #isUpdateCalled = false;

  constructor(
    elementId: string,
    elementGroup: any,
    metaData: any,
    container: any,
    isSingleElementAPI: boolean = false,
    destroyCallback: Function,
    updateCallback: Function,
    context: Context,
    groupEventEmitter?: EventEmitter,
  ) {
    super();

    this.containerId = container.containerId;
    this.#elementId = elementId;
    this.#context = context;
    this.#metaData = metaData;
    this.#group = validateAndSetupGroupOptions(elementGroup);
    this.#elements = getElements(elementGroup);
    this.#isSingleElementAPI = isSingleElementAPI;
    this.resizeObserver = null;
    if (groupEventEmitter) this.#groupEmitter = groupEventEmitter;
    // if (this.#isSingleElementAPI && this.#elements.length > 1) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.UNKNOWN_ERROR, [], true);
    // }

    this.#doesReturnValue = EnvOptions[this.#context.env].doesReturnValue;
    this.elementType = this.#isSingleElementAPI
      ? this.#elements[0].elementType
      : 'group';

    initalizeMetricObject(metaData, elementId);
    this.#states = [];
    this.#elements.forEach((element) => {
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.ELEMENT_TYPE_KEY, element.elementType);
      this.#states.push({
        isEmpty: true,
        isComplete: false,
        isValid: (!element.required && this.#state.isEmpty),
        isFocused: false,
        value: this.#doesReturnValue ? '' : undefined,
        elementType: element.elementType,
        name: element.elementName,
        isRequired: element.required,
        selectedCardScheme: '',
      });
    });
    if (this.#elements && this.#elements.length && this.#elements.length > 1) {
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.CONTAINER_NAME, ELEMENT_TYPES.COMPOSE);
    } else {
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.CONTAINER_NAME, ELEMENT_TYPES.COLLECT);
    }
    this.#iframe = new IFrame(
      this.#group.elementName,
      metaData,
      this.containerId,
      this.#context.logLevel,
    );

    this.#registerIFrameBusListener();

    this.#onDestroy(destroyCallback);
    this.#onUpdate(updateCallback);
    printLog(parameterizedString(logs.infoLogs.CREATED_ELEMENT,
      CLASS_NAME, getElementName(this.#iframe.name)), MessageType.LOG,
    this.#context.logLevel);

    this.#readyToMount = container.isMounted;

    if (container.type === ContainerType.COMPOSABLE) {
      this.#elements.forEach((element) => {
        this.#bus.on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED
          + formatFrameNameToId(element.elementName), (data) => {
          if (data.name === element.elementName) {
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, `${element.elementType}_${METRIC_TYPES.EVENTS.MOUNTED}`);
            element.isMounted = true;
            this.#mounted = true;
            this.#bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT
              + this.#iframe.name,
            {}, (payload:any) => {
              this.#iframe.setIframeHeight(payload.height);
            });
          }
        });
      });
    }

    this.#bus.on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED
      + formatFrameNameToId(this.#iframe.name), (data) => {
      if (data.name === this.#elements[0].elementName) {
        updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
        updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
        this.#elements[0].isMounted = true;
        this.#mounted = true;
        this.#bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + formatFrameNameToId(this.#iframe.name),
          {}, (payload:any) => {
            if (data.name === formatFrameNameToId(payload.name)) {
              this.#iframe.setIframeHeight(payload.height);
            }
          });
      }
    });
  }

  getID = () => this.#elementId;

  mount = (domElement) => {
    if (!domElement) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['CollectElement'], true);
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.#bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + formatFrameNameToId(this.#iframe.name),
        {}, (payload:any) => {
          this.#iframe.setIframeHeight(payload.height);
        });
    });
    updateMetricObjectValue(this.#elementId, METRIC_TYPES.DIV_ID, domElement);
    if (
      this.#metaData?.clientJSON?.config?.options?.trackMetrics
      && this.#metaData.clientJSON.config.options.trackingKey
    ) {
      pushElementEventWithTimeout(this.#elementId);
    }

    if (typeof domElement === 'string') {
      const targetElement = document.querySelector(domElement);
      if (targetElement) {
        this.resizeObserver?.observe(targetElement);
      }
    } else if (domElement instanceof HTMLElement) {
      this.resizeObserver?.observe(domElement);
    }
    const isComposable = this.#elements.length > 1;
    if (isComposable) {
      this.#iframe.mount(domElement, this.#elementId, {
        record: JSON.stringify({
          record: this.#group,
          containerId: this.containerId,
          metaData: this.#metaData,
        }),
      });
      this.#elements.forEach((element, index) => {
        if (this.#groupEmitter) {
          this.#groupEmitter._emit(`${ELEMENT_EVENTS_TO_CLIENT.READY}:${element.elementName}`, {
            ...this.#states[index],
            elementType: element.elementType,
          });
          updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, `${element.elementType}_${METRIC_TYPES.EVENTS.READY}`);
        }
      });
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_START_TIME, Date.now());
    } else if (this.#readyToMount) {
      this.#iframe.mount(domElement, this.#elementId, {
        record: JSON.stringify({
          record: this.#group,
          containerId: this.containerId,
          metaData: this.#metaData,
        }),
      });
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_START_TIME, Date.now());
    }
  };

  unmount = () => {
    this.#iframe.unmount();
    if (this.resizeObserver) {
      this.resizeObserver?.disconnect();
    }
  };

  updateElementGroup = (group) => {
    let tempGroup = deepClone(group);

    const callback = () => {
      if (this.#isSingleElementAPI) {
        tempGroup = {
          rows: [
            {
              elements: [
                {
                  ...tempGroup,
                },
              ],
            },
          ],
        };
      }
      this.#group = validateAndSetupGroupOptions(this.#group, tempGroup);
      this.#elements = getElements(this.#group);

      if (this.#isSingleElementAPI) {
        this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE
            + formatFrameNameToId(this.#iframe.name), {
          name: this.#iframe.name,
          options: this.#elements[0],
          isSingleElementAPI: true,
        });
      } else {
        // todo: check whether we need to update
        this.#elements.forEach((elementOptions) => {
          this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE
              + formatFrameNameToId(this.#iframe.name), {
            name: elementOptions.elementName,
            options: elementOptions,
            isSingleElementAPI: true,
          });
        });

        this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE
            + formatFrameNameToId(this.#iframe.name), {
          name: this.#iframe.name,
          options: this.#group,
          isSingleElementAPI: false,
        });
      }

      this.#onGroupEmitRemoveLocalValue();
    };

    if (this.#mounted) {
      callback();
    } else {
      this.#updateCallbacks.push(callback);
    }
  };

  #onUpdate = (callback) => {
    // todo: us bus if else there will be an infinite loop
    if (!this.#isSingleElementAPI) {
      this.#eventEmitter.on(
        ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + formatFrameNameToId(this.#iframe.name),
        () => {
          callback(this.#elements);
        },
        true,
      );
    }
  };

  updateElement = (elementOptions) => {
    this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + elementOptions.elementName, {
      name: elementOptions.elementName,
      options: elementOptions,
      isSingleElementAPI: true,
    });
  };

  update = (options) => {
    this.#isUpdateCalled = true;
    if (this.#mounted) {
      options.validations = formatValidations(options.validations);
      this.updateElement({ elementName: this.#group.elementName, ...options });
      this.#isUpdateCalled = false;
    } else if (this.#isUpdateCalled) {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementId}`, () => {
        options.validations = formatValidations(options.validations);
        this.updateElement({ elementName: this.#group.elementName, ...options });
        this.#mounted = true;
        this.#isUpdateCalled = false;
      });
    }
  };

  #updateState = () => {
    this.#states.forEach((elementState, index) => {
      if (index === 0) {
        this.#state.isEmpty = elementState.isEmpty;
        this.#state.isComplete = elementState.isComplete;
        this.#state.isValid = elementState.isValid;
        this.#state.isFocused = elementState.isFocused;
        this.#state.isRequired = elementState.isRequired;
        this.#state.value = {};
        this.#state.selectedCardScheme = '';
        const key = this.#elements[index].elementName;
        const value = elementState.value
          && getReturnValue(elementState.value, elementState.elementType,
            this.#doesReturnValue);
        if (this.#isSingleElementAPI) {
          this.#state.value = value;
        } else this.#state.value[key] = value;
      } else {
        this.#state.isEmpty = this.#state.isEmpty || elementState.isEmpty;
        this.#state.isComplete = this.#state.isComplete && elementState.isComplete;
        this.#state.isValid = this.#state.isValid && elementState.isValid;
        this.#state.isFocused = this.#state.isFocused || elementState.isFocused;
        this.#state.isRequired = this.#state.isRequired || elementState.isRequired;
        this.#state.selectedCardScheme = this.#state.selectedCardScheme
        || elementState.selectedCardScheme;

        if (!this.#state.value) this.#state.value = {};
        if (!this.#elements[index].sensitive) this.#state.value[this.#elements[index].elementName] = elementState.value || '';
      }
    });
  };

  getState = () => ({
    isEmpty: this.#state.isEmpty,
    isComplete: this.#state.isComplete,
    isValid: this.#state.isValid,
    isFocused: this.#state.isFocused,
    value: this.#state.value,
    required: this.#state.isRequired,
    selectedCardScheme: '',
  });

  getOptions = () => {
    // todo: remove all names
    let options = deepClone(this.#group);

    if (this.#isSingleElementAPI) {
      options = options.rows[0].elements[0];
    } else {
      options.rows.forEach((row) => {
        row.elements.forEach((element) => {
          delete element.elementName;
        });
      });
    }

    delete options.elementName;

    return options;
  };

  // listening to element events and error messages on iframe
  // todo: off methods
  on(eventName: string, handler) {
    if (!Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER, [], true);
    }
    if (!handler) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER, [], true);
    }
    if (typeof handler !== 'function') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER, [], true);
    }
    this.#eventEmitter.on(eventName, (data) => {
      if (data.value === undefined) {
        data.value = '';
      }

      if (data.elementType !== ElementType.CARD_NUMBER) delete data.selectedCardScheme;
      delete data.isComplete;
      delete data.name;
      handler(data);
    });
    if (eventName === ELEMENT_EVENTS_TO_CLIENT.READY) {
      this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_READY, {
        ready: this.#readyToMount,
        name: this.iframeName(),
      });
    }
  }

  #onDestroy = (callback) => {
    this.#eventEmitter.on(
      ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME,
      () => {
        const names = this.#elements.map((element) => element.elementName);
        if (!this.#isSingleElementAPI) names.push(this.#iframe.name);
        callback(names);
      },
      true,
    );
  };

  #registerIFrameBusListener = () => {
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_READY, (data) => {
      if (data.ready && data.name === this.iframeName()) {
        const { name, ...elementState } = this.#states[0];
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY, {
          ...elementState,
        });
      }
    });
    this.#elements.forEach((element1) => {
      this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT
        + element1.elementName, (data: any) => {
        if (
          this.#isSingleElementAPI
          && data.event === ELEMENT_EVENTS_TO_CLIENT.READY
          && data.name === formatFrameNameToId(this.#iframe.name)
        ) {
          this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY);
        } else {
          const isComposable = this.#elements.length > 1;
          this.#elements.forEach((element, index) => {
            if (data.name === element.elementName) {
              let emitEvent = '';
              switch (data.event) {
                case ELEMENT_EVENTS_TO_CLIENT.FOCUS:
                  emitEvent = ELEMENT_EVENTS_TO_CLIENT.FOCUS;
                  break;
                case ELEMENT_EVENTS_TO_CLIENT.BLUR:
                  emitEvent = ELEMENT_EVENTS_TO_CLIENT.BLUR;
                  break;
                case ELEMENT_EVENTS_TO_CLIENT.CHANGE:
                  emitEvent = ELEMENT_EVENTS_TO_CLIENT.CHANGE;
                  break;
                case ELEMENT_EVENTS_TO_CLIENT.READY:
                  emitEvent = ELEMENT_EVENTS_TO_CLIENT.READY;
                  break;
                case ELEMENT_EVENTS_TO_CLIENT.SUBMIT:
                  this.#groupEmitter?._emit(ELEMENT_EVENTS_TO_CLIENT.SUBMIT);
                  return;
                  // case ELEMENT_EVENTS_TO_CLIENT.CREATED:
                  //   this.#mounted = true;
                  //   return;
                  // todo: need to implement the below events
                  // case ELEMENT_EVENTS_TO_CLIENT.ESCAPE:
                  //   this.eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.ESCAPE);
                  //   break;
                  // case ELEMENT_EVENTS_TO_CLIENT.CLICK:
                  //   this.eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.CLICK);
                  //   break;
                  // case ELEMENT_EVENTS_TO_CLIENT.ERROR:
                  //   this.eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.ERROR);
                  //   break;

                default:
                  throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_EVENT_TYPE, [], true);
              }
              this.#states[index].isEmpty = data.value.isEmpty;
              this.#states[index].isValid = data.value.isValid;
              this.#states[index].isComplete = data.value.isComplete;
              this.#states[index].isFocused = data.value.isFocused;
              this.#states[index].isRequired = data.value.isRequired;
              this.#states[index].selectedCardScheme = data?.value?.selectedCardScheme || '';

              if (Object.prototype.hasOwnProperty.call(data.value, 'value')) this.#states[index].value = data.value.value;
              else this.#states[index].value = undefined;

              emitEvent = isComposable ? `${emitEvent}:${data.name}` : emitEvent;
              const frameName = isComposable ? this.#iframe.name
                : formatFrameNameToId(this.#iframe.name);
              this.#bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT
                + frameName,
              {}, (payload:any) => {
                this.#iframe.setIframeHeight(payload.height);
              });

              this.#updateState();
              const emitData = {
                ...this.#states[index],
                elementType: element.elementType,
              };
              if (isComposable && this.#groupEmitter) {
                this.#groupEmitter._emit(emitEvent, emitData);
              } else {
                this.#eventEmitter._emit(emitEvent, emitData);
              }
            }
          });
        }
      });
    });
  };

  #onGroupEmitRemoveLocalValue = () => {
    const { rows } = this.#group;
    rows.forEach((row) => {
      row.elements.forEach((element) => {
        if (
          element.elementType !== ELEMENTS.radio.name
          && element.elementType !== ELEMENTS.checkbox.name
        ) {
          element.value = undefined;
        }
      });
    });

    this.#elements = getElements(this.#group);
  };

  iframeName(): string {
    return this.#iframe.name;
  }

  isMounted():boolean {
    return this.#mounted;
  }

  isUpdateCalled():boolean {
    return this.#isUpdateCalled;
  }

  isValidElement():boolean {
    for (let i = 0; i < this.#elements.length; i += 1) {
      if (!Object.prototype.hasOwnProperty.call(this.#elements[i], 'table')) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_COLLECT, [], true);
      }
      if (!this.#elements[i].table) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_COLLECT, [], true);
      }
      if (!(typeof this.#elements[i].table === 'string' || this.#elements[i].table instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_COLLECT, [], true);
      }
      if (!Object.prototype.hasOwnProperty.call(this.#elements[i], 'column')) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_COLUMN_IN_COLLECT, [], true);
      }
      if (!this.#elements[i].column) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_COLUMN_IN_COLLECT, [], true);
      }
      if (!(typeof this.#elements[i].column === 'string' || this.#elements[i].column instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COLUMN_IN_COLLECT, [], true);
      }
      if (this.#elements[i].skyflowID !== undefined && !this.#elements[i].skyflowID) {
        throw new SkyflowError(
          SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_COLLECT, [], true,
        );
      }
    }
    return true;
  }

  setErrorOverride(customErrorText: string) {
    this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE
      + formatFrameNameToId(this.#iframe.name),
    {
      name: formatFrameNameToId(this.#iframe.name),
      customErrorText,
    });
  }

  setError(clientErrorText:string) {
    this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR
      + formatFrameNameToId(this.#iframe.name),
    {
      name: formatFrameNameToId(this.#iframe.name),
      isTriggerError: true,
      clientErrorText,
    });
  }

  resetError() {
    this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR
      + formatFrameNameToId(this.#iframe.name),
    {
      name: formatFrameNameToId(this.#iframe.name),
      isTriggerError: false,
    });
  }

  setValue(elementValue:string) {
    if (this.#context.env === Env.PROD) {
      printLog(parameterizedString(logs.warnLogs.UNABLE_TO_SET_VALUE_IN_PROD_ENV,
        this.#elements[0].elementType),
      MessageType.WARN, this.#context.logLevel);
      return;
    }
    if (this.#isSingleElementAPI) {
      this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + formatFrameNameToId(this.#iframe.name), {
        name: this.#iframe.name,
        options: {
          ...this.#elements[0],
          value: elementValue,
          ...this.#group,
        },
        isSingleElementAPI: true,
      });
    }
  }

  clearValue() {
    if (this.#context.env === Env.PROD) {
      printLog(parameterizedString(logs.warnLogs.UNABLE_TO_CLEAR_VALUE_IN_PROD_ENV,
        this.#elements[0].elementType),
      MessageType.WARN, this.#context.logLevel);
      return;
    }
    if (this.#isSingleElementAPI) {
      this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + formatFrameNameToId(this.#iframe.name), {
        name: this.#iframe.name,
        options: {
          ...this.#elements[0],
          value: '',
        },
        isSingleElementAPI: true,
      });
    }
  }
}

export default CollectElement;
