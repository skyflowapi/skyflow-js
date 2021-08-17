import bus from "framebus";
import { RedactionType } from "../../Skyflow";
import iframer, {
  setAttributes,
  getIframeSrc,
  setStyles,
} from "../../iframe-libs/iframer";
import {
  REVEAL_FRAME_CONTROLLER,
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../constants";
import RevealElement from "./reveal/RevealElement";
import { properties } from "../../properties";

export interface IRevealElementInput {
  id: string;
  styles: object;
  label: string;
  redaction: RedactionType;
}

class RevealContainer {
  #revealRecords: IRevealElementInput[] = [];
  #revealElements: RevealElement[] = [];
  #mountedRecords: { id: string }[] = [];
  #metaData: any;
  constructor(metaData) {
    this.#metaData = metaData;
    const iframe = iframer({ name: REVEAL_FRAME_CONTROLLER });
    console.log("Reveal Container Intialized");
    setAttributes(iframe, {
      src: getIframeSrc(this.#metaData.uuid),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });

    const sub = (data, callback) => {
      if (data.name === REVEAL_FRAME_CONTROLLER) {
        callback({ ...metaData });
        // bus.off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
        bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
      }
    };
    bus
      // .target(properties.IFRAME_SECURE_ORGIN)
      // .on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub);
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);

    document.body.append(iframe);
    const getToken = (data, callback) => {
      metaData.clientJSON.config.getAccessToken().then((token) => {
        callback(token);
      });
    };

    bus.on(ELEMENT_EVENTS_TO_IFRAME.GET_ACCESS_TOKEN, getToken);

    bus.on("mounted", (data, _) => {
      console.log(data);
      this.#mountedRecords.push(data as any);
    });
  }

  create(record: IRevealElementInput) {
    this.validateRevealElementInput(record);
    this.#revealRecords.push(record);
    const revealElement = new RevealElement(record, this.#metaData);
    this.#revealElements.push(revealElement);
    return revealElement;
  }

  reveal() {
    // TODO : Add Data to All The Elements
    console.log(this.#revealRecords);
    console.log(this.#revealElements);
    console.log(window.location.origin);
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST, {
        records: this.#revealRecords,
      });

    // console.log(res);
  }
  private validateRevealElementInput(record: IRevealElementInput) {
    const recordId = record.id;
    if (!recordId || typeof recordId !== "string")
      throw new Error(`Invalid Token Id ${recordId}`);
    const recordRedaction = record.redaction;
    if (!Object.values(RedactionType).includes(recordRedaction))
      throw new Error(`Invalid Redaction Type ${recordRedaction}`);
  }
}
export default RevealContainer;
