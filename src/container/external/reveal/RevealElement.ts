import bus from "framebus";
import { properties } from "../../../properties";
import {
  ELEMENT_EVENTS_TO_CONTAINER,
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_REVEAL,
} from "../../constants";
import IFrame from "../../external/element/IFrame";
import { IRevealElementInput } from "../RevealContainer";

class RevealElement {
  #iframe: IFrame;
  #metaData: any;
  #recordData: any;
  #containerId: string;

  constructor(record: IRevealElementInput, metaData: any, containerId: string) {
    this.#metaData = metaData;
    this.#recordData = record;
    this.#containerId = containerId;
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(record.id)}`,
      { metaData },
      this.#containerId
    );
  }
  mount(domElementSelector) {
    this.#iframe.mount(domElementSelector);
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        callback({
          ...this.#metaData,
          record: this.#recordData,
        });

        bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);

        bus
          .target(location.origin)
          .emit(
            ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
            {
              id: this.#recordData.id,
              containerId: this.#containerId,
            }
          );
      }
    };
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
  }
}

export default RevealElement;
