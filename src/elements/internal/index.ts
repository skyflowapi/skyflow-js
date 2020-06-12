import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  INPUT_DEFAULT_STYLES,
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
      (clientMetaData) => {
        this.iFrameForm.setClientMetadata(clientMetaData);
      }
    );
  }
  static init(uuid: string) {
    // todo: on 2nd init need to reset all the forms and its elements(more like reset)
    this.controller = new FrameController();
    // bus.emit(ELEMENT_EVENTS_TO_IFRAME.READY_FOR_CLIENT, {}, (clientJSON) => {
    // todo: create client object from clientJSON
    // this.controller = new FrameController()
    // this.controller?.client = new Client()
    // send client object to IFrameForm
    // });
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  static frameElement?: FrameElement; // factory class
  static options?: any;
  private iFrameFormElement: IFrameFormElement;
  domForm?: HTMLFormElement;
  domFormInput?: HTMLInputElement | HTMLSelectElement; // todo: multiple inputs , need to write FrameElement(s) or similar

  // called on iframe loaded im html file
  static start = () => {
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      { name: window.name },
      (options) => {
        FrameElement.options = options;
        if (FrameElement.frameElement) {
          // todo: call update
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
        : "input"
    );

    this.domFormInput = inputElement;

    // this.setupInputField();
    this.updateOptions(FrameElement.options);

    // events and todo: onclick ...???
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
      }
      this.updateInputStyleClass(state);
    });
    this.iFrameFormElement?.on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
      if (data.options) {
        this.updateOptions(data.options);
      }
    });

    setStyles(form, INPUT_DEFAULT_STYLES);
    setStyles(inputElement, INPUT_DEFAULT_STYLES);
    setStyles(document.body, INPUT_DEFAULT_STYLES);

    form.append(inputElement);
    document.body.append(form);

    this.iFrameFormElement &&
      this.updateInputStyleClass(this.iFrameFormElement?.getStatus());
  };

  setupInputField(newValue: boolean = false) {
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
      ...(FrameElement.options.validation?.includes("required") && {
        required: "",
      }),
    };

    this.iFrameFormElement.setValidation(FrameElement.options.validation);
    // todo: what about 'select' multiple fields selection?
    if (
      this.domFormInput &&
      this.iFrameFormElement?.fieldType === ELEMENTS.dropdown.name
    ) {
      // <select id="pet-select" value="" name="name">
      //   <option value="goldfish">Goldfish</option>
      // </select>
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

    // todo: validity on default value, HTML don't support validity on radio
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
    }
  };

  // events from HTML
  onFocusChange = (event: FocusEvent, focus: boolean) => {
    // emit event to iFrameFormElement
    // todo: change css of input on focus, blur
    this.iFrameFormElement?.onFocusChange(focus);
  };

  onInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.iFrameFormElement?.setValue(target.value, target.checkValidity());
  };

  focusChange = (focus: boolean) => {
    // todo: change css of input on focus, blur
    if (focus) this.domFormInput?.focus();
    else this.domFormInput?.blur();
  };

  destroy = () => {};

  injectInputStyles() {
    const styles = FrameElement.options.styles;

    // todo: inject default styles in html files
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

    this.setupInputField(
      options.hasOwnProperty("value") &&
        options.value !== this.iFrameFormElement.getValue()
    );
  }
}
