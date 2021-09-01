import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  REVEAL_ELEMENT_DEFAULT_STYLES,
} from "../../constants";
import { getCssClassesFromJss } from "../../../libs/jss-styles";

class RevealFrame {
  static revealFrame: RevealFrame;
  #elementContainer: HTMLDivElement;
  #dataElememt: HTMLSpanElement;
  #labelElement: HTMLSpanElement;
  #name: string;
  #record: any;
  #containerId: string;
  #styles!: object;

  static init() {
    bus
      .target(document.referrer.slice(0, -1))
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
    this.#elementContainer.className = "SkyflowElement--container";
    this.#labelElement = document.createElement("span");
    this.#labelElement.className = "SkyflowElement--label";
    this.#dataElememt = document.createElement("span");

    if (this.#record.label) {
      this.#labelElement.innerText = this.#record.label;
      this.#elementContainer.append(this.#labelElement);
    }
    this.#dataElememt.innerText = this.#record.id;
    getCssClassesFromJss(REVEAL_ELEMENT_DEFAULT_STYLES, "");
    this.#styles = this.#record.styles;
    const classes = getCssClassesFromJss(this.#styles, btoa(this.#record.id));

    Object.values(STYLE_TYPE).forEach((variant) => {
      if (classes[variant]) this.#dataElememt.classList.add(classes[variant]);
    });

    this.#elementContainer.appendChild(this.#dataElememt);
    document.body.append(this.#elementContainer);

    const sub = (data, _) => {
      if (data[this.#record.id]) {
        this.#dataElememt.innerText = data[this.#record.id] as string;
        bus
          .target(location.origin)
          .off(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
            sub
          );
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
