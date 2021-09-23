import bus from "framebus";
import Client from "../../../client";
import {
  fetchRecordsByTokenId,
  formatRecordsForClient,
  formatRecordsForIframe,
} from "../../../core/reveal";
import { IRevealRecord } from "../../../Skyflow";
import { isTokenValid } from "../../../utils/jwtUtils";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_FRAME_CONTROLLER,
} from "../../constants";
import { properties } from "../../../properties";

class RevealFrameController {
  #client!: Client;
  #clientMetadata: any;
  #containerId: any;
  #clientDomain: string;

  constructor(containerId) {
    this.#containerId = containerId;
    this.#clientDomain = document.referrer.split("/").slice(0, 3).join("/");
    bus
    // .target(this.#clientDomain)
    .emit(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId,
      {
        name: REVEAL_FRAME_CONTROLLER,
      },
      (clientMetaData: any) => {
        clientMetaData = {
          ...clientMetaData,
          clientJSON: {
            ...clientMetaData.clientJSON,
            config: {
              ...clientMetaData.clientJSON.config,
              getBearerToken: new Function(
                "return " + clientMetaData.clientJSON.config.getBearerToken
              )(),
            },
          },
        };
        const clientJSON = clientMetaData.clientJSON;
        this.#clientMetadata = clientMetaData;
        this.#client = Client.fromJSON(clientJSON);
      }
    );
    const sub = (data, callback) => {
      this.revealData(data["records"] as any).then(
        (resolvedResult) => {
          callback(resolvedResult);
        },
        (rejectedResult) => {
          callback({ error: rejectedResult });
        }
      );
      bus
        .target(this.#clientDomain)
        .off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId, sub);
    };

    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId, sub);
  }

  static init(containerId: string) {
    return new RevealFrameController(containerId);
  }

  revealData(revealRecords: IRevealRecord[]) {
    return new Promise((resolve, reject) => {
      fetchRecordsByTokenId(revealRecords, this.#client).then(
        (resolvedResult) => {
          const formattedResult = formatRecordsForIframe(resolvedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY +
                this.#containerId,
              formattedResult
            );
          resolve(formatRecordsForClient(resolvedResult));
        },
        (rejectedResult) => {
          const formattedResult = formatRecordsForIframe(rejectedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY +
                this.#containerId,
              formattedResult
            );
          reject(formatRecordsForClient(rejectedResult));
        }
      );
    });
  }
}
export default RevealFrameController;
