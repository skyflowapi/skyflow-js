import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENTS,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../../constants";
import iframer, {
  setAttributes,
  getIframeSrc,
} from "../../../iframe-libs/iframer";
import EventEmitter from "../../../event-emitter";
import bus from "framebus";

class Element {
  elementType: string;
  name: string;
  metaData: any;
  options: any;
  iframe: HTMLIFrameElement;
  state = {
    isEmpty: true,
    isValid: false,
    isFocused: false,
    container: <HTMLFrameElement | null>null,
  };

  // isPotentiallyValid: true,
  // destructor
  // label focus

  eventEmitter: EventEmitter = new EventEmitter();

  constructor(elementType: string, options: any, metaData: any) {
    if (!ELEMENTS.hasOwnProperty(elementType)) {
      throw new Error("Provide valid element type");
      return;
    }
    this.metaData = metaData;
    this.options = { ...options };
    this.name = options.name;
    this.elementType = elementType;

    this.iframe = iframer({ ...options, name: this.name }); // todo: need to deep clone the object where  ever needed
  }

  mount = (domElement) => {
    if (this.state.container)
      throw new Error("Element mount can be called only 1 time");

    if (typeof domElement === "string")
      this.state.container = document.querySelector(domElement);
    else this.state.container = domElement;

    setAttributes(this.iframe, { src: getIframeSrc(this.metaData.uuid) });
    // update iframe with src and mount in container
    this.state.container?.appendChild(this.iframe);
    // add event listener on change/focus/blur on label and emit change event on iframe

    const sub = (data, callback) => {
      if (data.name === this.name) {
        callback(this.options);
        bus.off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
      }
    };
    bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
  };

  updateElement = (options) => {
    // update to read-only etc
  };

  // listening to element events on iframe
  // on destroy remove events
  on = (eventName: string, handler) => {};

  // methods to invoke element events
  blur = () => {};

  clear = () => {};

  destroy = () => {};

  focus = () => {};

  unmount = () => {};
}

export default Element;
