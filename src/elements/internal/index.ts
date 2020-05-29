import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  INPUT_DEFAULT_STYLES,
  ELEMENTS,
} from "../constants";
import bus from "framebus";
import Client from "../../client";
import { IFrameForm, IFrameFormElement } from "./iFrameForm";
import { setStyles, setAttributes } from "../../iframe-libs/iframer";

export class FrameController {
  // all iframes will register here
  static controller?: FrameController;
  client?: Client;
  iFrameForm: IFrameForm;
  constructor() {
    this.iFrameForm = new IFrameForm();

    // todo: need to cent to server and tokenize the request
  }
  static init(uuid: string) {
    this.controller = new FrameController();
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.READY_FOR_CLIENT, {}, (clientJSON) => {
      // todo: create client object from clientJSON
      // this.controller = new FrameController()
      // this.controller?.client = new Client()
    });
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  static frameElement?: FrameElement; // factory class
  static options?: any;
  private iFrameFormElement?: IFrameFormElement;
  domForm?: HTMLFormElement;
  domFormInput?: HTMLInputElement; // todo: multiple inputs , need to write FrameElement(s)

  static init = (iFrameFormElement: IFrameFormElement) => {
    FrameElement.frameElement = new FrameElement(iFrameFormElement);
  };

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

  constructor(iFrameFormElement: IFrameFormElement) {
    this.iFrameFormElement = iFrameFormElement;

    if (FrameElement.options) {
      this.mount();
    }
  }

  // mount element onto dom
  mount = () => {
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
    inputElement.value = this.iFrameFormElement?.getValue() || "";

    setAttributes(inputElement, attr);

    // events and todo: onclick ...???
    inputElement.onfocus = (event) => {
      this.onFocusChange(event, true);
    };
    inputElement.onblur = (event) => {
      this.onFocusChange(event, false);
    };
    inputElement.onchange = (event) => {
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

    setStyles(form, INPUT_DEFAULT_STYLES);
    setStyles(inputElement, INPUT_DEFAULT_STYLES);
    setStyles(document.body, INPUT_DEFAULT_STYLES);

    form.append(inputElement);
    document.body.append(form);
  };

  // events from HTML
  onFocusChange = (event: FocusEvent, focus: boolean) => {
    // emit evevnt to iFrameFormElement
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
}
