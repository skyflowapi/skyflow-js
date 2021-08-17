import bus from "framebus";
import Client from "../../../client";
import {
  fetchRecordsByTokenId,
  formatRecordsForIframe,
} from "../../../core/reveal";
import { IRevealRecord } from "../../../Skyflow";
import { isTokenValid } from "../../../utils/jwtUtils";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  COLLECT_FRAME_CONTROLLER,
  REVEAL_FRAME_CONTROLLER,
} from "../../constants";
import NewBus from "../../../libs/NewBus";
import { properties } from "../../../properties";

class RevealFrameController {
  // @ts-ignore: will intialize in emit callback
  #client: Client;
  #NewBus: NewBus = new NewBus();
  #clientMetadata: any;

  constructor() {
    bus.emit(
      // ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY,
      { name: REVEAL_FRAME_CONTROLLER },
      (clientMetaData: any) => {
        console.log(clientMetaData);
        const clientJSON = clientMetaData.clientJSON;
        this.#clientMetadata = clientMetaData;
        // this.#client.setClient(Client.fromJSON(clientJSON));
        // delete clientMetaData.clientJSON;
        this.#client = Client.fromJSON(clientJSON);
        console.log(this.#client);
      }
    );

    bus
      // .target(location.origin)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST, (data, callback) => {
        console.log(data);
        // callback(data);
        console.log(data["records"]);
        this.revealData(data["records"] as any);
      });
    console.log("controller done");
  }

  static init() {
    return new RevealFrameController();
  }

  revealData(data: IRevealRecord[]) {
    console.log("called", data);
    if (
      this.#client &&
      this.#client.accessToken &&
      isTokenValid(this.#client.accessToken)
    ) {
      fetchRecordsByTokenId(data, this.#client).then((result) => {
        const formattedResult = formatRecordsForIframe(result);
        // this.#NewBus.emit(
        bus
          .target(location.origin)
          .emit(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY,
            formattedResult
          );
      });
    } else {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_ACCESS_TOKEN, {}, (accessToken) => {
        this.#client.accessToken = accessToken as any;
        fetchRecordsByTokenId(data, this.#client).then((result) => {
          const formattedResult = formatRecordsForIframe(result);
          console.log(result);
          bus
            .target(location.origin)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY,
              formattedResult
            );
        });
      });
    }
  }
}
export default RevealFrameController;
