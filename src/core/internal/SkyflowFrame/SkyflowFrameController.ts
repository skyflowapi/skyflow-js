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
import {
  constructInvokeConnectionRequest,
  constructSoapConnectionRequestXml,
  extractSkyflowTagsFromResponseBody,
  soapResponseBodyParser,
} from '../../../libs/objectParse';
import { getAccessToken } from '../../../utils/busEvents';
import {
  clearEmpties,
  deletePropertyPath, fillUrlWithPathAndQueryParams, flattenObject, formatFrameNameToId,
} from '../../../utils/helpers';
import {
  ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT, FRAME_REVEAL,
  connectionConfigParseKeys, PUREJS_TYPES, FORMAT_REGEX, REPLACE_TEXT,
} from '../../constants';
import { printLog, parameterizedString } from '../../../utils/logsHelper';
import logs from '../../../utils/logs';
import {
  IRevealRecord,
  ISkyflowIdRecord,
  IConnectionConfig,
  MessageType, Context,
  ISoapConnectionConfig,
  LogLevel,
} from '../../../utils/common';
import SkyflowError from '../../../libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';

const soapRequest = require('easy-soap-request');
const xmljs = require('xml-js');
const RegexParser = require('regex-parser');

const CLASS_NAME = 'SkyflowFrameController';
class SkyflowFrameController {
  #skyflowId: string;

  #clientDomain: string;

  #client!: Client;

  #context!:Context;

  constructor(skyflowId) {
    this.#skyflowId = skyflowId || '';
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#skyflowId, (data, callback) => {
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
              printLog(parameterizedString(logs.infoLogs.GET_BY_SKYFLOWID_RESOLVED, CLASS_NAME),
                MessageType.LOG,
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
              promiseList.push(constructInvokeConnectionRequest(config[key], this.#client));
            }
          });

          Promise.all(promiseList).then(() => {
            const filledUrl = fillUrlWithPathAndQueryParams(config.connectionURL,
              config.pathParams, config.queryParams);
            config.connectionURL = filledUrl;
            this.sendInvokeConnectionRequest(config).then((resultResponse) => {
              printLog(parameterizedString(logs.infoLogs.SEND_INVOKE_CONNECTION_RESOLVED,
                CLASS_NAME),
              MessageType.LOG,
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
        } else if (data.type === PUREJS_TYPES.INVOKE_SOAP_CONNECTION) {
          const config = data.config as ISoapConnectionConfig;

          constructSoapConnectionRequestXml(config.requestXML, this.#client).then((xml) => {
            this.invokeSoapConnectionRequest({
              ...config,
              requestXML: xml,
            }).then((response) => {
              printLog(parameterizedString(logs.infoLogs.SEND_SOAP_INVOKE_CONNECTION_RESOLVED,
                CLASS_NAME), MessageType.LOG, this.#context.logLevel);
              callback(response);
            }).catch((error) => {
              printLog(logs.errorLogs.SEND_INVOKE_SOAP_CONNECTION_REJECTED, MessageType.ERROR,
                this.#context.logLevel);
              callback({ error });
            });
          }).catch((error) => {
            printLog(logs.errorLogs.SEND_INVOKE_SOAP_CONNECTION_REJECTED, MessageType.ERROR,
              this.#context.logLevel);
            callback({ error });
          });
        }
      });

    bus
      // .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#skyflowId, {}, (data: any) => {
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

  static init(skyflowId) {
    return new SkyflowFrameController(skyflowId);
  }

  insertData(records, options) {
    const requestBody = constructInsertRecordRequest(records, options);
    return new Promise((rootResolve, rootReject) => {
      getAccessToken(this.#skyflowId).then((authToken) => {
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

  sendInvokeConnectionRequest(config:IConnectionConfig) {
    return new Promise((rootResolve, rootReject) => {
      getAccessToken(this.#skyflowId).then((authToken) => {
        const invokeRequest = this.#client.request({
          url: config.connectionURL,
          requestMethod: config.methodName,
          body: config.requestBody,
          headers: { 'X-Skyflow-Authorization': authToken, 'Content-Type': 'application/json', ...config.requestHeader },
        });
        invokeRequest.then((response) => {
          if (config.responseBody) {
            const flattenResponseBody = flattenObject(config.responseBody);
            const flattenConnectionResponse = flattenObject(response);
            const errorResponse:any[] = [];
            Object.entries<any>(flattenResponseBody).forEach(([key, value]) => {
              if (Object.prototype.hasOwnProperty.call(flattenConnectionResponse, key)) {
                let tempName = value;
                let tempResponseValue = flattenConnectionResponse[key];

                if (value.startsWith(`${FRAME_REVEAL}:`) && value.includes(FORMAT_REGEX) && value.includes(REPLACE_TEXT)) {
                  const index = value.indexOf(FORMAT_REGEX);
                  tempName = value.substring(0, index);

                  const regexStr = value.substring(index).replace(FORMAT_REGEX, '');
                  const regex = regexStr.substring(0, regexStr.indexOf(REPLACE_TEXT));
                  const tempRegex = RegexParser(regex);

                  const replaceTextStr = regexStr.substring(regexStr.indexOf(REPLACE_TEXT));
                  const replaceText = replaceTextStr.replace(REPLACE_TEXT, '');
                  tempResponseValue = tempResponseValue.replace(tempRegex, replaceText);
                } else if (value.startsWith(`${FRAME_REVEAL}:`) && value.includes(FORMAT_REGEX)) {
                  const index = value.indexOf(FORMAT_REGEX);
                  tempName = value.substring(0, index);

                  const regexStr = value.substring(index);
                  const regex = regexStr.replace(FORMAT_REGEX, '');
                  const tempRegex = RegexParser(regex);
                  const matchResults = tempResponseValue.match(tempRegex);
                  if (matchResults && matchResults?.length > 0) {
                    tempResponseValue = matchResults[0];
                  } else {
                    printLog(parameterizedString(logs.warnLogs.NO_MATCH_FOUND_FOR_FORMAT_REGEX,
                      regex), MessageType.WARN, LogLevel.WARN);
                  }
                }

                value = tempName;
                const responseValue = tempResponseValue;

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

  // eslint-disable-next-line class-methods-use-this
  invokeSoapConnectionRequest(config: ISoapConnectionConfig) {
    return new Promise((rootResolve, rootReject) => {
      getAccessToken(this.#skyflowId).then((authToken) => {
        soapRequest({
          url: config.connectionURL,
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'X-Skyflow-Authorization': authToken,
            ...config.httpHeaders,
          },
          xml: config.requestXML,
          timeout: 30000,
        }).then(({ response }) => {
          let finalResponse = response.body;
          if (config.responseXML) {
            const skyflowTags = {};
            const options = { compact: true, ignoreComment: true, spaces: 4 };
            const responseBodyJson = xmljs.xml2js(config.responseXML, options);
            const connectionRespJson = xmljs.xml2js(finalResponse, options);

            extractSkyflowTagsFromResponseBody(responseBodyJson, '', skyflowTags, connectionRespJson);
            soapResponseBodyParser(skyflowTags, connectionRespJson);
            finalResponse = xmljs.js2xml(connectionRespJson, options);
          }
          rootResolve(finalResponse);
        }).catch((err) => {
          if (typeof err === 'string') {
            rootReject({
              code: 500,
              description: 'Internal Server Error',
              xml: err,
            });
          } else if (err.message === 'Network Error') {
            rootReject(new SkyflowError(SKYFLOW_ERROR_CODE.NETWORK_ERROR, [], true));
          }
          rootReject(err);
        });
      }).catch((err) => {
        rootReject(err);
      });
    });
  }
}
export default SkyflowFrameController;
