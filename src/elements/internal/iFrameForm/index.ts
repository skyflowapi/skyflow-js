import Client from "../../../client";
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../../constants";
import { FrameElement } from "..";
import EventEmitter from "../../../event-emitter";
import { FramebusOnHandler } from "framebus/dist/lib/types";

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
  }

  tokenize = () => {
    const responseObject: any = {};
    for (const iFrameFormElement in this.iFrameFormElements) {
      const state = this.iFrameFormElements[iFrameFormElement].state;
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
    isPotentiallyValid: true,
    name: "",
  };
  fieldType: string;
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
  };

  setValue = (value: string) => {
    // todo: validate by the type of class
    this.state.value = value;
  };

  getValue = () => {
    // todo: return part of the value if the field is readonly
    return this.state.value;
  };

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
        // clear focus if any other
      }
    });
  };

  // get set data, setup event handlers
}
