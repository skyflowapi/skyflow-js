import bus from "framebus";
import Client from "../../../client";
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from "../../../core/collect";
import { fetchRecordsByTokenId } from "../../../core/reveal";
import { IRevealRecord } from "../../../Skyflow";
import { ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES } from "../../constants";

class PureJsFrameController {
  #clientDomain: string;
  #client!: Client;
  constructor() {
    this.#clientDomain = document.referrer.slice(0, -1);
    bus.on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST, (data, callback) => {
      this.#client = Client.fromJSON(data.client) as any;
      if (data.type === PUREJS_TYPES.GET) {
        bus.emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_GET_ACCESS_TOKEN,
          {},
          (accessToken) => {
            this.#client.accessToken = accessToken as string;
            fetchRecordsByTokenId(data.records as IRevealRecord[], this.#client)
              .then((result) => {
                callback(result);
              })
              .catch((error) => {
                console.log(error);
              });
          }
        );
      } else if (data.type === PUREJS_TYPES.INSERT) {
        bus.emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_GET_ACCESS_TOKEN,
          {},
          (accessToken) => {
            this.#client.accessToken = accessToken as string;
            this.insertData(data.records, data.options)
              .then((result) => {
                callback(result);
              })
              .catch((error) => {
                console.log(error);
              });
          }
        );
      }
    });
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
  }

  static init() {
    return new PureJsFrameController();
  }

  insertData(records, options) {
    const requestBody = constructInsertRecordRequest(records, options);
    return new Promise((resolve, reject) => {
      this.#client
        .request({
          body: { records: requestBody },
          requestMethod: "POST",
          url:
            this.#client.config.vaultURL +
            "/v1/vaults/" +
            this.#client.config.vaultID,
        })
        .then((response: any) => {
          resolve(
            constructInsertRecordResponse(
              response,
              options.tokens,
              records.records
            )
          );
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
export default PureJsFrameController;
