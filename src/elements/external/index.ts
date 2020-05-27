import Element from "./element";
import { ELEMENTS } from "../constants";
import iframer, { setAttributes } from "../../iframe-libs/iframer";
import globals from "../../constants";
// import bus from "framebus";

class Elements {
  elements: Record<string, Element> = {};
  count: number = 0;
  metaData: any;
  // bus class to teardown on destroy
  // destructor to remove events on destroy
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
    const iframe = iframer({ name: "controller" });
    setAttributes(iframe, {
      src: globals.IFRAME_SECURE_SITE + "/#" + metaData.uuid,
    });
    document.body.append(iframe);
    // on ready for client need to send the clint JSON
  }

  create(elementType: string, options: any = {}) {
    if (!(elementType in Object.keys(ELEMENTS))) {
      throw new Error("Provide valid element type");
      return;
    }
    options.name = `${elementType}:${++this.count}`;
    const element = new Element(elementType, options, this.metaData);
    if (element.name) this.elements[element.name] = element;
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
