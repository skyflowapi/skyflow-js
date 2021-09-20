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
  token: string;
  redaction: RedactionType;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}

class RevealContainer {
  #revealRecords: IRevealElementInput[] = [];
  #mountedRecords: { id: string }[] = [];

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
        callback({
          ...metaData,
          clientJSON: {
            ...metaData.clientJSON,
            config: {
              ...metaData.clientJSON.config,
              getBearerToken:
                metaData.clientJSON.config.getBearerToken.toString(),
            },
          },
        });
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
    this.validateRevealElementInput(record);
    this.#revealRecords.push(record);
    return new RevealElement(record, this.#metaData, this.#containerId);
  }

  reveal() {
    this.#isRevealCalled = true;
    if (this.#isElementsMounted) {
      return new Promise((resolve, reject) => {
        bus.target(properties.IFRAME_SECURE_ORGIN).emit(
          ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId,
          {
            records: this.#revealRecords,
          },
          (revealData: any) => {
            this.#mountedRecords = [];
            this.#revealRecords = [];
            if (revealData.error) reject(revealData.error);
            else resolve(revealData);
          }
        );
      });
    } else {
      return new Promise((resolve, reject) => {
        this.#eventEmmiter.on(
          ELEMENT_EVENTS_TO_CONTAINER.ALL_ELEMENTS_MOUNTED + this.#containerId,
          () => {
            bus.target(properties.IFRAME_SECURE_ORGIN).emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId,
              {
                records: this.#revealRecords,
              },
              (revealData: any) => {
                this.#revealRecords = [];
                this.#mountedRecords = [];
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              }
            );
          }
        );
      });
    }
  }

  private validateRevealElementInput(record: IRevealElementInput) {
    const recordToken = record.token;
    if (!recordToken || typeof recordToken !== "string")
      throw new Error(`Invalid Token Id ${recordToken}`);

    const recordRedaction = record.redaction;
    if (!Object.values(RedactionType).includes(recordRedaction))
      throw new Error(`Invalid Redaction Type ${recordRedaction}`);

    if (record.hasOwnProperty("label") && typeof record.label !== "string")
      throw new Error(`Invalid Record Label Type`);

    if (record.hasOwnProperty("altText") && typeof record.altText !== "string")
      throw new Error(`Invalid Record altText Type`);
  }
}
export default RevealContainer;
