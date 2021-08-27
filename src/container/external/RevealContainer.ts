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
  ELEMENT_EVENTS_TO_CONTAINER,
} from "../constants";
import RevealElement from "./reveal/RevealElement";
import { properties } from "../../properties";
import uuid from "../../libs/uuid";
import EventEmitter from "../../event-emitter";

export interface IRevealElementInput {
  id: string;
  styles?: object;
  label?: string;
  redaction: RedactionType;
}

class RevealContainer {
  #revealRecords: IRevealElementInput[] = [];
  #mountedRecords: { id: string }[] = [];
  static hasAccessTokenListner: boolean = false;
  #metaData: any;
  #containerId: string;
  #eventEmmiter: EventEmitter;
  #isRevealCalled: boolean = false;
  #isElementsMounted: boolean = false;

  constructor(metaData) {
    this.#metaData = metaData;
    this.#containerId = uuid();
    this.#eventEmmiter = new EventEmitter();

    const iframe = iframer({
      name: `${REVEAL_FRAME_CONTROLLER}:${this.#containerId}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(this.#metaData.uuid),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });

    const sub = (data, callback) => {
      if (data.name === REVEAL_FRAME_CONTROLLER) {
        callback({ ...metaData });
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .off(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId,
            sub
          );
      }
    };
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId, sub);

    document.body.append(iframe);

    if (!RevealContainer.hasAccessTokenListner) {
      const getToken = (_, callback) => {
        metaData.clientJSON.config.getBearerToken().then((token) => {
          callback(token);
        });
      };
      bus
        .target(properties.IFRAME_SECURE_ORGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_GET_ACCESS_TOKEN, getToken);
      RevealContainer.hasAccessTokenListner = true;
    }
    bus
      .target(location.origin)
      .on(
        ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
        (data, _) => {
          this.#mountedRecords.push(data as any);

          this.#isElementsMounted =
            this.#mountedRecords.length === this.#revealRecords.length;

          if (this.#isRevealCalled && this.#isElementsMounted) {
            this.#eventEmmiter._emit(
              ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED +
                this.#containerId,
              {
                containerId: this.#containerId,
              }
            );
          }
        }
      );
  }

  create(record: IRevealElementInput) {
    if (!record.label) record.label = record.id;
    if (!record.styles) record.styles = {};
    this.validateRevealElementInput(record);
    this.#revealRecords.push(record);
    return new RevealElement(record, this.#metaData, this.#containerId);
  }

  reveal() {
    this.#isRevealCalled = true;
    if (this.#isElementsMounted) {
      return new Promise((resolve, _) => {
        bus.target(properties.IFRAME_SECURE_ORGIN).emit(
          ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId,
          {
            records: this.#revealRecords,
          },
          (data) => {
            this.#mountedRecords = [];
            this.#revealRecords = [];
            resolve(data);
          }
        );
      });
    } else {
      return new Promise((resolve, _) => {
        this.#eventEmmiter.on(
          ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
          () => {
            bus.target(properties.IFRAME_SECURE_ORGIN).emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId,
              {
                records: this.#revealRecords,
              },
              (apiData) => {
                this.#revealRecords = [];
                this.#mountedRecords = [];
                resolve(apiData);
              }
            );
          }
        );
      });
    }
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
