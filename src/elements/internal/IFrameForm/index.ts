import Client from "../../../client";
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../../constants";
import { FrameElement } from "..";

export class IFrameForm {
  formElements: Record<string, FormElement> = {};
  client?: Client;

  constructor() {
    bus
      .target(location.href)
      .on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, (data, callback) => {
        if (data.name) {
          throw new Error("Required params are not provided");
        }
        const frameGlobalName: string = <string>data.name;
        IFrameForm.initializeFrame(window, frameGlobalName, this.formElements);
      });
  }

  static initializeFrame(
    root: Window,
    frameGlobalName: string,
    formElements: Record<string, FormElement>
  ) {
    let frameInstance: any = undefined;
    for (let i = 0; i < root.frames.length; i++) {
      const frame: any = root.frames[i];

      try {
        if (
          frame.location.href === root.location.href &&
          frame.name === frameGlobalName
        ) {
          frameInstance = frame;
          break;
        }
      } catch (e) {
        /* ignored */
      }
    }

    if (!frameInstance) {
      throw new Error("frame not found: " + frameGlobalName);
    } else {
      const frameValues = frameGlobalName.split(":");
      const frameType = frameValues[0];
      const frameName = isNaN(parseInt(frameValues[1])) // set frame name as frame type of the string besides : is number
        ? frameValues[0]
        : frameValues[1];

      formElements[frameGlobalName] =
        formElements[frameGlobalName] ||
        new FormElement(frameType, { name: frameName });
      const formElement = formElements[frameGlobalName];
      frameInstance.Skyflow.init(formElement);
    }
  }
}

export class FormElement {
  state = {
    value: "",
    isFocused: false,
    isValid: false,
    isPotentiallyValid: true,
  };

  constructor(formType: string, options) {}

  // get set data, setup event handlers
}
