import bus from "framebus";
import { ELEMENT_EVENTS_TO_IFRAME, STYLE_TYPE } from "../../constants";
import { getCssClassesFromJss } from "../../../libs/jss-styles";

class RevealFrame {
  static revealFrame: RevealFrame;
  #domContainer: HTMLSpanElement;
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
    this.#domContainer = document.createElement("span");
    this.#domContainer.innerText = this.#record.id;
    this.#styles = this.#record.styles;

    const classes = getCssClassesFromJss(
      this.#styles,
      btoa(this.#record.label)
    );
    Object.values(STYLE_TYPE).forEach((variant) => {
      if (classes[variant]) this.#domContainer.classList.add(classes[variant]);
    });
    document.body.append(this.#domContainer);

    const sub = (data, _) => {
      if (data[this.#record.id]) {
        this.#domContainer.innerText = data[this.#record.id] as string;
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
