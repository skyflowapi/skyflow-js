import { ELEMENT_EVENTS_TO_IFRAME } from "../constants";
import bus from "framebus";
import Client from "../../client";
import { IFrameForm, FormElement } from "./IFrameForm";

export class FrameController {
  static controller?: FrameController;
  client?: Client;
  iFrameForm: IFrameForm;
  constructor() {
    this.iFrameForm = new IFrameForm();
  }
  static init(uuid: string) {
    this.controller = new FrameController();
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.READY_FOR_CLIENT, (clientJSON) => {
      // create client object from clientJSON
      // this.controller = new FrameController()
      // this.controller?.client = new Client()
    });
  }
}

export class FrameElement {
  static frameElement?: FrameElement;
  private formElement?: FormElement;
  static init(formElement: FormElement) {
    this.frameElement = new FrameElement(formElement);
  }

  constructor(formElement: FormElement) {
    this.formElement = formElement;
  }
  //mount an element

  // on focus or <input events> call iFrame event handlers
}
