import bus from "framebus";
import iframer, {
  setAttributes,
  getIframeSrc,
  setStyles,
} from "../../iframe-libs/iframer";
import deepClone from "../../libs/deepClone";
import {
  COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  FRAME_ELEMENT,
} from "../constants";
import Element from "./element";

interface CollectElementInput {
  table: string;
  column: string;
  styles: any;
  label: string;
  placeholder: string;
  type: string;
}

class CollectContainer {
  #elements: Record<string, Element> = {};
  #metaData: any;
  constructor(options, metaData) {
    this.#metaData = metaData;
    const iframe = iframer({ name: COLLECT_FRAME_CONTROLLER });
    setAttributes(iframe, {
      src: getIframeSrc(this.#metaData.uuid),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });

    const sub = (data, callback) => {
      if (data.name === COLLECT_FRAME_CONTROLLER) {
        callback({ ...metaData });
        bus.off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
      }
    };
    bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);

    const getToken = (data, callback) => {
      metaData.clientJSON.config.getAccessToken().then((token) => {
        callback(token);
      });
    };

    bus.on(ELEMENT_EVENTS_TO_IFRAME.GET_ACCESS_TOKEN, getToken);

    document.body.append(iframe);
  }

  create = (input: CollectElementInput, options: any = { required: false }) => {
    const elementGroup = {
      rows: [
        {
          elements: [
            {
              elementType: input.type,
              name: input.column,
              ...input,
              ...options,
            },
          ],
        },
      ],
    };
    return this.#createMultipleElement(elementGroup, true);
  };

  #createMultipleElement = (
    multipleElements: any,
    isSingleElementAPI: boolean = false
  ) => {
    let elements: any[] = [];
    multipleElements = deepClone(multipleElements);
    multipleElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const elementType = options.elementType;

        options.sensitive =
          options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern =
          options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        options.elementName = options.table + "." + options.name;
        options.elementName = `${options.elementType}:${btoa(
          options.elementName
        )}`;

        if (
          options.elementType === ELEMENTS.radio.name ||
          options.elementType === ELEMENTS.checkbox.name
        ) {
          options.elementName = `${options.elementName}:${btoa(options.value)}`;
        }

        options.elementName = `${FRAME_ELEMENT}:${options.elementName}`;

        elements.push(options);
      });
    });

    multipleElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_ELEMENT}:group:${btoa(multipleElements.name)}`;

    if (
      isSingleElementAPI &&
      !this.#elements[elements[0].elementName] &&
      this.#hasElementName(elements[0].name)
    ) {
      throw new Error("The element name has to unique: " + elements[0].name);
    }

    let element = this.#elements[multipleElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.update(elements[0]);
      } else {
        element.update(multipleElements);
      }
    } else {
      element = new Element(
        multipleElements,
        this.#metaData,
        isSingleElementAPI,
        this.#destroyCallback,
        this.#updateCallback
      );
      this.#elements[multipleElements.elementName] = element;
    }

    if (!isSingleElementAPI) {
      elements.forEach((element) => {
        const name = element.elementName;
        if (!this.#elements[name]) {
          this.#elements[name] = this.create(element.elementType, element);
        } else {
          this.#elements[name].update(element);
        }
      });
    }

    return element;
  };

  #removeElement = (elementName: string) => {
    for (let element in this.#elements) {
      if (element === elementName) delete this.#elements[element];
    }
  };

  #destroyCallback = (elementNames: string[]) => {
    elementNames.forEach((elementName) => {
      this.#removeElement(elementName);
    });
  };

  #updateCallback = (elements: any[]) => {
    elements.forEach((element) => {
      if (this.#elements[element.elementName]) {
        this.#elements[element.elementName].update(element);
      }
    });
  };

  #hasElementName = (name: string) => {
    Object.keys(this.#elements).forEach((elementName) => {
      if (atob(elementName.split(":")[2]) === name) {
        return true;
      }
    });

    return false;
  };

  collect = (options: any = { tokens: true }) => {
    return new Promise((resolve, reject) => {
      bus
        // .target(getIframeSrc(this.metaData.uuid))
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST,
          options,
          function (data: any) {
            if (data.error) {
              reject(data);
            } else {
              resolve(data);
            }
          }
        );
    });
  };
}

export default CollectContainer;
