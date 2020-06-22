import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENTS,
  ALLOWED_STYLES,
  STYLE_TYPE,
  ALLOWED_PSEUDO_STYLES,
  FRAME_CONTROLLER,
} from "../constants";
import bus from "framebus";
import injectStylesheet from "inject-stylesheet";
import Client from "../../client";
import { IFrameForm, IFrameFormElement } from "./iFrameForm";
import { setAttributes, setStyles } from "../../iframe-libs/iframer";
import { splitStyles } from "../../libs/styles";
import Element from "../external/element";
import { validateElementOptions } from "../../libs/element-options";

export class FrameController {
  static controller?: FrameController;
  client?: Client;
  iFrameForm: IFrameForm;
  constructor() {
    this.iFrameForm = new IFrameForm();
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      { name: FRAME_CONTROLLER },
      (clientMetaData: any) => {
        const clientJSON = clientMetaData.clientJSON;
        this.iFrameForm.setClientMetadata(clientMetaData);
        this.iFrameForm.setClient(Client.fromJSON(clientJSON));
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
  static frameElement?: FrameElement; // factory class
  static options?: any;
  private iFrameFormElement: IFrameFormElement;
  // private inputCursorLocation: number | null = 0;
  domForm?: HTMLFormElement;
  domFormInput?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  // called on iframe loaded im html file
  static start = () => {
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      { name: window.name },
      (options) => {
        FrameElement.options = options;
        if (FrameElement.frameElement) {
          FrameElement.frameElement.mount();
        }
      }
    );
  };

  // called by IFrameForm
  static init = (iFrameFormElement: IFrameFormElement) => {
    FrameElement.frameElement = new FrameElement(iFrameFormElement);
  };

  constructor(iFrameFormElement: IFrameFormElement) {
    this.iFrameFormElement = iFrameFormElement;

    if (FrameElement.options) {
      this.mount();
    }
  }

  // mount element onto dom
  mount = () => {
    // this.injectInputStyles();
    this.iFrameFormElement?.resetEvents();
    const form = document.createElement("form");
    this.domForm = form;
    form.action = "#";
    form.onsubmit = (event) => {
      event.preventDefault();
    };

    const inputElement = document.createElement(
      this.iFrameFormElement?.fieldType === ELEMENTS.dropdown.name
        ? "select"
        : this.iFrameFormElement?.fieldType === ELEMENTS.textarea.name
        ? "textarea"
        : "input"
    );

    this.domFormInput = inputElement;

    // events and todo: onclick, onescape ...???
    inputElement.onfocus = (event) => {
      this.onFocusChange(event, true);
    };
    inputElement.onblur = (event) => {
      this.onFocusChange(event, false);
    };
    inputElement.oninput = (event) => {
      this.onInputChange(event);
    };

    // events from client or on pressing tab, label etc
    // this.iFrameFormElement?.on()
    this.iFrameFormElement?.on(ELEMENT_EVENTS_TO_CLIENT.FOCUS, () => {
      this.focusChange(true);
    });
    this.iFrameFormElement?.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, () => {
      this.focusChange(false);
    });
    this.iFrameFormElement?.on(ELEMENT_EVENTS_TO_CLIENT.CHANGE, (state) => {
      if (
        state.value &&
        this.iFrameFormElement?.fieldType === ELEMENTS.radio.name
      ) {
        (<HTMLInputElement>this.domFormInput).checked =
          FrameElement.options.value === state.value;
      } else if (
        this.iFrameFormElement.fieldType !== ELEMENTS.radio.name &&
        this.iFrameFormElement.fieldType !== ELEMENTS.checkbox.name
      ) {
        if (FrameElement.options.mask || FrameElement.options.replacePattern) {
          this.setValue(state.value);
        }
      }
      this.updateInputStyleClass(state);
    });
    this.iFrameFormElement?.on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
      if (data.options) {
        this.updateOptions(data.options);
      }
    });

    // this.setupInputField();
    this.updateOptions(FrameElement.options);

    form.append(inputElement);
    document.body.append(form);

    this.iFrameFormElement &&
      this.updateInputStyleClass(this.iFrameFormElement?.getStatus());
  };

  setupInputField(newValue: boolean = false) {
    // todo: attr for textarea
    const attr = {
      ...ELEMENTS[this.iFrameFormElement?.fieldType || ""].attributes,
      name: this.iFrameFormElement?.fieldName,
      id: this.iFrameFormElement?.iFrameName,
      disabled: FrameElement.options.disabled,
      placeholder: FrameElement.options.placeholder,
      readonly: FrameElement.options.readonly,
      min: FrameElement.options.min,
      max: FrameElement.options.max,
      maxLength: FrameElement.options.maxLength,
      minLength: FrameElement.options.minLength,
      autocomplete: FrameElement.options.autocomplete,
      ...(FrameElement.options.validation?.includes("required") && {
        required: "",
      }),
    };

    if (
      this.domFormInput &&
      this.iFrameFormElement?.fieldType === ELEMENTS.dropdown.name
    ) {
      this.domFormInput.innerHTML = "";
      FrameElement.options.options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.innerText = option.text;
        this.domFormInput?.append(optionElement);
      });
    }

    setAttributes(this.domFormInput, attr);

    let newInputValue = this.iFrameFormElement.getValue();

    // HTML don't support validity on radio
    if (this.iFrameFormElement?.getValue() === undefined) {
      if (
        this.iFrameFormElement?.fieldType === ELEMENTS.checkbox.name ||
        this.iFrameFormElement?.fieldType === ELEMENTS.radio.name
      ) {
        // this.iFrameFormElement?.setValue("");
        newInputValue = "";
      } else if (FrameElement.options.value) {
        // this.iFrameFormElement?.setValue(FrameElement.options.value);
        newInputValue = FrameElement.options.value;
      }
    }

    if (
      newValue &&
      this.iFrameFormElement?.fieldType !== ELEMENTS.checkbox.name &&
      this.iFrameFormElement?.fieldType !== ELEMENTS.radio.name
    ) {
      newInputValue = FrameElement.options.value;
    }

    if (this.domFormInput) {
      if (
        this.iFrameFormElement?.fieldType === ELEMENTS.checkbox.name ||
        this.iFrameFormElement?.fieldType === ELEMENTS.radio.name
      ) {
        this.domFormInput.value = FrameElement.options.value;
        (<HTMLInputElement>this.domFormInput).checked =
          FrameElement.options.value === newInputValue;
      } else {
        this.domFormInput.value = newInputValue || "";
      }
    }

    this.iFrameFormElement.setValue(
      newInputValue,
      this.domFormInput?.checkValidity()
    );
  }

  setValue = (value) => {
    if (this.domFormInput) {
      this.domFormInput.value = value;
      // if (this.inputCursorLocation) {
      //   console.log(this.inputCursorLocation);
      //   (<HTMLInputElement>(
      //     this.domFormInput
      //   )).selectionEnd = this.inputCursorLocation;
      //   (<HTMLInputElement>(
      //     this.domFormInput
      //   )).selectionStart = this.inputCursorLocation;
      // }
    }
    // todo: replace the cursor to its prev place on masking
    // var target = e.target,
    //   position = target.selectionStart; // Capture initial position

    // target.value = target.value.replace(/\s/g, ""); // This triggers the cursor to move.

    // target.selectionEnd = position; // Set the cursor back to the initial position.
  };

  // events from HTML
  onFocusChange = (event: FocusEvent, focus: boolean) => {
    // emit event to iFrameFormElement
    this.iFrameFormElement?.onFocusChange(focus);
  };

  onInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    // console.log(target.value, target.selectionStart, target.selectionEnd);
    // this.inputCursorLocation = (<HTMLInputElement>(
    //   this.domFormInput
    // )).selectionStart;
    this.iFrameFormElement?.setValue(target.value, target.checkValidity());
  };

  focusChange = (focus: boolean) => {
    if (focus) this.domFormInput?.focus();
    else this.domFormInput?.blur();
  };

  destroy = () => {};

  injectInputStyles() {
    const styles = FrameElement.options.styles;

    const stylesByClassName = {};
    Object.values(STYLE_TYPE).forEach((classType) => {
      if (styles[classType] && Object.keys(styles).length !== 0) {
        const [nonPseudoStyles, pseudoStyles] = splitStyles(styles[classType]);
        stylesByClassName[".SkyflowElement--" + classType] = nonPseudoStyles;
        for (const pseudoStyle in pseudoStyles) {
          if (ALLOWED_PSEUDO_STYLES.includes(pseudoStyle))
            stylesByClassName[".SkyflowElement--" + classType + pseudoStyle] =
              pseudoStyles[pseudoStyle];
        }
      }
    });

    injectStylesheet.injectWithAllowlist(stylesByClassName, ALLOWED_STYLES);
  }

  updateInputStyleClass(state: {
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

    this.setClass(...classes);
  }

  setClass(...types: string[]) {
    if (this.domFormInput) {
      // types = types.sort();
      // types = types.map((type) => "SkyflowElement--" + type.toLowerCase());
      let classes = ["base"];
      Object.values(STYLE_TYPE).forEach((type) => {
        if (types.includes(type)) classes.push(type);
      });
      classes = classes.map((type) => "SkyflowElement--" + type);

      this.domFormInput.className = classes.join(" ");
    }
  }

  updateOptions(options) {
    const newOptions = { ...FrameElement.options, ...options };

    validateElementOptions(
      this.iFrameFormElement.fieldType,
      FrameElement.options,
      newOptions
    );

    FrameElement.options = newOptions;

    if (options.styles) {
      // update styles
      this.injectInputStyles();
    }

    this.iFrameFormElement.setValidation(FrameElement.options.validation);
    this.iFrameFormElement.setReplacePattern(
      FrameElement.options.replacePattern
    );
    this.iFrameFormElement.setMask(FrameElement.options.mask);

    this.setupInputField(
      options.hasOwnProperty("value") &&
        options.value !== this.iFrameFormElement.getValue()
    );
  }
}
