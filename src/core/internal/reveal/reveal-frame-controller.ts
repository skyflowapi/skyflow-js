/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import Client from '../../../client';
import {
  fetchRecordsByTokenId,
  formatForRenderClient,
  formatRecordsForClient,
  formatRecordsForIframe,
  formatRecordsForRender,
  getFileURLFromVaultBySkyflowID,
} from '../../../core-utils/reveal';
import properties from '../../../properties';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_FRAME_CONTROLLER,
} from '../../constants';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import logs from '../../../utils/logs';
import {
  Context, IRevealRecord, MessageType,
} from '../../../utils/common';

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
      // bus
      //   .target(this.#clientDomain)
      //   .off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId, sub);
    };

    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST + this.#containerId, sub);

    const sub2 = (data, callback) => {
      printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
      MessageType.LOG, this.#context.logLevel);
      this.renderFile(data.records).then(
        (resolvedResult) => {
          callback(
            resolvedResult,
          );
        },
        (rejectedResult) => {
          callback({ errors: rejectedResult });
        },
      );
    };
    bus
      // .target(window.location.origin)
      .on(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + this.#containerId, sub2);
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
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + this.#containerId,
              formattedResult,
            );
          resolve(formatRecordsForClient(resolvedResult));
        },
        (rejectedResult) => {
          const formattedResult = formatRecordsForIframe(rejectedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + this.#containerId,
              formattedResult,
            );
          reject(formatRecordsForClient(rejectedResult));
        },
      );
    });
  }

  renderFile(data: IRevealRecord) {
    return new Promise((resolve, reject) => {
      try {
        getFileURLFromVaultBySkyflowID(data, this.#client)
          .then((resolvedResult) => {
            // eslint-disable-next-line max-len
            const formattedResult = formatRecordsForRender(resolvedResult, data.column, data.skyflowID);
            bus
              // .target(properties.IFRAME_SECURE_SITE)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY
              + this.#containerId,
                formattedResult,
              );
            resolve(formatForRenderClient(resolvedResult, data.column as string));
          },
          (rejectedResult) => {
            // eslint-disable-next-line max-len
            const formattedResult = formatRecordsForRender(rejectedResult, data.column, data.skyflowID);

            bus
              // .target(properties.IFRAME_SECURE_SITE)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY
              + this.#containerId,
                formattedResult,
              );
            reject(formatForRenderClient(rejectedResult, data.column as string));
          });
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default RevealFrameController;
