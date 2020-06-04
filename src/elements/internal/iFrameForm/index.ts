import Client from "../../../client";
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
} from "../../constants";
import EventEmitter from "../../../event-emitter";

export class IFrameForm {
  // single form to all form elements
  iFrameFormElements: Record<string, IFrameFormElement> = {};
  client?: Client;

  constructor() {
    bus
      .target(location.origin)
      .on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, (data, callback) => {
        if (!data.name) {
          throw new Error("Required params are not provided");
        }
        const frameGlobalName: string = <string>data.name;
        IFrameForm.initializeFrame(
          window.parent,
          frameGlobalName,
          this.iFrameFormElements
        );
      });

    bus.on(ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST, (data, callback) => {
      callback(this.tokenize());
    });

    bus.on(ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME, (data, callback) => {
      for (const iFrameFormElement in this.iFrameFormElements) {
        if (iFrameFormElement === data.name) {
          this.iFrameFormElements[iFrameFormElement].destroy();
          delete this.iFrameFormElements[iFrameFormElement];
        }
      }
      callback({});
    });
  }

  tokenize = () => {
    const responseObject: any = {};
    for (const iFrameFormElement in this.iFrameFormElements) {
      const state = this.iFrameFormElements[iFrameFormElement].state;
      if (!state.isValid || !state.isComplete) {
        return { error: "Provide complete and valid inputs" };
      }
      responseObject[state.name] = state.value;
    }

    return responseObject;
  };

  static initializeFrame = (
    root: Window,
    frameGlobalName: string,
    iFrameFormElements: Record<string, IFrameFormElement>
  ) => {
    let frameInstance: any = undefined;
    for (let i = 0; i < root.frames.length; i++) {
      const frame: any = root.frames[i];

      try {
        if (
          frame.location.href === location.href &&
          frame.name === frameGlobalName
        ) {
          frameInstance = frame;
          break;
        }
      } catch (e) {
        /* ignored */
        console.log("error");
      }
    }

    if (!frameInstance) {
      throw new Error("frame not found: " + frameGlobalName);
    } else {
      iFrameFormElements[frameGlobalName] =
        iFrameFormElements[frameGlobalName] ||
        new IFrameFormElement(frameGlobalName, {});

      // todo: if old form element is present sent an frame ready event again

      frameInstance.Skyflow.init(iFrameFormElements[frameGlobalName]);
    }
  };
}

export class IFrameFormElement extends EventEmitter {
  // All external Events and state events will be handled here
  state = {
    value: "",
    isFocused: false,
    isValid: false,
    isEmpty: true,
    isComplete: false,
    // isPotentiallyValid: false, todo: check whether this is useful or not
    name: "",
  };
  readonly fieldType: string;
  fieldName: string;
  iFrameName: string;
  constructor(frameGlobalName: string, options) {
    // todo: create each class for each fieldType and assign to a local variable variable
    super();
    const frameValues = frameGlobalName.split(":");
    const fieldType = frameValues[0];
    const fieldName = isNaN(parseInt(frameValues[1])) // set frame name as frame type of the string besides : is number
      ? frameValues[1]
      : frameValues[0];

    this.iFrameName = frameGlobalName;
    this.fieldType = fieldType;
    this.fieldName = fieldName;

    this.state.name = fieldName;

    this.collectBusEvents();
  }

  onFocusChange = (focus: boolean) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      type: focus
        ? ELEMENT_EVENTS_TO_CLIENT.FOCUS
        : ELEMENT_EVENTS_TO_CLIENT.BLUR,
    });
    this.changeFocus(focus);
  };

  changeFocus = (focus: boolean) => {
    this.state.isFocused = focus;

    this.sendChangeStatus();
  };

  // todo: send error message of the field
  setValue = (value: string) => {
    // todo: validate by the type of class
    this.state.value = value;
    if (this.fieldType === "dob") {
      this.state.value = new Date()
        .toISOString()
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/");
    }
    if (value && this.state.isEmpty) {
      this.state.isEmpty = false;
    } else if (!value && !this.state.isEmpty) {
      this.state.isEmpty = true;
    }

    if (ELEMENTS[this.fieldType].validator(this.state.value)) {
      this.state.isValid = true;
      this.state.isComplete = true;
    } else {
      this.state.isValid = false;
      this.state.isComplete = false;
    }

    this.sendChangeStatus();
  };

  getValue = () => {
    // todo: return part of the value if the field is readonly and make state as private
    return this.state.value;
  };

  getStatus = () => {
    return {
      isFocused: this.state.isFocused,
      isValid: this.state.isValid,
      isEmpty: this.state.isEmpty,
      isComplete: this.state.isComplete,
    };
  };

  // on client force focus
  collectBusEvents = () => {
    bus.on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, (data, callback) => {
      if (data.name === this.iFrameName) {
        if (data.event === ELEMENT_EVENTS_TO_CLIENT.FOCUS) {
          this.changeFocus(true);
          this._emit(ELEMENT_EVENTS_TO_CLIENT.FOCUS);
        } else if (data.event === ELEMENT_EVENTS_TO_CLIENT.BLUR) {
          this.changeFocus(false);
          this._emit(ELEMENT_EVENTS_TO_CLIENT.BLUR);
        }
        // todo: listen to remaining events
      } else {
        // empty
      }
    });
  };

  // todo: add setMethods to state object and emit this event in that methods
  sendChangeStatus = () => {
    // todo: need to emit it on any state change
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
      value: this.getStatus(),
    });

    this._emit(ELEMENT_EVENTS_TO_CLIENT.CHANGE, this.getStatus());
  };

  resetData() {
    this.state = {
      value: "",
      isFocused: false,
      isValid: false,
      isEmpty: true,
      isComplete: false,
      name: "",
    };
  }
  destroy() {
    this.resetData();
    this.resetEvents();
  }
}
