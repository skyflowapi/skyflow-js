import Element from "./element";
import { ELEMENTS, FRAME_CONTROLLER } from "../constants";
import iframer, {
  setAttributes,
  getIframeSrc,
} from "../../iframe-libs/iframer";
import bus from "framebus";

class Elements {
  elements: Record<string, Element> = {};
  count: number = 0;
  metaData: any;
  // bus class to store all listeners and teardown on destroy
  // destructor to remove events(non bus events - with the event emitter) on destroy
  constructor(
    {
      fonts = {} /* todo: font object */,
      locale = "en" /* need to be auto from browser */,
    },
    metaData
  ) {
    // todo: scan for any iframe
    if (!metaData.uuid) {
      throw new Error("SSN not provided");
      return;
    }
    this.metaData = metaData;
    const iframe = iframer({ name: FRAME_CONTROLLER });
    setAttributes(iframe, {
      src: getIframeSrc(this.metaData.uuid),
    });
    document.body.append(iframe);
    // on ready for client need to send the clint JSON
  }

  create(elementType: string, options: any = {}) {
    if (!(elementType in Object.keys(ELEMENTS))) {
      throw new Error("Provide valid element type");
      return;
    }
    options.name = `${elementType}:${options.name || ++this.count}`;
    if (this.elements[options.name]) {
      return this.elements[options.name];
    }
    const element = new Element(elementType, options, this.metaData);
    // element.on destroy remove element

    return element;
  }

  getElement(elementType: string) {
    let elementsByType: Element[] = [];
    for (let element in this.elements) {
      if (element.split(":")[0] === elementType)
        elementsByType.push(this.elements[element]);
    }

    return elementsByType;
  }
}

export default Elements;
