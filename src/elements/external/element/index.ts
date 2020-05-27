import { ELEMENT_EVENTS_TO_CLIENT, ELEMENTS } from "../../constants";
import iframer from "../../../iframe-libs/iframer";

class Element {
  elementType: string;
  name: string;
  metaData: any;
  iframe: HTMLIFrameElement;
  // state -> empty/valid/invalid/
  //     isEmpty: true,
  //     isValid: false,
  //     isPotentiallyValid: true,
  //     isFocused: false,
  //     container: container
  // destructor
  // label focus

  constructor(elementType: string, options: any, metaData: any) {
    if (!(elementType in Object.keys(ELEMENTS))) {
      throw new Error("Provide valid element type");
      return;
    }
    this.metaData = metaData;
    this.name = options.name;
    this.elementType = elementType;

    this.iframe = iframer({ ...options, name: this.name }); // todo: need to deep clone the object where  ever needed
  }

  mount(domElement) {
    // add event listener on change/focus/blur on label and emit change event on iframe
  }

  // listening to element events on iframe
  // on destroy remove events
  on(eventName: string, handler) {}

  // methods to invoke element events
  blur() {}

  clear() {}

  destroy() {}

  focus() {}
}

export default Element;
