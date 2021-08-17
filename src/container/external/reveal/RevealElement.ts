import EventEmitter from "../../../event-emitter";
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_REVEAL,
} from "../../constants";
import IFrame from "../../external/element/IFrame";
import { IRevealElementInput } from "../RevealContainer";

class RevealElement {
  #iframe: IFrame;
  #eventEmitter: EventEmitter = new EventEmitter();
  #metaData: any;
  #recordData: any;
  constructor(record: IRevealElementInput, metaData: any) {
    this.#metaData = metaData;
    this.#recordData = record;
    this.#iframe = new IFrame(`${FRAME_REVEAL}:${record.label}`, { metaData });
  }
  mount(domElementSelector) {
    // TODO: Mount on client HTML
    console.log("Mount Method", domElementSelector);
    this.#iframe.mount(domElementSelector);
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        callback({ ...this.#metaData, record: this.#recordData });
        // this.#eventEmitter._emit(ELEMENT_EVENTS_TO_CLIENT.READY);
        // bus.off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
        bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);

        bus.emit("mounted", { id: this.#recordData.id });
      }
    };
    // bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
    bus.on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
  }
}

export default RevealElement;
