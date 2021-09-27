import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  REVEAL_ELEMENT_ERROR_TEXT,
  REVEAL_ELEMENT_LABEL_DEFAULT_STYLES,
  REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
  REVEAL_ELEMENT_DIV_STYLE,
} from "../../constants";
import { getCssClassesFromJss } from "../../../libs/jss-styles";

class RevealFrame {
  static revealFrame: RevealFrame;
  #elementContainer: HTMLDivElement;
  #dataElememt: HTMLSpanElement;
  #labelElement: HTMLSpanElement;
  #errorElement: HTMLSpanElement;
  #name: string;
  #record: any;
  #containerId: string;
  #inputStyles!: object;
  #labelStyles!: object;
  #errorTextStyles!: object;

  static init() {
    bus
      // .target(document.referrer.split("/").slice(0, 3).join("/"))
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY,
        { name: window.name },
        (data: any) => {
          RevealFrame.revealFrame = new RevealFrame(data.record);
        }
      );
  }

  constructor(record) {
    this.#name = window.name;
    this.#containerId = this.#name.split(":")[2];
    this.#record = record;

    this.#elementContainer = document.createElement("div");
    this.#elementContainer.className = "SkyflowElement-div-container";
    getCssClassesFromJss(REVEAL_ELEMENT_DIV_STYLE, "div");

    this.#labelElement = document.createElement("span");
    this.#labelElement.className = `SkyflowElement-label-${STYLE_TYPE.BASE}`;

    this.#dataElememt = document.createElement("span");
    this.#dataElememt.className = `SkyflowElement-content-${STYLE_TYPE.BASE}`;

    this.#errorElement = document.createElement("span");
    this.#errorElement.className = `SkyflowElement-error-${STYLE_TYPE.BASE}`;

    if (this.#record.hasOwnProperty("label")) {
      this.#labelElement.innerText = this.#record.label;
      this.#elementContainer.append(this.#labelElement);

      if (this.#record.hasOwnProperty("labelStyles")) {
        this.#labelStyles = this.#record.labelStyles;
        this.#labelStyles[STYLE_TYPE.BASE] = {
          ...REVEAL_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.BASE],
          ...this.#labelStyles[STYLE_TYPE.BASE],
        };
        getCssClassesFromJss(this.#labelStyles, "label");
      } else {
        getCssClassesFromJss(REVEAL_ELEMENT_LABEL_DEFAULT_STYLES, "label");
      }
    }

    if (this.#record.hasOwnProperty("altText"))
      this.#dataElememt.innerText = this.#record.altText;
    else this.#dataElememt.innerText = this.#record.token;

    if (this.#record.hasOwnProperty("inputStyles")) {
      this.#inputStyles = this.#record.inputStyles;
      getCssClassesFromJss(this.#inputStyles, "content");
    }

    this.#elementContainer.appendChild(this.#dataElememt);

    document.body.append(this.#elementContainer);

    const sub = (data, _) => {
      if (data.hasOwnProperty(this.#record.token)) {
        this.#dataElememt.innerText = data[this.#record.token] as string;
        bus
          .target(location.origin)
          .off(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
            sub
          );
      } else {
        this.#errorElement.innerText = REVEAL_ELEMENT_ERROR_TEXT;
        if (
          this.#record.hasOwnProperty("errorTextStyles") &&
          this.#record.errorTextStyles.hasOwnProperty(STYLE_TYPE.BASE)
        ) {
          this.#errorTextStyles = this.#record.errorTextStyles;
          this.#errorTextStyles[STYLE_TYPE.BASE] = {
            ...REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES[STYLE_TYPE.BASE],
            ...this.#errorTextStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(this.#errorTextStyles, "error");
        } else {
          getCssClassesFromJss(
            REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
            "error"
          );
        }
        this.#elementContainer.appendChild(this.#errorElement);
      }
    };

    bus
      .target(location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
        sub
      );
  }
}

export default RevealFrame;
