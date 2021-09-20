import bus from "framebus";
import Client from "../../client";
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
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, (data, callback) => {
        callback({
          client: this.#client,
          bearerToken: this.#client.config.getBearerToken.toString(),
        });
        this.#isControllerFrameReady = true;
      });
  }

  _detokenize(records: IRevealRecord[]): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        bus.target(properties.IFRAME_SECURE_ORGIN).emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
          {
            type: PUREJS_TYPES.GET,
            records: records,
          },
          (revealData: any) => {
            if (revealData.error) reject(revealData.error);
            else resolve(revealData);
          }
        );
      });
    } else {
      return new Promise((resolve, reject) => {
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.GET,
                records: records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              }
            );
          });
      });
    }
  }
  _insert(records, options): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, _) => {
        bus.target(properties.IFRAME_SECURE_ORGIN).emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
          {
            type: PUREJS_TYPES.INSERT,
            records: records,
            options: options,
          },
          (insertedData) => {
            resolve(insertedData);
          }
        );
      });
    } else {
      return new Promise((resolve, _) => {
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.INSERT,
                records: records,
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
