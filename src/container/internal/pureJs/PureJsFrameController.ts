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
import { collectObjectParser } from '../../../libs/objectParse';

import { IGatewayConfig, IRevealRecord, ISkyflowIdRecord } from '../../../Skyflow';
import { getAccessToken } from '../../../utils/busEvents';
import {
  deletePropertyPath, fillUrlWithPathAndQueryParams, flattenObject, formatFrameNameToId,
} from '../../../utils/helpers';
import {
  ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT, FRAME_REVEAL, gatewayConfigParseKeys, PUREJS_TYPES,
} from '../../constants';

class PureJsFrameController {
  #clientDomain: string;

  #client!: Client;

  constructor() {
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST, (data, callback) => {
        if (data.type === PUREJS_TYPES.DETOKENIZE) {
          fetchRecordsByTokenId(data.records as IRevealRecord[], this.#client)
            .then(
              (resolvedResult) => {
                callback(resolvedResult);
              },
              (rejectedResult) => {
                callback({ error: rejectedResult });
              },
            )
            .catch((error) => {
              callback({ error });
            });
        } else if (data.type === PUREJS_TYPES.INSERT) {
          this.insertData(data.records, data.options)
            .then((result) => {
              callback(result);
            })
            .catch((error) => {
              callback(error);
            });
        } else if (data.type === PUREJS_TYPES.GET_BY_SKYFLOWID) {
          fetchRecordsBySkyflowID(
            data.records as ISkyflowIdRecord[],
            this.#client,
          ).then(
            (resolvedResult) => {
              callback(resolvedResult);
            },
            (rejectedResult) => {
              callback({ error: rejectedResult });
            },
          )
            .catch((error) => {
              callback(error);
            });
        } else if (data.type === PUREJS_TYPES.INVOKE_GATEWAY) {
          const config = data.config as IGatewayConfig;

          const promiseList = [] as any;
          gatewayConfigParseKeys.forEach((key) => {
            if (config[key]) {
              promiseList.push(collectObjectParser(config[key]));
            }
          });

          Promise.all(promiseList).then(() => {
            const filledUrl = fillUrlWithPathAndQueryParams(config.gatewayURL, config.pathParams);
            config.gatewayURL = filledUrl;
            this.sendInvokeGateWayRequest(config).then((resultResponse) => {
              callback(resultResponse);
            }).catch((rejectedResponse) => {
              callback({ error: rejectedResponse });
            });
          }).catch((error) => {
            callback({ error });
          });
        }
      });
    bus
      // .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, {}, (data: any) => {
        const deserializedBearerToken = new Function(
          `return ${data.bearerToken}`,
        )();
        data.client.config = {
          ...data.client.config,
          getBearerToken: deserializedBearerToken,
        };
        this.#client = Client.fromJSON(data.client) as any;
      });
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

  sendInvokeGateWayRequest(config:IGatewayConfig) {
    return new Promise((rootResolve, rootReject) => {
      getAccessToken().then((authToken) => {
        const invokeRequest = this.#client.request({
          url: config.gatewayURL,
          requestMethod: config.methodName,
          body: config.requestBody,
          headers: { ...config.requestHeader, 'X-Skyflow-Authorization': authToken, 'Content-Type': 'application/json' },
        });
        invokeRequest.then((response) => {
          if (config.responseBody) {
            const flattenResponseBody = flattenObject(config.responseBody);
            const flattenGatewayResponse = flattenObject(response);
            Object.entries(flattenResponseBody).forEach(([key, value]) => {
              const responseValue = flattenGatewayResponse[key];
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
              }
            });
          }
          rootResolve(response);
        }).catch((err) => {
          rootReject(err);
        });
      }).catch((err) => {
        rootReject(err);
      });
    });
  }
}
export default PureJsFrameController;
