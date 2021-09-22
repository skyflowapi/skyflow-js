import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
} from "../../constants";
import EventEmitter from "../../../event-emitter";
import Bus from "../../../libs/Bus";
import deepClone from "../../../libs/deepClone";
import {
  getElements,
  validateAndSetupGroupOptions,
} from "../../../libs/element-options";
import IFrame from "./IFrame";

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
  #isDebug = false;
  constructor(
    elementGroup: any,
    metaData: any,
    containerId: string,
    isSingleElementAPI: boolean = false,
    destroyCallback: Function,
    updateCallback: Function,
    isDebug: any
  ) {
    this.containerId = containerId;
    this.#isDebug = isDebug;
    this.#group = validateAndSetupGroupOptions(elementGroup);
    this.#elements = getElements(elementGroup);
    this.#isSingleElementAPI = isSingleElementAPI;
    if (this.#isSingleElementAPI && this.#elements.length > 1) {
      throw new Error("Unknown Error");
    }
    this.elementType = this.#isSingleElementAPI
      ? this.#elements[0].elementType
      : "group";

    this.#states = [];
    this.#elements.forEach((element) => {
      this.#states.push({
        isEmpty: true,
        isComplete: false,
        isValid: false,
        isFocused: false,
        value: undefined,
        elementType: element.elementType,
        name: element.elementName,
      });
    });

    this.#iframe = new IFrame(
      this.#group.elementName,
      metaData,
      this.containerId
    );

    this.#registerIFrameBusListener();

    this.#onDestroy(destroyCallback);
    this.#onUpdate(updateCallback);
  }

  mount = (domElement) => {
    this.#iframe.mount(domElement);
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        callback(this.#group);
        this.#onGroupEmitRemoveLocalValue();
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY);
        this.#bus.off(
          ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.containerId,
          sub
        );
        this.#mounted = true;
        this.#updateCallbacks.forEach((func) => func());
        this.#updateCallbacks = [];
      }
    };
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.containerId, sub);
  };

  unmount = () => {
    this.#iframe.unmount;
  };

  update = (group) => {
    group = deepClone(group);

    const callback = () => {
      if (this.#isSingleElementAPI) {
        group = {
          rows: [
            {
              elements: [
                {
                  ...group,
                },
              ],
            },
          ],
        };
      }
      this.#group = validateAndSetupGroupOptions(this.#group, group);
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
        true
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
        const value = this.#isDebug ? elementState.value : undefined;
        if (this.#isSingleElementAPI)
          this.#state.value = this.#isDebug ? value : undefined;
        else this.#state.value[key] = value;
      } else {
        this.#state.isEmpty = this.#state.isEmpty || elementState.isEmpty;
        this.#state.isComplete =
          this.#state.isComplete && elementState.isComplete;
        this.#state.isValid = this.#state.isValid && elementState.isValid;
        this.#state.isFocused = this.#state.isFocused || elementState.isFocused;
        if (!this.#state.value) this.#state.value = {};
        if (!this.#elements[index].sensitive)
          this.#state.value[this.#elements[index].elementName] =
            elementState.value || "";
      }
    });
  };

  getState = () => {
    return {
      isEmpty: this.#state.isEmpty,
      isComplete: this.#state.isComplete,
      isValid: this.#state.isValid,
      isFocused: this.#state.isFocused,
      value: this.#state.value,
    };
  };

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
        handler(data);
      });
    } else {
      throw new Error("Provide valid event listener");
    }
  }

  // methods to invoke element events
  #blur = () => {
    let name = this.#iframe.name;
    this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: name,
      event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
    });
  };

  #focus = () => {
    let name = this.#iframe.name;
    this.#bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: name,
      event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
    });
  };

  #destroy = () => {
    // todo: destroy all the internal elements
    let name = this.#iframe.name;

    //todo: fix this
    this.#bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME,
      {
        name: name,
      },
      () => {
        this.unmount();
        this.#bus.teardown();
        this.#eventEmitter.resetEvents();
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME);
        delete this.#iframe.iframe;
      }
    );
  };

  #onDestroy = (callback) => {
    this.#eventEmitter.on(
      ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME,
      () => {
        const names = this.#elements.map((element) => element.elementName);
        if (!this.#isSingleElementAPI) names.push(this.#iframe.name);
        callback(names);
      },
      true
    );
  };

  #resetEvents = () => {
    this.#eventEmitter.resetEvents();
  };

  #registerIFrameBusListener = () => {
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, (data: any) => {
      if (
        this.#isSingleElementAPI &&
        data.event === ELEMENT_EVENTS_TO_CLIENT.READY &&
        data.name === this.#iframe.name
      ) {
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY);
      } else {
        this.#elements.forEach((element, index) => {
          if (data.name === element.elementName) {
            let emitEvent = "",
              emitData: any = undefined;
            switch (data.event) {
              case ELEMENT_EVENTS_TO_CLIENT.FOCUS:
                emitEvent = ELEMENT_EVENTS_TO_CLIENT.FOCUS;
                break;
              case ELEMENT_EVENTS_TO_CLIENT.BLUR:
                emitEvent = ELEMENT_EVENTS_TO_CLIENT.BLUR;
                break;
              case ELEMENT_EVENTS_TO_CLIENT.CHANGE:
                this.#states[index].isEmpty = data.value.isEmpty;
                this.#states[index].isComplete = data.value.isComplete;
                this.#states[index].isValid = data.value.isValid;
                this.#states[index].isFocused = data.value.isFocused;
                if (data.value.hasOwnProperty("value"))
                  this.#states[index].value = data.value.value;
                else this.#states[index].value = undefined;

                this.#updateState();

                emitEvent = ELEMENT_EVENTS_TO_CLIENT.CHANGE;
                emitData = {
                  ...this.getState(),
                  elementType: this.elementType,
                };
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
                throw new Error("Provide a valid event type");
            }

            this.#eventEmitter._emit(emitEvent, emitData);
          }
        });
      }
    });
  };

  #onGroupEmitRemoveLocalValue = () => {
    const rows = this.#group.rows;
    rows.forEach((row) => {
      row.elements.forEach((element) => {
        if (
          element.elementType !== ELEMENTS.radio.name &&
          element.elementType !== ELEMENTS.checkbox.name
        )
          element.value = undefined;
      });
    });

    this.#elements = getElements(this.#group);
  };
}

export default Element;
