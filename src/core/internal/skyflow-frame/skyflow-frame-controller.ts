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
  fetchRecordsGET,
  fetchRecordsByTokenId,
  fetchRecordsBySkyflowID,
  getFileURLFromVaultBySkyflowID,
} from '../../../core-utils/reveal';
import { getAccessToken } from '../../../utils/bus-events';
import { DEFAULT_FILE_RENDER_ERROR, ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES } from '../../constants';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import logs from '../../../utils/logs';
import {
  IRevealRecord,
  IGetRecord,
  MessageType,
  Context,
  ISkyflowIdRecord,
  IDeleteRecord,
  IGetOptions,
} from '../../../utils/common';
import { deleteData } from '../../../core-utils/delete';
import properties from '../../../properties';
import { getValueFromName, getVaultBeffeURL } from '../../../utils/helpers';

const CLASS_NAME = 'SkyflowFrameController';
class SkyflowFrameController {
  #clientId: string;

  #clientDomain: string;

  #client!: Client;

  #context!: Context;

  constructor(clientId) {
    this.#clientId = clientId || '';
    const clientDomain = atob(getValueFromName(window.name, 2));
    // added for testing
    // eslint-disable-next-line no-console
    console.log('Client Domain in Skyflow Frame Controller : ', clientDomain);
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/') || clientDomain;
    bus
      .on(
        ELEMENT_EVENTS_TO_IFRAME.PUSH_EVENT + this.#clientId,
        (data: any) => {
          if (data && data.event) {
            this.pushEvent(data.event)
              .then((result: any) => {
                if (result) {
                  printLog(parameterizedString(logs.infoLogs.METRIC_CAPTURE_EVENT),
                    MessageType.LOG, this.#context.logLevel);
                } else {
                  printLog(parameterizedString(logs.infoLogs.UNKNOWN_RESPONSE_FROM_METRIC_EVENT),
                    MessageType.LOG, this.#context.logLevel);
                }
              })
              .catch((error) => {
                printLog(parameterizedString(logs.infoLogs.UNKNOWN_METRIC_CAPTURE_EVENT,
                  error.toString()),
                MessageType.LOG, this.#context.logLevel);
              });
          }
        },
      );
    bus
      .target(this.#clientDomain)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#clientId,
        (data, callback) => {
          printLog(
            parameterizedString(
              logs.infoLogs.CAPTURE_PURE_JS_REQUEST,
              CLASS_NAME,
              data.type,
            ),
            MessageType.LOG,
            this.#context.logLevel,
          );

          if (data.type === PUREJS_TYPES.DETOKENIZE) {
            fetchRecordsByTokenId(
              data.records as IRevealRecord[],
              this.#client,
            ).then(
              (resolvedResult) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.FETCH_RECORDS_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.#context.logLevel,
                );
                callback(resolvedResult);
              },
              (rejectedResult) => {
                printLog(
                  logs.errorLogs.FETCH_RECORDS_REJECTED,
                  MessageType.ERROR,
                  this.#context.logLevel,
                );

                callback({ error: rejectedResult });
              },
            );
          } else if (data.type === PUREJS_TYPES.INSERT) {
            this.insertData(data.records, data.options)
              .then((result) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.INSERT_RECORDS_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.#context.logLevel,
                );

                callback(result);
              })
              .catch((error) => {
                printLog(
                  logs.errorLogs.INSERT_RECORDS_REJECTED,
                  MessageType.ERROR,
                  this.#context.logLevel,
                );
                callback({ error });
              });
          } else if (data.type === PUREJS_TYPES.GET) {
            fetchRecordsGET(
              data.records as IGetRecord[], this.#client, data.options as IGetOptions,
            ).then(
              (resolvedResult) => {
                printLog(
                  parameterizedString(logs.infoLogs.GET_RESOLVED, CLASS_NAME),
                  MessageType.LOG,
                  this.#context.logLevel,
                );

                callback(resolvedResult);
              },
              (rejectedResult) => {
                printLog(
                  logs.errorLogs.GET_REJECTED,
                  MessageType.ERROR,
                  this.#context.logLevel,
                );

                callback({ error: rejectedResult });
              },
            );
          } else if (data.type === PUREJS_TYPES.GET_BY_SKYFLOWID) {
            fetchRecordsBySkyflowID(
              data.records as ISkyflowIdRecord[],
              this.#client,
            ).then(
              (resolvedResult) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.GET_BY_SKYFLOWID_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.#context.logLevel,
                );

                callback(resolvedResult);
              },
              (rejectedResult) => {
                printLog(
                  logs.errorLogs.GET_BY_SKYFLOWID_REJECTED,
                  MessageType.ERROR,
                  this.#context.logLevel,
                );

                callback({ error: rejectedResult });
              },
            );
          } else if (data.type === PUREJS_TYPES.DELETE) {
            deleteData(
              data.records as IDeleteRecord[],
              data.options,
              this.#client,
            ).then(
              (resolvedResult) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.DELETE_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.#context.logLevel,
                );

                callback(resolvedResult);
              },
            ).catch((rejectedResult) => {
              printLog(
                logs.errorLogs.DELETE_RECORDS_REJECTED,
                MessageType.ERROR,
                this.#context.logLevel,
              );

              callback({ error: rejectedResult });
            });
          }
        },
      );
    const sub2 = (data, callback) => {
      printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
      MessageType.LOG, this.#context.logLevel);
      this.renderFile(data.records, data.containerId, data.iframeName).then(
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
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + this.#clientId, sub2);
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
            `${this.#client.config.vaultURL}/v1/vaults/${
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

  renderFile(data: IRevealRecord, containerId, iframeName) {
    return new Promise((resolve, reject) => {
      try {
        getFileURLFromVaultBySkyflowID(data, this.#client)
          .then((resolvedResult) => {
            let url = '';
            if (resolvedResult.fields && data.column) {
              url = resolvedResult.fields[data.column];
            }
            bus
              .target(properties.IFRAME_SECURE_SITE)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY
                + containerId,
                {
                  url,
                  iframeName,
                },
              );

            resolve(resolvedResult);
          },
          (rejectedResult) => {
            bus
              .target(properties.IFRAME_SECURE_SITE)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY
                + containerId,
                {
                  error: DEFAULT_FILE_RENDER_ERROR,
                  iframeName,
                },
              );
            reject(rejectedResult);
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  pushEvent(event: any) {
    return new Promise((resolve, reject) => {
      getAccessToken(this.#clientId).then((authToken) => {
        this.#client
          .request({
            body: event,
            requestMethod: 'POST',
            url:
              `${getVaultBeffeURL(event.vault_url)}/sdk/sdk-metrics`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },

          })
          .then((response: any) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      }).catch((err) => {
        reject(err);
      });
    });
  }
}
export default SkyflowFrameController;
