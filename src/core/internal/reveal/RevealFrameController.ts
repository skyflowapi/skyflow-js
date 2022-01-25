import bus from 'framebus';
import Client from '../../../client';
import {
  applyFormatRegex,
  fetchRecordsByTokenId,
  formatRecordsForClient,
  formatRecordsForIframe,
} from '../../../core-utils/reveal';
import properties from '../../../properties';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_FRAME_CONTROLLER,
} from '../../constants';
import { parameterizedString, printLog } from '../../../utils/logsHelper';
import logs from '../../../utils/logs';
import { Context, IRevealRecord, MessageType } from '../../../utils/common';

const CLASS_NAME = 'RevealFrameController';
class RevealFrameController {
  #client!: Client;

  #clientMetadata: any;

  #containerId: any;

  #clientDomain: string;

  #context!:Context;

  constructor(containerId) {
    this.#containerId = containerId;
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    bus
    // .target(this.#clientDomain)
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY + this.#containerId,
        {
          name: REVEAL_FRAME_CONTROLLER,
        },
        (clientMetaData: any) => {
          this.#context = clientMetaData.clientJSON.context;
          const clientJSON = clientMetaData.clientJSON;
          this.#clientMetadata = clientMetaData;
          this.#client = Client.fromJSON(clientJSON);
        },
      );
    const sub = (data, callback) => {
      printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST),
      MessageType.LOG, this.#context.logLevel);

      this.revealData(data.records as any).then(
        (resolvedResult) => {
          callback(resolvedResult);
        },
        (rejectedResult) => {
          callback({ error: rejectedResult });
        },
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
          let formattedResult = formatRecordsForIframe(resolvedResult);
          formattedResult = applyFormatRegex(formattedResult, revealRecords);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + this.#containerId,
              formattedResult,
            );
          const finalResponse = formatRecordsForClient(resolvedResult, formattedResult);
          if (finalResponse.errors) {
            reject(finalResponse);
          }
          resolve(finalResponse);
        },
        (rejectedResult) => {
          let formattedResult = formatRecordsForIframe(rejectedResult);
          formattedResult = applyFormatRegex(formattedResult, revealRecords);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + this.#containerId,
              formattedResult,
            );
          reject(formatRecordsForClient(rejectedResult, formattedResult));
        },
      );
    });
  }
}
export default RevealFrameController;
