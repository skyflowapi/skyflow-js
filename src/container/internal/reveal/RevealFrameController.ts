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
    this.#clientDomain = document.referrer.slice(0, -1);
    bus.target(this.#clientDomain).emit(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId,
      {
        name: REVEAL_FRAME_CONTROLLER,
      },
      (clientMetaData: any) => {
        const clientJSON = clientMetaData.clientJSON;
        this.#clientMetadata = clientMetaData;
        this.#client = Client.fromJSON(clientJSON);
      }
    );
    const sub = (data, callback) => {
      this.revealData(data["records"] as any).then((res) => {
        callback(res);
      });
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
    return new Promise((resolve, _) => {
      if (
        this.#client &&
        this.#client.accessToken &&
        isTokenValid(this.#client.accessToken)
      ) {
        fetchRecordsByTokenId(revealRecords, this.#client).then((result) => {
          const formattedResult = formatRecordsForIframe(result);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY +
                this.#containerId,
              formattedResult
            );
          resolve(formatRecordsForClient(result));
        });
      } else {
        bus
          .target(this.#clientDomain)
          .emit(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_GET_ACCESS_TOKEN,
            {},
            (accessToken: any) => {
              this.#client.accessToken = accessToken as string;
              fetchRecordsByTokenId(revealRecords, this.#client).then(
                (result) => {
                  const formattedResult = formatRecordsForIframe(result);
                  bus
                    .target(properties.IFRAME_SECURE_SITE)
                    .emit(
                      ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY +
                        this.#containerId,
                      formattedResult
                    );
                  resolve(formatRecordsForClient(result));
                }
              );
            }
          );
      }
    });
  }
}
export default RevealFrameController;
