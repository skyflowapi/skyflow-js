import bus from "framebus";
import Client from "../../client";
import { fetchRecordsByTokenId } from "../../core/reveal";
import iframer, {
  getIframeSrc,
  setAttributes,
  setStyles,
} from "../../iframe-libs/iframer";
import uuid from "../../libs/uuid";
import { properties } from "../../properties";
import { IRevealRecord } from "../../Skyflow";
import {
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  PUREJS_FRAME_CONTROLLER,
  PUREJS_TYPES,
} from "../constants";
class PureJsController {
  #client: Client;
  #isControllerFrameReady: boolean = false;

  constructor(client) {
    this.#client = client;
    const iframe = iframer({
      name: `${PUREJS_FRAME_CONTROLLER}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(uuid()),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    bus.on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
      this.#isControllerFrameReady = true;
    });
    const getToken = (_, callback) => {
      this.#client.config.getBearerToken().then((token) => {
        callback(token);
      });
    };
    bus
      // .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_GET_ACCESS_TOKEN, getToken);
  }

  _get(records: IRevealRecord[]): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, _) => {
        bus.emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
          {
            type: PUREJS_TYPES.GET,
            records: records,
            client: this.#client,
          },
          (revealData) => {
            resolve(revealData);
          }
        );
      });
    } else {
      return new Promise((resolve, _) => {
        bus.on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
          bus.emit(
            ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
            {
              type: PUREJS_TYPES.GET,
              records: records,
              client: this.#client,
            },
            (revealData) => {
              resolve(revealData);
            }
          );
        });
      });
    }
  }
  _insert(records, options): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, _) => {
        bus.emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
          {
            type: PUREJS_TYPES.INSERT,
            records: records,
            client: this.#client,
            options: options,
          },
          (insertedData) => {
            resolve(insertedData);
          }
        );
      });
    } else {
      return new Promise((resolve, _) => {
        bus.on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
          bus.emit(
            ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
            {
              type: PUREJS_TYPES.INSERT,
              records: records,
              client: this.#client,
              options: options,
            },
            (insertedData) => {
              resolve(insertedData);
            }
          );
        });
      });
    }
  }
}
export default PureJsController;
