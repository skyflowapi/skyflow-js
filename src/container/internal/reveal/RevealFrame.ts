import bus from "framebus";
import {
  ALLOWED_REVEAL_ELEMENT_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../../constants";
import injectStylesheet from "inject-stylesheet";

class RevealFrame {
  static revealFrame: RevealFrame;
  #domContainer: HTMLSpanElement;
  #name: string;
  #record: any;
  #containerId: string;

  static init() {
    bus.emit(
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
    this.#domContainer.className = "Skyflow-reveal";
    this.#domContainer.innerText = this.#record.id;
    injectStylesheet.injectWithAllowlist(
      {
        [".Skyflow-reveal"]: this.#record.styles.base,
      },
      ALLOWED_REVEAL_ELEMENT_STYLES
    );

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
