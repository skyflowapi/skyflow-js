import Element from "./element";
import {
  ELEMENTS,
  FRAME_CONTROLLER,
  ELEMENT_EVENTS_TO_IFRAME,
  INPUT_DEFAULT_STYLES,
  CONTROLLER_STYLES,
  IFRAME_DEFAULT_STYLES,
} from "../constants";
import iframer, {
  setAttributes,
  getIframeSrc,
  setStyles,
} from "../../iframe-libs/iframer";
import bus from "framebus";
import uuid from "../../libs/uuid";
import deepClone from "../../libs/deepClone";
import { getStylesFromClass } from "../../libs/styles";

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
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    // on ready for client need to send the clint JSON
  }

  // create("ssn", {
  //   classes: {
  //     base: "", // default
  //     complete: "",
  //     empty: "",
  //     focus: "",
  //     invalid: "",
  //     webkitAutoFill: ""
  //   },
  //   style: {
  //     base: {}, // default
  //     complete: {},
  //     empty: {},
  //     invalid: {}
  //   },
  //   value: "",
  //   disabled: false,
  //   name: vault field name
  // })
  create = (elementType: string, options: any = {}) => {
    if (!ELEMENTS.hasOwnProperty(elementType)) {
      throw new Error("Provide valid element type");
      return;
    }

    options = deepClone(options);
    const classes = options.classes || {};
    const styles = options.styles || {};
    for (const classType in classes) {
      styles[classType] = {
        ...getStylesFromClass(classes[classType]),
        ...styles[classType],
      };
    }

    options.classes = classes;
    options.styles = styles;

    options.name = `${elementType}:${options.name || elementType}`;

    if (this.elements[options.name]) {
      return this.elements[options.name]; // todo: update if already exits?
    }

    const element = new Element(elementType, options, this.metaData);
    this.elements[options.name] = element;

    element.onDestroy((elementName) => {
      this.removeElement(elementName);
    });

    return element;
  };

  // todo: need to send single element
  getElement = (elementType: string) => {
    let elementsByType: Element[] = [];
    for (let element in this.elements) {
      if (element.split(":")[0] === elementType)
        elementsByType.push(this.elements[element]);
    }

    return elementsByType;
  };

  removeElement = (elementName: string) => {
    for (let element in this.elements) {
      if (element === elementName) delete this.elements[element];
    }
  };

  onSubmit = (event: Event) => {
    event.preventDefault();
    // event.submitter

    this.tokenize();
  };

  tokenize = () => {
    return new Promise((resolve, reject) => {
      bus
        // .target(getIframeSrc(this.metaData.uuid))
        .emit(ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST, {}, function (
          data: any
        ) {
          if (data.error) {
            console.log("Error while processing the form data");
            reject(data);
          } else {
            console.log("Here is the tokenized Data: ", data);
            resolve(data);
          }
        });
    });
  };
}

export default Elements;
