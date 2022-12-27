/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import Client from '../../../client';
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from '../../../core-utils/collect';
import {
  fetchRecordsBySkyflowID,
  fetchRecordsByTokenId,
} from '../../../core-utils/reveal';
import { getAccessToken } from '../../../utils/bus-events';
import {
  ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES,
} from '../../constants';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import logs from '../../../utils/logs';
import {
  IRevealRecord,
  ISkyflowIdRecord,
  MessageType, Context,
} from '../../../utils/common';

const CLASS_NAME = 'SkyflowFrameController';
class SkyflowFrameController {
  #clientId: string;

  #clientDomain: string;

  #client!: Client;

  #context!:Context;

  constructor(clientId) {
    this.#clientId = clientId || '';
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#clientId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PURE_JS_REQUEST, CLASS_NAME, data.type),
          MessageType.LOG, this.#context.logLevel);

        if (data.type === PUREJS_TYPES.DETOKENIZE) {
          fetchRecordsByTokenId(data.records as IRevealRecord[], this.#client)
            .then(
              (resolvedResult) => {
                printLog(parameterizedString(logs.infoLogs.FETCH_RECORDS_RESOLVED, CLASS_NAME),
                  MessageType.LOG,
                  this.#context.logLevel);
                callback(resolvedResult);
              },
              (rejectedResult) => {
                printLog(logs.errorLogs.FETCH_RECORDS_REJECTED, MessageType.ERROR,
                  this.#context.logLevel);

                callback({ error: rejectedResult });
              },
            );
        } else if (data.type === PUREJS_TYPES.INSERT) {
          this.insertData(data.records, data.options)
            .then((result) => {
              printLog(parameterizedString(logs.infoLogs.INSERT_RECORDS_RESOLVED, CLASS_NAME),
                MessageType.LOG,
                this.#context.logLevel);

              callback(result);
            })
            .catch((error) => {
              printLog(logs.errorLogs.INSERT_RECORDS_REJECTED, MessageType.ERROR,
                this.#context.logLevel);
              callback({ error });
            });
        } else if (data.type === PUREJS_TYPES.GET_BY_SKYFLOWID) {
          fetchRecordsBySkyflowID(
            data.records as ISkyflowIdRecord[],
            this.#client,
          ).then(
            (resolvedResult) => {
              printLog(parameterizedString(logs.infoLogs.GET_RESOLVED, CLASS_NAME),
                MessageType.LOG,
                this.#context.logLevel);

              callback(resolvedResult);
            },
            (rejectedResult) => {
              printLog(logs.errorLogs.GET_REJECTED, MessageType.ERROR,
                this.#context.logLevel);

              callback({ error: rejectedResult });
            },
          );
        }
      });

    bus
      // .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#clientId, {}, (data: any) => {
        this.#context = data.context;
        data.client.config = {
          ...data.client.config,
        };
        this.#client = Client.fromJSON(data.client) as any;
        Object.keys(PUREJS_TYPES).forEach((key) => {
          printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
            CLASS_NAME, PUREJS_TYPES[key]), MessageType.LOG, this.#context.logLevel);
        });
      });
  }

  static init(clientId) {
    return new SkyflowFrameController(clientId);
  }

  insertData(records, options) {
    const requestBody = constructInsertRecordRequest(records, options);
    return new Promise((rootResolve, rootReject) => {
      getAccessToken(this.#clientId).then((authToken) => {
        this.#client
          .request({
            body: { records: requestBody },
            requestMethod: 'POST',
            url:
            `${this.#client.config.vaultURL
            }/v1/vaults/${
              this.#client.config.vaultID}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },

          })
          .then((response: any) => {
            rootResolve(
              constructInsertRecordResponse(
                response,
                options?.tokens,
                records?.records,
              ),
            );
          })
          .catch((error) => {
            rootReject(error);
          });
      }).catch((err) => {
        rootReject(err);
      });
    });
  }
}
export default SkyflowFrameController;
