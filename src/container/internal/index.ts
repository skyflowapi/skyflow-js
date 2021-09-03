import bus from "framebus";
import Client from "../../client";
import { setAttributes } from "../../iframe-libs/iframer";
import { validateElementOptions } from "../../libs/element-options";
import { splitStyles } from "../../libs/styles";
import injectStylesheet from "inject-stylesheet";
import $ from "jquery";
import "jquery-mask-plugin/dist/jquery.mask.min";
import {
  ALLOWED_PSEUDO_STYLES,
  ALLOWED_STYLES,
  ELEMENTS,
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  COLLECT_FRAME_CONTROLLER,
  INPUT_STYLES,
  STYLE_TYPE,
  ERROR_TEXT_STYLES,
} from "../constants";
import { IFrameForm, IFrameFormElement } from "./iFrameForm";
import { getCssClassesFromJss } from "../../libs/jss-styles";

export class FrameController {
  controller?: FrameController;
  controllerId: string;
  #client?: Client;
  #iFrameForm: IFrameForm;
  private clientDomain: string;
  constructor(controllerId: string) {
    this.clientDomain = document.referrer.split("/").slice(0, 3).join("/");
    this.#iFrameForm = new IFrameForm(controllerId, this.clientDomain);
    this.controllerId = controllerId;
    bus
      .target(this.clientDomain)
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + controllerId,
        { name: COLLECT_FRAME_CONTROLLER + controllerId },
        (clientMetaData: any) => {
          clientMetaData = {
            ...clientMetaData,
            clientJSON: {
              ...clientMetaData.clientJSON,
              config: {
                ...clientMetaData.clientJSON.config,
                getBearerToken: new Function(
                  "return " + clientMetaData.clientJSON.config.getBearerToken
                )(),
              },
            },
          };
          const clientJSON = clientMetaData.clientJSON;
          this.#iFrameForm.setClientMetadata(clientMetaData);
          this.#iFrameForm.setClient(Client.fromJSON(clientJSON));
          delete clientMetaData.clientJSON;
        }
      );
  }
  static init(uuid: string) {
    return new FrameController(uuid);
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  options: any;
  private htmlDivElement: HTMLDivElement;
  private iFrameFormElement: IFrameFormElement;
  private domLabel?: HTMLLabelElement;
  private domInput?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  private domError?: HTMLSpanElement;

  constructor(
    iFrameFormElement: IFrameFormElement,
    options: any,
    htmlDivElement: HTMLDivElement
  ) {
    this.iFrameFormElement = iFrameFormElement;
    this.options = options;
    this.htmlDivElement = htmlDivElement;

    this.mount();
  }

  // mount element onto dom
  mount = () => {
    this.iFrameFormElement.resetEvents();
    this.domLabel = document.createElement("label");
    this.domLabel.htmlFor = this.iFrameFormElement.iFrameName;

    this.domError = document.createElement("span");

    const inputElement = document.createElement(
      this.iFrameFormElement.fieldType === ELEMENTS.dropdown.name
        ? "select"
        : this.iFrameFormElement?.fieldType === ELEMENTS.textarea.name
        ? "textarea"
        : "input"
    );

    this.domInput = inputElement;

    // events and todo: onclick, onescape ...???
    inputElement.onfocus = (event) => {
      this.onFocusChange(event, true);
    };
    inputElement.onblur = (event) => {
      this.onFocusChange(event, false);
    };

    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.FOCUS, () => {
      this.focusChange(true);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, () => {
      this.focusChange(false);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.CHANGE, (state) => {
      if (
        state.value &&
        this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        (<HTMLInputElement>this.domInput).checked =
          this.options.value === state.value;
      }
      if ((state.isEmpty || state.isValid) && this.domError) {
        this.domError.innerText = "";
      } else if (!state.isEmpty && !state.isValid && this.domError) {
        this.domError.innerText = this.options.label
          ? "Invalid " + this.options.label
          : "Invalid value";
      }
      this.updateStyleClasses(state);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
      if (data.options) {
        this.updateOptions(data.options);
      }
    });

    // this.setupInputField();
    this.updateOptions(this.options);

    this.updateParentDiv(this.htmlDivElement);

    this.updateStyleClasses(this.iFrameFormElement.getStatus());
  };

  setupInputField(newValue: boolean = false) {
    // todo: attr for textarea
    const attr = {
      ...ELEMENTS[this.iFrameFormElement.fieldType || ""].attributes,
      name: this.iFrameFormElement.fieldName,
      id: this.iFrameFormElement.iFrameName,
      placeholder: this.options.placeholder,
      disabled: this.options.disabled ? true : undefined,
      readOnly: this.options.readOnly ? true : undefined,
      required: this.options.required ? true : undefined,
    };

    if (
      this.domInput &&
      this.iFrameFormElement.fieldType === ELEMENTS.dropdown.name
    ) {
      this.domInput.innerHTML = "";
      this.options.options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        this.domInput?.append(optionElement);
      });
    }

    setAttributes(this.domInput, attr);

    let newInputValue = this.iFrameFormElement.getValue();

    // HTML don't support validity on radio
    if (this.iFrameFormElement.getValue() === undefined) {
      if (
        this.iFrameFormElement.fieldType === ELEMENTS.checkbox.name ||
        this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        // this.iFrameFormElement.setValue("");
        newInputValue = "";
      } else if (this.options.value) {
        // this.iFrameFormElement.setValue(this.options.value);
        newInputValue = this.options.value;
      }
    }

    if (
      newValue &&
      this.iFrameFormElement.fieldType !== ELEMENTS.checkbox.name &&
      this.iFrameFormElement.fieldType !== ELEMENTS.radio.name
    ) {
      newInputValue = this.options.value;
    }

    if (this.domInput) {
      if (
        this.iFrameFormElement.fieldType === ELEMENTS.checkbox.name ||
        this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        this.domInput.value = this.options.value;
        (<HTMLInputElement>this.domInput).checked =
          this.options.value === newInputValue;
      } else {
        this.domInput.value = newInputValue || "";
      }

      if (
        this.iFrameFormElement.mask ||
        this.iFrameFormElement.replacePattern
      ) {
        $(document).ready(() => {
          $(this.domInput as any).trigger("input");
        });
      }
    }

    this.iFrameFormElement.setValue(
      newInputValue,
      this.domInput?.checkValidity()
    );
  }

  updateParentDiv = (newDiv: HTMLDivElement) => {
    this.htmlDivElement = newDiv;
    this.htmlDivElement.append(
      this.domLabel || "",
      this.domInput || "",
      this.domError || ""
    );
  };

  setValue = (value) => {
    if (this.domInput) {
      this.domInput.value = value;
    }
  };

  // events from HTML
  onFocusChange = (event: FocusEvent, focus: boolean) => {
    // emit event to iFrameFormElement
    this.iFrameFormElement.onFocusChange(focus);
  };

  onInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.iFrameFormElement.setValue(target.value, target.checkValidity());
  };

  focusChange = (focus: boolean) => {
    if (focus) this.domInput?.focus();
    else this.domInput?.blur();
  };

  destroy = () => {};

  injectInputStyles(styles, preText: string = "") {
    getCssClassesFromJss(styles, `${preText}-${this.options.name}`);
  }

  updateStyleClasses(state: {
    isFocused: boolean;
    isValid: boolean;
    isEmpty: boolean;
    isComplete: boolean;
  }) {
    const classes: string[] = [];

    if (state.isEmpty) {
      classes.push(STYLE_TYPE.EMPTY);
    } else {
      if (!state.isValid) {
        classes.push(STYLE_TYPE.INVALID);
      }
      if (state.isComplete) {
        classes.push(STYLE_TYPE.COMPLETE);
      }
    }

    this.setClass(classes, this.domInput);
    this.setClass(classes, this.domLabel, "label");

    if (!state.isValid) this.setClass(classes, this.domError, "error");
  }

  setClass(types: string[], dom?: HTMLElement, preText: string = "") {
    if (dom) {
      let classes = ["base"];
      Object.values(STYLE_TYPE).forEach((type) => {
        if (types.includes(type)) classes.push(type);
      });
      classes = classes.map(
        (type) =>
          "SkyflowElement-" + preText + "-" + this.options.name + "-" + type
      );

      dom.className = classes.join(" ");
    }
  }

  updateOptions(options) {
    const newOptions = { ...this.options, ...options };

    validateElementOptions(
      this.iFrameFormElement.fieldType,
      this.options,
      newOptions
    );

    this.options = newOptions;

    // todo: clear old styles
    if (options.styles) {
      // update element styles
      options.styles.base = {
        ...INPUT_STYLES,
        ...options.styles.base,
      };
      this.injectInputStyles(options.styles);
    }
    if (options?.labelStyles?.styles) {
      // update label styles
      this.injectInputStyles(options?.labelStyles?.styles, "label");
    }

    let errorStyles = {
      invalid: {
        ...ERROR_TEXT_STYLES,
      },
    };
    this.injectInputStyles(errorStyles, "error");

    if (this.domLabel) this.domLabel.textContent = this.options.label;

    $(document).ready(() => {
      const id: any = this.domInput || `#${this.iFrameFormElement.iFrameName}`;

      this.iFrameFormElement.setValidation();
      this.iFrameFormElement.setReplacePattern(this.options.replacePattern);
      this.iFrameFormElement.setMask(this.options.mask);

      const mask = this.iFrameFormElement.mask;
      $(id).off("input");
      (<any>$).jMaskGlobals.translation = {};
      (<any>$).jMaskGlobals.clearIfNotMatch = true;

      $(id).unmask();

      if (mask) {
        const translation = {};
        Object.keys(mask[2]).forEach((key) => {
          translation[key] = { pattern: mask[2][key] };
        });

        $(id).mask(mask[0], {
          translation,
        });
      }

      if (this.domInput) {
        const replacePattern = this.iFrameFormElement.replacePattern;
        if (replacePattern) {
          $(id).on("input", (event) => {
            event.target.value = event.target.value.replace(
              replacePattern[0],
              replacePattern[1]
            );
          });
        }

        $(id).on("input", this.onInputChange);
      }

      this.setupInputField(
        options.value !== undefined &&
          options.value !== null &&
          options.value !== this.iFrameFormElement.getValue()
      );
    });
  }
}
