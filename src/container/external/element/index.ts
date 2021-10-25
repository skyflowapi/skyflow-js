/* eslint-disable no-underscore-dangle */
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
} from '../../constants';
import EventEmitter from '../../../event-emitter';
import Bus from '../../../libs/Bus';
import deepClone from '../../../libs/deepClone';
import {
  getElements,
  validateAndSetupGroupOptions,
} from '../../../libs/element-options';
import IFrame from './IFrame';
import {
  printLog, getElementName, parameterizedString, EnvOptions,
} from '../../../utils/logsHelper';
import SkyflowError from '../../../libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import { Context, MessageType } from '../../../utils/common';

class Element {
  elementType: string;

  containerId: string;

  #isSingleElementAPI: boolean = false;

  #states: any[];

  #elements: any[];

  #state = {
    isEmpty: true,
    isComplete: false,
    isValid: false,
    isFocused: false,
    value: <string | Object | undefined>undefined,
  };

  #group: any;

  // label focus

  #eventEmitter: EventEmitter = new EventEmitter();

  #bus = new Bus();

  #iframe: IFrame;

  #updateCallbacks: Function[] = [];

  #mounted = false;

  #context:Context;

  #doesReturnValue:boolean;

  constructor(
    elementGroup: any,
    metaData: any,
    containerId: string,
    isSingleElementAPI: boolean = false,
    destroyCallback: Function,
    updateCallback: Function,
    context: Context,
  ) {
    this.containerId = containerId;
    this.#context = context;
    this.#group = validateAndSetupGroupOptions(elementGroup);
    this.#elements = getElements(elementGroup);
    this.#isSingleElementAPI = isSingleElementAPI;
    if (this.#isSingleElementAPI && this.#elements.length > 1) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.UNKNOWN_ERROR, [], true);
    }

    this.#doesReturnValue = EnvOptions[this.#context.env].doesReturnValue;
    this.elementType = this.#isSingleElementAPI
      ? this.#elements[0].elementType
      : 'group';

    this.#states = [];
    this.#elements.forEach((element) => {
      this.#states.push({
        isEmpty: true,
        isComplete: false,
        isValid: false,
        isFocused: false,
        value: this.#doesReturnValue ? element.altText : undefined,
        elementType: element.elementType,
        name: element.elementName,
      });
    });
    this.#iframe = new IFrame(
      this.#group.elementName,
      metaData,
      this.containerId,
    );

    this.#registerIFrameBusListener();

    this.#onDestroy(destroyCallback);
    this.#onUpdate(updateCallback);
    printLog(parameterizedString(logs.infoLogs.CREATED_ELEMENT,
      getElementName(this.#iframe.name)), MessageType.LOG,
    this.#context.logLevel);
  }

  mount = (domElement) => {
    this.#iframe.mount(domElement);
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        callback(this.#group);
        this.#onGroupEmitRemoveLocalValue();
        const { name, ...elementState } = this.#states[0];
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY, {
          ...elementState,
        });
        this.#bus.off(
          ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.containerId,
          sub,
        );
        this.#mounted = true;
        printLog(`${parameterizedString(logs.infoLogs.ELEMENT_MOUNTED, getElementName(this.#iframe.name))} `, MessageType.LOG,
          this.#context.logLevel);
        this.#updateCallbacks.forEach((func) => func());
        this.#updateCallbacks = [];
      }
    };
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.containerId, sub);
  };

  unmount = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.#iframe.unmount;
  };

  update = (group) => {
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
        this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
          name: this.#iframe.name,
          options: this.#elements[0],
          isSingleElementAPI: true,
        });
      } else {
        // todo: check whether we need to update
        this.#elements.forEach((elementOptions) => {
          this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
            name: elementOptions.elementName,
            options: elementOptions,
            isSingleElementAPI: true,
          });
        });

        this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
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
        ELEMENT_EVENTS_TO_IFRAME.SET_VALUE,
        () => {
          callback(this.#elements);
        },
        true,
      );
    }
  };

  #updateState = () => {
    this.#states.forEach((elementState, index) => {
      if (index === 0) {
        this.#state.isEmpty = elementState.isEmpty;
        this.#state.isComplete = elementState.isComplete;
        this.#state.isValid = elementState.isValid;
        this.#state.isFocused = elementState.isFocused;
        this.#state.value = {};
        const key = this.#elements[index].elementName;
        const value = this.#doesReturnValue ? elementState.value : undefined;
        if (this.#isSingleElementAPI) {
          this.#state.value = value;
        } else this.#state.value[key] = value;
      } else {
        this.#state.isEmpty = this.#state.isEmpty || elementState.isEmpty;
        this.#state.isComplete = this.#state.isComplete && elementState.isComplete;
        this.#state.isValid = this.#state.isValid && elementState.isValid;
        this.#state.isFocused = this.#state.isFocused || elementState.isFocused;
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
    if (Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      this.#eventEmitter.on(eventName, (data) => {
        if (data.value === undefined) {
          data.value = '';
        }
        delete data.isComplete;
        handler(data);
      });
    } else {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER, [], true);
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
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, (data: any) => {
      if (
        this.#isSingleElementAPI
        && data.event === ELEMENT_EVENTS_TO_CLIENT.READY
        && data.name === this.#iframe.name
      ) {
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY);
      } else {
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
            if (Object.prototype.hasOwnProperty.call(data.value, 'value')) this.#states[index].value = data.value.value;
            else this.#states[index].value = undefined;

            this.#updateState();

            const emitData = {
              ...this.getState(),
              elementType: this.elementType,
            };
            this.#eventEmitter._emit(emitEvent, emitData);
          }
        });
      }
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

  // Gateway
  iframeName(): string {
    return this.#iframe.name;
  }

  isMounted():boolean {
    return this.#mounted;
  }

  isValidElement():boolean {
    for (let i = 0; i < this.#elements.length; i += 1) {
      if (!(this.#elements[i].table && this.#elements[i].column)) { return false; }
    }
    return true;
  }
}

export default Element;
