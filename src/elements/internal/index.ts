import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  INPUT_DEFAULT_STYLES,
  ELEMENTS,
  ALLOWED_STYLES,
  STYLE_TYPE,
} from "../constants";
import bus from "framebus";
import injectStylesheet from "inject-stylesheet";
import Client from "../../client";
import { IFrameForm, IFrameFormElement } from "./iFrameForm";
import { setAttributes, setStyles } from "../../iframe-libs/iframer";

export class FrameController {
  static controller?: FrameController;
  client?: Client;
  iFrameForm: IFrameForm;
  constructor() {
    this.iFrameForm = new IFrameForm();
  }
  static init(uuid: string) {
    // todo: on 2nd init need to reset all the forms and its elements(more like reset)
    this.controller = new FrameController();
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.READY_FOR_CLIENT, {}, (clientJSON) => {
      // todo: create client object from clientJSON
      // this.controller = new FrameController()
      // this.controller?.client = new Client()
      // send client object to IFrameForm
    });
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  static frameElement?: FrameElement; // factory class
  static options?: any;
  private iFrameFormElement?: IFrameFormElement;
  domForm?: HTMLFormElement;
  domFormInput?: HTMLInputElement; // todo: multiple inputs , need to write FrameElement(s) or similar

  // called by IFrameForm
  static init = (iFrameFormElement: IFrameFormElement) => {
    FrameElement.frameElement = new FrameElement(iFrameFormElement);
  };

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

  constructor(iFrameFormElement: IFrameFormElement) {
    this.iFrameFormElement = iFrameFormElement;

    if (FrameElement.options) {
      this.mount();
    }
  }

  // mount element onto dom
  mount = () => {
    this.injectInputStyles();
    this.iFrameFormElement?.resetEvents();
    const form = document.createElement("form");
    this.domForm = form;
    form.action = "#";
    form.onsubmit = (event) => {
      event.preventDefault();
    };

    const inputElement = document.createElement("input");
    this.domFormInput = inputElement;

    const attr = {
      ...ELEMENTS[this.iFrameFormElement?.fieldType || ""].attributes,
      name: this.iFrameFormElement?.fieldName,
      id: this.iFrameFormElement?.iFrameName,
    };
    // set input attributes
    // todo: default value
    inputElement.value = this.iFrameFormElement?.getValue() || "";

    setAttributes(inputElement, attr);

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
      this.updateInputStyleClass(state);
    });

    setStyles(form, INPUT_DEFAULT_STYLES);
    setStyles(inputElement, INPUT_DEFAULT_STYLES);
    setStyles(document.body, INPUT_DEFAULT_STYLES);

    form.append(inputElement);
    document.body.append(form);

    this.iFrameFormElement &&
      this.updateInputStyleClass(this.iFrameFormElement?.getStatus());
  };

  // todo: update the options and
  update = () => {};

  // events from HTML
  onFocusChange = (event: FocusEvent, focus: boolean) => {
    // emit event to iFrameFormElement
    // todo: change css of input on focus, blur
    this.iFrameFormElement?.onFocusChange(focus);
  };
  onInputChange = (event: Event) => {
    this.iFrameFormElement?.setValue((event.target as HTMLInputElement).value);
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
      if (styles[classType] && Object.keys(styles).length !== 0)
        stylesByClassName[".SkyflowElement--" + classType] = styles[classType];
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

    if (state.isFocused) {
      classes.push(STYLE_TYPE.FOCUS);
    }

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
}
