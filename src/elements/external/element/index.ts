import { ELEMENT_EVENTS_TO_CLIENT, ELEMENTS } from "../../constants";
import iframer, {
  setAttributes,
  getIframeSrc,
} from "../../../iframe-libs/iframer";
import EventEmitter from "../../../event-emitter";

class Element {
  elementType: string;
  name: string;
  metaData: any;
  iframe: HTMLIFrameElement;
  state = {
    isEmpty: true,
    isValid: false,
    isFocused: false,
    container: <HTMLFrameElement | null>null,
  };

  //     isPotentiallyValid: true,
  // destructor
  // label focus

  eventEmitter: EventEmitter = new EventEmitter();

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
    if (this.state.container)
      throw new Error("Element mount can be called only 1 time");

    if (typeof domElement === "string")
      this.state.container = document.querySelector(domElement);
    else this.state.container = domElement;

    setAttributes(this.iframe, { src: getIframeSrc(this.metaData.uuid) });
    // update iframe with src and mount in container
    this.state.container?.appendChild(this.iframe);
    // add event listener on change/focus/blur on label and emit change event on iframe
  }

  updateElement(options) {
    // update to read-only etc
  }

  // listening to element events on iframe
  // on destroy remove events
  on(eventName: string, handler) {}

  // methods to invoke element events
  blur() {}

  clear() {}

  destroy() {}

  focus() {}

  unmount() {}
}

export default Element;
