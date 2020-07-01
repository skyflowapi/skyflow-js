import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENTS,
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
} from "../../constants";
import iframer, {
  setAttributes,
  getIframeSrc,
} from "../../../iframe-libs/iframer";
import EventEmitter from "../../../event-emitter";
import Bus from "../../../libs/Bus";
import deepClone from "../../../libs/deepClone";
import {
  getStylesFromClass,
  buildStylesFromClassesAndStyles,
} from "../../../libs/styles";
import {
  validateElementOptions,
  getElements,
  validateAndSetupGroupOptions,
} from "../../../libs/element-options";

class Element {
  elementType: string;
  private name: string;
  private metaData: any;
  private group: any;
  private isSingleElementAPI: boolean = false;
  private iframe: HTMLIFrameElement;
  private states: any[];
  private elements: any[];
  private state = {
    isEmpty: true,
    isComplete: false,
    isValid: false,
    isFocused: false,
    container: <HTMLFrameElement | null>null,
    value: <string | Object | undefined>undefined,
  };

  // label focus

  private eventEmitter: EventEmitter = new EventEmitter();
  private bus = new Bus();

  constructor(
    elementGroup: any,
    metaData: any,
    isSingleElementAPI: boolean = false,
    destroyCallback: Function,
    updateCallback: Function
  ) {
    // this.group = elementGroup;
    this.group = validateAndSetupGroupOptions(elementGroup);
    this.metaData = metaData;
    this.elements = getElements(elementGroup);
    this.isSingleElementAPI = isSingleElementAPI;
    if (this.isSingleElementAPI && this.elements.length > 1) {
      throw new Error("Unknown Error");
    }
    this.name = elementGroup.elementName;
    this.elementType = this.isSingleElementAPI
      ? this.elements[0].elementType
      : "group";

    this.states = [];
    this.elements.forEach((element) => {
      this.states.push({
        isEmpty: true,
        isComplete: false,
        isValid: false,
        isFocused: false,
        value: undefined,
        elementType: element.elementType,
        name: element.elementName,
      });
    });

    this.iframe = iframer({ name: this.name });

    this.registerIFrameBusListener();

    this.onDestroy(destroyCallback);
    this.onUpdate(updateCallback);
  }

  mount = (domElement) => {
    this.unmount();
    try {
      if (typeof domElement === "string")
        this.state.container = document.querySelector(domElement);
      else this.state.container = domElement;
    } catch (e) {
      throw new Error("Provided element selector is not valid or not found");
    }

    setAttributes(this.iframe, { src: getIframeSrc(this.metaData.uuid) });
    this.state.container?.appendChild(this.iframe);
    // todo: add event listener on change/focus/blur on label and emit change event on iframe

    const sub = (data, callback) => {
      if (data.name === this.name) {
        callback(this.group);
        this.bus.off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
      }
    };
    this.bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
  };

  update = (group) => {
    group = deepClone(group);

    if (this.isSingleElementAPI) {
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
    this.group = validateAndSetupGroupOptions(this.group, group);
    this.elements = getElements(this.group);

    if (this.isSingleElementAPI) {
      this.bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
        name: this.name,
        options: this.elements[0],
      });
    } else {
      // todo: check whether we need to update
      this.elements.forEach((elementOptions) => {
        this.bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
          name: elementOptions.elementName,
          options: elementOptions,
        });
      });

      this.bus.emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
        name: this.name,
        options: this.group,
      });
    }
  };

  private onUpdate = (callback) => {
    // todo: us bus if else there will be an infinite loop
    if (!this.isSingleElementAPI) {
      this.eventEmitter.on(
        ELEMENT_EVENTS_TO_IFRAME.SET_VALUE,
        () => {
          callback(this.elements);
        },
        true
      );
    }
  };

  private updateState = () => {
    this.states.forEach((elementState, index) => {
      if (index === 0) {
        this.state.isEmpty = elementState.isEmpty;
        this.state.isComplete = elementState.isComplete;
        this.state.isValid = elementState.isValid;
        this.state.isFocused = elementState.isFocused;
        this.state.value = {};
        const key = this.elements[index].elementName;
        const value = this.elements[index].sensitive
          ? undefined
          : elementState.value;
        if (this.isSingleElementAPI) this.state.value = value;
        else this.state.value[key] = value;
      } else {
        this.state.isEmpty = this.state.isEmpty || elementState.isEmpty;
        this.state.isComplete =
          this.state.isComplete && elementState.isComplete;
        this.state.isValid = this.state.isValid && elementState.isValid;
        this.state.isFocused = this.state.isFocused || elementState.isFocused;
        if (!this.state.value) this.state.value = {};
        if (!this.elements[index].sensitive)
          this.state.value[this.elements[index].elementName] =
            elementState.value || "";
      }
    });
  };

  getState = () => {
    return {
      isEmpty: this.state.isEmpty,
      isComplete: this.state.isComplete,
      isValid: this.state.isValid,
      isFocused: this.state.isFocused,
      value: this.state.value,
    };
  };

  getOptions = () => {
    // todo: remove all names
    const options = deepClone(this.group);
    delete options.options;
    delete options.value;

    return options;
  };

  // listening to element events and error messages on iframe
  // todo: off methods
  on(eventName: string, handler) {
    if (Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      this.eventEmitter.on(eventName, (data) => {
        handler(data);
      });
    } else {
      throw new Error("Provide valid event listener");
    }
  }

  // methods to invoke element events
  blur = () => {
    let name = this.name;
    // if (this.isSingleElementAPI) {
    //   name = this.elements[0].elementName;
    // }
    this.bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: name,
      event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
    });
  };

  focus = () => {
    let name = this.name;
    // if (this.isSingleElementAPI) {
    //   name = this.elements[0].name;
    // }
    this.bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: name,
      event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
    });
  };

  destroy = () => {
    // todo: destroy all the internal elements
    let name = this.name;
    // if (this.isSingleElementAPI) {
    //   name = this.elements[0].name;
    // }

    //todo: fix this
    this.bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME,
      {
        name: name,
      },
      () => {
        this.unmount();
        this.bus.teardown();
        this.eventEmitter.resetEvents();
        this.eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME);
        delete this.iframe;
      }
    );
  };

  private onDestroy = (callback) => {
    this.eventEmitter.on(
      ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME,
      () => {
        const names = this.elements.map((element) => element.elementName);
        if (!this.isSingleElementAPI) names.push(this.name);
        callback(names);
      },
      true
    );
  };

  unmount = () => {
    this.iframe.remove();
  };

  resetEvents = () => {
    this.eventEmitter.resetEvents();
  };

  private registerIFrameBusListener() {
    this.bus.on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, (data: any) => {
      if (
        this.isSingleElementAPI &&
        data.event === ELEMENT_EVENTS_TO_CLIENT.READY &&
        data.name === this.name
      ) {
        this.eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY);
      } else {
        this.elements.forEach((element, index) => {
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
                this.states[index].isEmpty = data.value.isEmpty;
                this.states[index].isComplete = data.value.isComplete;
                this.states[index].isValid = data.value.isValid;
                this.states[index].isFocused = data.value.isFocused;
                if (data.value.hasOwnProperty("value"))
                  this.states[index].value = data.value.value;
                else this.states[index].value = undefined;

                this.updateState();

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

            this.eventEmitter._emit(emitEvent, emitData);
          }
        });
      }
    });
  }
}

export default Element;
