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
  static client: Client;
  #clientMetadata: any;
  #containerId: any;

  constructor(containerId) {
    this.#containerId = containerId;
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY,
      {
        name: REVEAL_FRAME_CONTROLLER,
      },
      (clientMetaData: any) => {
        const clientJSON = clientMetaData.clientJSON;
        this.#clientMetadata = clientMetaData;
        RevealFrameController.client = Client.fromJSON(clientJSON);
      }
    );
    const sub = (data, callback) => {
      this.revealData(data["records"] as any).then((res) => {
        callback(res);
      });
      bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId, sub);
    };

    bus.on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId, sub);
  }

  static init(containerId: string) {
    return new RevealFrameController(containerId);
  }

  revealData(revealRecords: IRevealRecord[]) {
    return new Promise((resolve, _) => {
      if (
        RevealFrameController.client &&
        RevealFrameController.client.accessToken &&
        isTokenValid(RevealFrameController.client.accessToken)
      ) {
        fetchRecordsByTokenId(revealRecords, RevealFrameController.client).then(
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
      } else {
        bus
          .target(this.#clientMetadata.clientDomain)
          .emit(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_GET_ACCESS_TOKEN,
            {},
            (accessToken: any) => {
              RevealFrameController.client.accessToken = accessToken as string;
              fetchRecordsByTokenId(
                revealRecords,
                RevealFrameController.client
              ).then((result) => {
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
            }
          );
      }
    });
  }
}
export default RevealFrameController;
