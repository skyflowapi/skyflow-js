import Client from "../../../client";
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  FRAME_CONTROLLER,
} from "../../constants";
import EventEmitter from "../../../event-emitter";
import { mask, unMask } from "../../../libs/strings";
import { regExFromString } from "../../../libs/regex";
import { properties } from "../../../properties";

// create separate IFrameFormElement for each radio button and separate or SET_VALUE event b/w radio buttons.
// while hitting tokenize it checks whether there are more than 2 ':' if so append each values in an array(for checkbox)
export class IFrameForm {
  // single form to all form elements
  private iFrameFormElements: Record<string, IFrameFormElement> = {};
  private client?: Client;
  private clientMetaData?: any;
  private callbacks: Function[] = [];
  constructor() {
    bus
      .target(location.origin)
      .on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, (data, callback) => {
        if (!data.name) {
          throw new Error("Required params are not provided");
        }
        if (data.name === FRAME_CONTROLLER) {
          return;
        }
        const frameGlobalName: string = <string>data.name;
        if (this.clientMetaData) this.initializeFrame(window.parent, frameGlobalName);
        else
          this.callbacks.push(() => {
            this.initializeFrame(window.parent, frameGlobalName);
          });
      });

    bus.on(ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST, (data, callback) => {
      // todo: Do we need to reset the data!?
      this.tokenize()
        .then((data) => {
          callback(data);
        })
        .catch((error) => {
          callback(error);
        });
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

  setClient(client) {
    this.client = client;
  }

  setClientMetadata(clientMetaData: any) {
    this.clientMetaData = clientMetaData;
    this.callbacks.forEach((func) => {
      func();
    });
    this.callbacks = [];
  }

  private getOrCreateIFrameFormElement = (frameName) => {
    this.iFrameFormElements[frameName] =
      this.iFrameFormElements[frameName] ||
      new IFrameFormElement(frameName, {
        ...this.clientMetaData,
      });
    return this.iFrameFormElements[frameName];
  };

  tokenize = () => {
    if (!this.client) throw new Error("client connection not established");
    const responseObject: any = {};
    for (const iFrameFormElement in this.iFrameFormElements) {
      const state = this.iFrameFormElements[iFrameFormElement].state;
      if (!state.isValid || !state.isComplete) {
        return Promise.reject({ error: "Provide complete and valid inputs" });
      }

      if (
        this.iFrameFormElements[iFrameFormElement].fieldType === ELEMENTS.checkbox.name
      ) {
        if (responseObject[state.name]) {
          responseObject[state.name] = `${responseObject[state.name]},${state.value}`;
        } else {
          responseObject[state.name] = state.value;
        }
      } else {
        responseObject[state.name] = this.iFrameFormElements[
          iFrameFormElement
        ].getUnformattedValue();
      }
    }

    return this.client.request({
      body: {
        ...responseObject,
        orgID: this.client.config.orgId,
        vaultID: this.client.config.vaultId,
      },
      requestMethod: "POST",
      url: this.client.config.workflowURL + "/getcreditscore",
      headers: { skyflow_app_id: this.client.config.appId },
    });
  };

  private initializeFrame = (root: Window, frameGlobalName: string) => {
    let frameInstance: any = undefined;
    for (let i = 0; i < root.frames.length; i++) {
      const frame: any = root.frames[i];

      try {
        if (frame.location.href === location.href && frame.name === frameGlobalName) {
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
      if (frameInstance?.Skyflow?.init) {
        frameInstance.Skyflow.init(
          this.getOrCreateIFrameFormElement,
          this.clientMetaData
        );
      }
    }
  };
}

export class IFrameFormElement extends EventEmitter {
  // All external Events and state events will be handled here
  state = {
    value: <undefined | string>undefined,
    isFocused: false,
    isValid: false,
    isEmpty: true,
    isComplete: false,
    name: "",
  };
  readonly fieldType: string;
  private sensitive: boolean;
  fieldName: string;
  iFrameName: string;
  metaData;
  private regex?: RegExp;
  replacePattern?: [RegExp, string];
  mask?: any;
  constructor(name: string, metaData) {
    super();
    const frameValues = name.split(":");
    const fieldType = frameValues[1];
    const fieldName = frameValues[2]; // set frame name as frame type of the string besides : is number

    // this.iFrameSignificantName = frameSignificantName;
    this.iFrameName = name;
    this.fieldType = fieldType;
    this.fieldName = fieldName;

    this.sensitive = ELEMENTS[this.fieldType].sensitive;

    this.state.name = fieldName;

    this.metaData = metaData;

    this.collectBusEvents();
  }

  onFocusChange = (focus: boolean) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      event: focus ? ELEMENT_EVENTS_TO_CLIENT.FOCUS : ELEMENT_EVENTS_TO_CLIENT.BLUR,
    });
    this.changeFocus(focus);
  };

  changeFocus = (focus: boolean) => {
    this.state.isFocused = focus;

    this.sendChangeStatus();

    if (this.mask) {
      this.setValue(this.state.value, true);
    }
  };

  setReplacePattern(pattern: string[]) {
    if (!pattern) return;
    this.replacePattern = [regExFromString(pattern[0]), pattern[1] || ""];
  }

  setMask(mask: string[]) {
    if (!mask) {
      return;
    }
    const newMask: any[] = [];
    newMask[0] = mask[0];
    newMask[1] = null; //todo: replacer options
    newMask[2] = mask[1];
    if (newMask[2]) {
      Object.keys(newMask[2]).forEach((key) => {
        newMask[2][key] = new RegExp(newMask[2][key]);
      });
    } else {
      newMask[2]["9"] = /[0-9]/;
      newMask[2]["a"] = /[a-zA-Z]/;
      newMask[2]["*"] = /[a-zA-Z0-9]/;
    }
    this.mask = newMask;
  }

  setValidation(validations: string[] | undefined) {
    if (validations) {
      if (validations.includes("default")) this.regex = ELEMENTS[this.fieldType].regex;
      else {
        validations.forEach((value) => {
          if (value !== "default" && value !== "required") {
            this.regex = regExFromString(value);
          }
        });
      }
    }
  }

  setSensitive(sensitive: boolean = this.sensitive) {
    if (this.sensitive === false && sensitive === true) {
      this.sensitive = sensitive;
    } else if (this.sensitive === true && sensitive === false) {
      throw Error("Sensitivity is not backward compatible");
    }
  }

  // todo: send error message of the field
  setValue = (value: string = "", valid: boolean = true) => {
    if (this.fieldType === ELEMENTS.checkbox.name) {
      // toggle for checkbox
      if (this.state.value === value) {
        this.state.value = "";
      } else {
        this.state.value = value;
      }
    } else {
      this.state.value = value;
    }

    if (this.fieldType === "dob" && typeof value === "string" && value) {
      this.state.value = new Date(value)
        .toISOString()
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/");
    }

    if (this.getUnformattedValue() && this.state.isEmpty) {
      this.state.isEmpty = false;
    } else if (!this.getUnformattedValue() && !this.state.isEmpty) {
      this.state.isEmpty = true;
    }

    if (valid && this.validator(this.state.value)) {
      this.state.isValid = true;
      this.state.isComplete = true;
    } else {
      this.state.isValid = false;
      this.state.isComplete = false;
    }

    this.sendChangeStatus(true);
  };

  getValue = () => {
    if (
      this.fieldType === "dob" &&
      this.state.value &&
      typeof this.state.value === "string"
    ) {
      return this.state.value.split("/").reverse().join("-");
    }
    return this.state.value;
  };

  getUnformattedValue = () => {
    if (!this.mask) return this.state.value;
    return unMask(this.state.value, this.mask);
  };

  getStatus = () => {
    return {
      isFocused: this.state.isFocused,
      isValid: this.state.isValid,
      isEmpty: this.state.isEmpty,
      isComplete: this.state.isComplete,
      ...(!this.sensitive && { value: this.state.value }),
    };
  };

  validator(value: string) {
    if (this.regex) {
      return this.regex.test(value);
    } else {
      return true;
    }
  }

  // on client force focus
  collectBusEvents = () => {
    bus
      .target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, (data, callback) => {
        if (bus.origin === this.metaData.clientDomain)
          if (data.name === this.iFrameName) {
            if (data.event === ELEMENT_EVENTS_TO_CLIENT.FOCUS) {
              this.changeFocus(true);
              this._emit(ELEMENT_EVENTS_TO_CLIENT.FOCUS);
            } else if (data.event === ELEMENT_EVENTS_TO_CLIENT.BLUR) {
              this.changeFocus(false);
              this._emit(ELEMENT_EVENTS_TO_CLIENT.BLUR);
            }
          } else {
            // empty
          }
      });

    bus
      .target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
        if (
          location.origin === this.metaData.clientDomain &&
          data.name === this.iFrameName
        ) {
          if (data.value !== undefined) {
            // for setting value
            this.setValue(<string | undefined>data.value);
          } else if (data.options !== undefined) {
            // for updating options
            this._emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
              options: data.options,
            });
          }
        }
      });

    // for radio buttons
    if (this.fieldType === ELEMENTS.radio.name) {
      bus.target(location.origin).on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
        if (
          data.value !== null &&
          data.value !== undefined &&
          data.value !== "" &&
          data.fieldName === this.fieldName &&
          data.fieldType === this.fieldType &&
          data.value !== this.state.value
        ) {
          this.setValue(<string | undefined>data.value);
        }
      });
    }
  };

  sendChangeStatus = (inputEvent: boolean = false) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
      value: this.getStatus(),
    });

    this._emit(ELEMENT_EVENTS_TO_CLIENT.CHANGE, {
      ...this.getStatus(),
      value: this.state.value,
    });

    // send change states for radio button(sync)
    if (inputEvent && this.fieldType === ELEMENTS.radio.name) {
      bus.target(location.origin).emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
        fieldName: this.fieldName,
        fieldType: this.fieldType,
        value: this.state.value,
      });
    }
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
