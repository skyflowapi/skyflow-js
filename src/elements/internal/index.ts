import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENTS,
  ALLOWED_STYLES,
  STYLE_TYPE,
  ALLOWED_PSEUDO_STYLES,
  FRAME_CONTROLLER,
  INPUT_STYLES,
} from "../constants";
import $ from "jquery";
import bus from "framebus";
import injectStylesheet from "inject-stylesheet";
import Client from "../../client";
import { IFrameForm, IFrameFormElement } from "./iFrameForm";
import { setAttributes, setStyles } from "../../iframe-libs/iframer";
import { splitStyles } from "../../libs/styles";
import { validateElementOptions } from "../../libs/element-options";
import "jquery-mask-plugin/dist/jquery.mask.min";

export class FrameController {
  static controller?: FrameController;
  #client?: Client;
  #iFrameForm: IFrameForm;
  constructor() {
    this.#iFrameForm = new IFrameForm();
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      { name: FRAME_CONTROLLER },
      (clientMetaData: any) => {
        const clientJSON = clientMetaData.clientJSON;
        this.#iFrameForm.setClientMetadata(clientMetaData);
        this.#iFrameForm.setClient(Client.fromJSON(clientJSON));
        delete clientMetaData.clientJSON;
      }
    );
  }
  static init(uuid: string) {
    if (this.controller) return this.controller;
    this.controller = new FrameController();
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  options: any;
  private htmlDivElement: HTMLDivElement;
  private iFrameFormElement: IFrameFormElement;
  private domLabel?: HTMLLabelElement;
  private domInput?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

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
      if (state.value && this.iFrameFormElement.fieldType === ELEMENTS.radio.name) {
        (<HTMLInputElement>this.domInput).checked = this.options.value === state.value;
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
      min: this.options.min,
      max: this.options.max,
      maxLength: this.options.maxLength,
      minLength: this.options.minLength,
      autocomplete: this.options.autocomplete,
      disabled: this.options.disabled ? true : undefined,
      readOnly: this.options.readOnly ? true : undefined,
      required: this.options.validation?.includes("required") || undefined,
    };

    if (this.domInput && this.iFrameFormElement.fieldType === ELEMENTS.dropdown.name) {
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
        (<HTMLInputElement>this.domInput).checked = this.options.value === newInputValue;
      } else {
        this.domInput.value = newInputValue || "";
      }

      if (this.iFrameFormElement.mask || this.iFrameFormElement.replacePattern) {
        $(document).ready(() => {
          $(this.domInput as any).trigger("input");
        });
      }
    }

    this.iFrameFormElement.setValue(newInputValue, this.domInput?.checkValidity());
  }

  updateParentDiv = (newDiv: HTMLDivElement) => {
    this.htmlDivElement = newDiv;
    this.htmlDivElement.append(this.domLabel || "", this.domInput || "");
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
    const stylesByClassName = {};
    Object.values(STYLE_TYPE).forEach((classType) => {
      if (styles[classType] && Object.keys(styles).length !== 0) {
        const [nonPseudoStyles, pseudoStyles] = splitStyles(styles[classType]);
        stylesByClassName[
          ".SkyflowElement-" + preText + "-" + this.options.name + "-" + classType
        ] = nonPseudoStyles;
        for (const pseudoStyle in pseudoStyles) {
          if (ALLOWED_PSEUDO_STYLES.includes(pseudoStyle))
            stylesByClassName[
              ".SkyflowElement-" +
                preText +
                "-" +
                this.options.name +
                "-" +
                classType +
                pseudoStyle
            ] = pseudoStyles[pseudoStyle];
        }
      }
    });

    injectStylesheet.injectWithAllowlist(stylesByClassName, ALLOWED_STYLES);
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
  }

  setClass(types: string[], dom?: HTMLElement, preText: string = "") {
    if (dom) {
      let classes = ["base"];
      Object.values(STYLE_TYPE).forEach((type) => {
        if (types.includes(type)) classes.push(type);
      });
      classes = classes.map(
        (type) => "SkyflowElement-" + preText + "-" + this.options.name + "-" + type
      );

      dom.className = classes.join(" ");
    }
  }

  updateOptions(options) {
    const newOptions = { ...this.options, ...options };

    validateElementOptions(this.iFrameFormElement.fieldType, this.options, newOptions);

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

    if (this.domLabel) this.domLabel.textContent = this.options.label;

    $(document).ready(() => {
      const id: any = this.domInput || `#${this.iFrameFormElement.iFrameName}`;

      this.iFrameFormElement.setValidation(this.options.validation);
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
        options.hasOwnProperty("value") &&
          options.value !== this.iFrameFormElement.getValue()
      );
    });
  }
}
