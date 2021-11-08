import bus from 'framebus';
import Client from '../../../client';
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from '../../../core/collect';
import {
  fetchRecordsBySkyflowID,
  fetchRecordsByTokenId,
} from '../../../core/reveal';
import { constructInvokeConnectionRequest } from '../../../libs/objectParse';
import { getAccessToken } from '../../../utils/busEvents';
import {
  clearEmpties,
  deletePropertyPath, fillUrlWithPathAndQueryParams, flattenObject, formatFrameNameToId,
} from '../../../utils/helpers';
import {
  ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT, FRAME_REVEAL,
  connectionConfigParseKeys, PUREJS_TYPES,
} from '../../constants';
import { printLog, parameterizedString } from '../../../utils/logsHelper';
import logs from '../../../utils/logs';
import {
  IRevealRecord, ISkyflowIdRecord, IConnectionConfig, MessageType, Context,
} from '../../../utils/common';
import SkyflowError from '../../../libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';

class PureJsFrameController {
  #clientDomain: string;

  #client!: Client;

  #context!:Context;

  constructor() {
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PURE_JS_REQUEST, data.type),
          MessageType.LOG, this.#context.logLevel);

        if (data.type === PUREJS_TYPES.DETOKENIZE) {
          fetchRecordsByTokenId(data.records as IRevealRecord[], this.#client)
            .then(
              (resolvedResult) => {
                printLog(logs.infoLogs.FETCH_RECORDS_RESOLVED, MessageType.LOG,
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
              printLog(logs.infoLogs.INSERT_RECORDS_RESOLVED, MessageType.LOG,
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
              printLog(logs.infoLogs.GET_BY_SKYFLOWID_RESOLVED, MessageType.LOG,
                this.#context.logLevel);

              callback(resolvedResult);
            },
            (rejectedResult) => {
              printLog(logs.errorLogs.GET_BY_SKYFLOWID_REJECTED, MessageType.ERROR,
                this.#context.logLevel);

              callback({ error: rejectedResult });
            },
          );
        } else if (data.type === PUREJS_TYPES.INVOKE_CONNECTION) {
          const config = data.config as IConnectionConfig;

          const promiseList = [] as any;
          connectionConfigParseKeys.forEach((key) => {
            if (config[key]) {
              promiseList.push(constructInvokeConnectionRequest(config[key]));
            }
          });

          Promise.all(promiseList).then(() => {
            const filledUrl = fillUrlWithPathAndQueryParams(config.connectionURL,
              config.pathParams, config.queryParams);
            config.connectionURL = filledUrl;
            this.sendInvokeConnectionRequest(config).then((resultResponse) => {
              printLog(logs.infoLogs.SEND_INVOKE_CONNECTION_RESOLVED, MessageType.LOG,
                this.#context.logLevel);

              callback(resultResponse);
            }).catch((rejectedResponse) => {
              printLog(logs.errorLogs.SEND_INVOKE_CONNECTION_REJECTED, MessageType.ERROR,
                this.#context.logLevel);

              callback({ error: rejectedResponse });
            });
          }).catch((error) => {
            printLog(logs.errorLogs.SEND_INVOKE_CONNECTION_REJECTED, MessageType.ERROR,
              this.#context.logLevel);

            callback({ error });
          });
        }
      });

    bus
      // .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, {}, (data: any) => {
        this.#context = data.context;
        const deserializedBearerToken = new Function(
          `return ${data.bearerToken}`,
        )();
        data.client.config = {
          ...data.client.config,
          getBearerToken: deserializedBearerToken,
        };
        this.#client = Client.fromJSON(data.client) as any;

        printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
          PUREJS_TYPES.INSERT),
        MessageType.LOG, this.#context.logLevel);
        printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
          PUREJS_TYPES.DETOKENIZE),
        MessageType.LOG, this.#context.logLevel);
        printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
          PUREJS_TYPES.GET_BY_SKYFLOWID),
        MessageType.LOG, this.#context.logLevel);
        printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
          PUREJS_TYPES.INVOKE_CONNECTION),
        MessageType.LOG, this.#context.logLevel);
      });
    // printLog(logs.infoLogs.EMIT_PURE_JS_CONTROLLER, MessageType.LOG,
    //   this.#context.logLevel);
  }

  static init() {
    return new PureJsFrameController();
  }

  insertData(records, options) {
    const requestBody = constructInsertRecordRequest(records, options);
    return new Promise((rootResolve, rootReject) => {
      getAccessToken().then((authToken) => {
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
                options.tokens,
                records.records,
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

  sendInvokeConnectionRequest(config:IConnectionConfig) {
    return new Promise((rootResolve, rootReject) => {
      getAccessToken().then((authToken) => {
        const invokeRequest = this.#client.request({
          url: config.connectionURL,
          requestMethod: config.methodName,
          body: config.requestBody,
          headers: { ...config.requestHeader, 'X-Skyflow-Authorization': authToken, 'Content-Type': 'application/json' },
        });
        invokeRequest.then((response) => {
          if (config.responseBody) {
            const flattenResponseBody = flattenObject(config.responseBody);
            const flattenConnectionResponse = flattenObject(response);
            const errorResponse:any[] = [];
            Object.entries(flattenResponseBody).forEach(([key, value]) => {
              if (Object.prototype.hasOwnProperty.call(flattenConnectionResponse, key)) {
                const responseValue = flattenConnectionResponse[key];
                const elementIFrame = window.parent.frames[value as string];
                if (elementIFrame) {
                  const frameName = value as string;
                  if (frameName.startsWith(`${FRAME_ELEMENT}:`)) {
                    const elementId = formatFrameNameToId(frameName);
                    const collectInputElement = elementIFrame
                      .document.getElementById(elementId) as HTMLInputElement;
                    if (collectInputElement) {
                      collectInputElement.value = responseValue;
                    }
                  } else if (frameName.startsWith(`${FRAME_REVEAL}:`)) {
                    const revealSpanElement = elementIFrame
                      .document.getElementById(value) as HTMLSpanElement;
                    if (revealSpanElement) {
                      revealSpanElement.innerText = responseValue;
                    }
                  }
                  deletePropertyPath(response, key);
                  clearEmpties(response);
                }
              } else {
                errorResponse.push(new SkyflowError(SKYFLOW_ERROR_CODE.RESPONSE_BODY_KEY_MISSING,
                  [key], true));
              }
            });
            if (errorResponse.length > 0) {
              rootReject({ success: response, errors: [...errorResponse] });
            }
          }
          rootResolve(response);
        }).catch((err) => {
          rootReject({ errors: [err] });
        });
      }).catch((err) => {
        rootReject(err);
      });
    });
  }
}
export default PureJsFrameController;
