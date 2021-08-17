import bus from "framebus";
import {
  ALLOWED_REVEAL_ELEMENT_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../../../constants";
import "jquery-mask-plugin/dist/jquery.mask.min";
import NewBus from "../../../../libs/NewBus";
import injectStylesheet from "inject-stylesheet";

export default class RevealFrame {
  static revealFrame: RevealFrame;
  #container: HTMLSpanElement;
  #name: string;
  #record: any;
  #newBus: NewBus = new NewBus();

  static init() {
    bus.target("http://localhost:3044").emit(
      // ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY,
      { name: window.name },
      (data: any) => {
        // console.log(data);
        RevealFrame.revealFrame = new RevealFrame(data.record);
      }
    );
  }

  constructor(record) {
    this.#name = window.name;
    this.#record = record;
    console.log("Record=>", this.#record.styles);
    console.log("enterd here");

    this.#container = document.createElement("span");
    this.#container.className = "Skyflow-reveal";
    this.#container.innerText = this.#record.id;
    injectStylesheet.injectWithAllowlist(
      {
        [".Skyflow-reveal"]: this.#record.styles.base,
      },
      ALLOWED_REVEAL_ELEMENT_STYLES
    );

    console.log(this.#container);
    document.body.append(this.#container);
    console.log(window.location.origin);

    // this.#newBus
    // bus
    //   .target(location.origin)
    //   .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY, (data, _) => {
    //     console.log(data);
    //     // this.#record.id = data[this.#record.id];
    //     if (data[this.#record.id])
    //       this.#container.innerText = data[this.#record.id] as string;
    //   });
    const sub = (data, _) => {
      console.log(data);
      if (data[this.#record.id])
        this.#container.innerText = data[this.#record.id] as string;
      bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY, sub);
    };

    bus
      .target(location.origin)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY, sub);
  }
}
