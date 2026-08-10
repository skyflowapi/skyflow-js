/*
Copyright (c) 2022 Skyflow, Inc.
*/
// flowDB skyflow-frame controller. Handles the flowDB reveal/detokenize path
// (PUREJS_TYPES.DETOKENIZE + REVEAL_TYPES.REVEAL) and the flowDB collect path
// (COLLECT_TYPES.COLLECT tokenize). The privacyDB-only PUREJS handlers
// (INSERT/UPDATE/GET/GET_BY_SKYFLOWID/DELETE), file upload, and file render are
// intentionally omitted — flowvault's data layer is flowDB-only.
import bus from 'framebus';
import get from 'lodash/get';
import { checkForElementMatchRule, checkForValueMatch } from '@core/helpers';
import { formatRecordsForIframe } from '@core/core-utils/reveal';
import { getAccessToken } from '@core/utils/bus-events';
import {
  COLLECT_TYPES,
  CORALOGIX_DOMAIN,
  DOMAIN,
  ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, PUREJS_TYPES, REVEAL_TYPES, SDK_IFRAME_EVENT,
} from '@core/constants';
import logs from '@core/utils/logs';
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import Client from '../../../client';
import {
  constructElementsInsertReq,
  constructFlowDBInsertRequest,
  constructFlowDBUpdateRequest,
  insertDataInCollectFlowDB,
  updateDataInCollectFlowDB,
  replaceCVVTokensInResponse,
  CVVMap,
} from '../../../core-utils/collect';
import {
  fetchRecordsByTokenIdFlowDB,
  formatRecordsForClientFlowDB,
} from '../../../core-utils/reveal';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import {
  IRevealRecord,
  MessageType,
  Context,
  IRevealResponseType,
  ErrorType,
} from '../../../utils/common';
import {
  getAtobValue, getSDKNameAndVersion, getValueFromName,
} from '../../../utils/helpers';
import SkyflowError from '../../../libs/skyflow-error';
import {
  ElementInfo, FlowDBInsertRequestBody, FlowDBUpdateRequestBody,
  TokenizeDataInput, CollectResponse, RevealResponse, RevealError,
} from '../internal-types';

const set = require('set-value');

const CLASS_NAME = 'SkyflowFrameController';
class SkyflowFrameController {
  #clientId: string;

  #clientDomain: string;

  #client!: Client;

  #context!: Context;

  constructor(clientId: string) {
    this.#clientId = clientId || '';
    const encodedClientDomain = getValueFromName(window.name, 2);
    const clientDomain = getAtobValue(encodedClientDomain);
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/') || clientDomain;
    bus
      .on(
        ELEMENT_EVENTS_TO_IFRAME.PUSH_EVENT + this.#clientId,
        (data: any) => {
          if (window?.CoralogixRum
            && !window.CoralogixRum.isInited
            && this.#client?.config?.options?.trackingKey
            && this.#client?.config?.options?.trackingKey.length >= 35) {
            const sdkMetaData = getSDKNameAndVersion(this.#client?.toJSON()?.metaData?.sdkVersion);
            window.CoralogixRum.init({
              application: sdkMetaData.sdkName,
              public_key: this.#client.config?.options?.trackingKey,
              coralogixDomain: DOMAIN,
              version: sdkMetaData.sdkVersion,
              beforeSend: (event: any) => {
                if (event?.log_context?.message && event.log_context.message === SDK_IFRAME_EVENT) {
                  return event;
                }
                return null;
              },
            });
          }
          if (data && data.event && window?.CoralogixRum) {
            try {
              window.CoralogixRum.info(SDK_IFRAME_EVENT, data.event);
              printLog(parameterizedString(logs.infoLogs.METRIC_CAPTURE_EVENT),
                MessageType.LOG, this.#context?.logLevel);
            } catch (err: any) {
              printLog(parameterizedString(logs.infoLogs.UNKNOWN_METRIC_CAPTURE_EVENT,
                err.toString()),
              MessageType.LOG, this.#context?.logLevel);
            }
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
            fetchRecordsByTokenIdFlowDB(
              data.records as IRevealRecord[],
              this.#client,
              true,
              data.options as Record<string, any>,
            ).then(
              (resolvedResult: IRevealResponseType) => {
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
              (rejectedResult: IRevealResponseType) => {
                printLog(
                  parameterizedString(logs.errorLogs.FETCH_RECORDS_REJECTED),
                  MessageType.ERROR,
                  this.#context.logLevel,
                );

                callback({ error: rejectedResult });
              },
            );
          }
        },
      );
    bus
      .target(this.#clientDomain)
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
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#clientId, (data, callback) => {
        if (this.#client && data?.errorMessages) {
          const errorMessages: Partial<Record<ErrorType, string>> = data?.errorMessages;
          this.#client.setErrorMessages(errorMessages as Record<ErrorType, string>);
        }
        printLog(
          parameterizedString(
            logs.infoLogs.CAPTURE_PURE_JS_REQUEST,
            CLASS_NAME,
            data.type,
          ),
          MessageType.LOG,
          this.#context.logLevel,
        );
        if (data.type === COLLECT_TYPES.COLLECT) {
          printLog(
            parameterizedString(logs.infoLogs.CAPTURE_EVENT,
              CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
            MessageType.LOG,
            this.#context.logLevel,
          );
          const tokenizeDataInput: TokenizeDataInput = {
            ...data,
            type: data.type,
            elementIds: data.elementIds as Array<ElementInfo>,
            containerId: data.containerId as string,
          };
          this.tokenize(tokenizeDataInput)
            .then((response: CollectResponse) => {
              callback(response);
            })
            .catch((error: any) => {
              // tokenize already rejects with the final client envelope
              // ({ error: <flowDB body> } on API failure, or a SkyflowError on
              // validation). Forward it as-is; wrapping again would nest the
              // body one level too deep and blank out the client error.
              callback(error?.error !== undefined ? error : { error });
            });
        }
      });
    bus
      .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.#clientId,
        {}, (data: any) => {
          this.#context = data.context;
          data.client.config = {
            ...data.client.config,
          };
          this.#client = Client.fromJSON(data.client) as any;
          Object.keys(COLLECT_TYPES).forEach((key) => {
            printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
              CLASS_NAME, COLLECT_TYPES[key]), MessageType.LOG, this.#context.logLevel);
          });
          Object.keys(REVEAL_TYPES).forEach((key) => {
            printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
              CLASS_NAME, REVEAL_TYPES[key]), MessageType.LOG, this.#context.logLevel);
          });
        });
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#clientId, (data, callback) => {
        printLog(
          parameterizedString(
            logs.infoLogs.CAPTURE_PURE_JS_REQUEST,
            CLASS_NAME,
            data.type,
          ),
          MessageType.LOG,
          this.#context.logLevel,
        );
        if (this.#client && data?.errorMessages) {
          const errorMessages: Partial<Record<ErrorType, string>> = data?.errorMessages;
          this.#client.setErrorMessages(errorMessages as Record<ErrorType, string>);
        }

        if (data.type === REVEAL_TYPES.REVEAL) {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST),
          MessageType.LOG, this.#context.logLevel);
          this.revealData(
            data.records as IRevealRecord[],
            data.containerId as string,
            data.options as Record<string, any>,
          ).then(
            (resolvedResult) => {
              callback(resolvedResult);
            },
            (rejectedResult: any) => {
              // Full API failure already carries { error: <flowDB body> }; forward
              // it as-is so the client error isn't nested a level too deep.
              callback(
                rejectedResult?.error !== undefined ? rejectedResult : { error: rejectedResult },
              );
            },
          );
        }
      });
  }

  static init(clientId: string = ''): SkyflowFrameController {
    const trackingStatus = getValueFromName(window.name, 3) === 'true';
    if (trackingStatus) {
      const scriptTag = document.createElement('script');
      scriptTag.src = CORALOGIX_DOMAIN;
      document.head.append(scriptTag);
    }
    return new SkyflowFrameController(clientId);
  }

  revealData(
    revealRecords: IRevealRecord[],
    containerId: string,
    options?: Record<string, any>,
  ): Promise<RevealResponse | RevealError> {
    const id = containerId;
    return new Promise((resolve, reject) => {
      fetchRecordsByTokenIdFlowDB(revealRecords, this.#client, false, options).then(
        (resolvedResult) => {
          const formattedResult = formatRecordsForIframe(resolvedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + id,
              formattedResult,
            );
          resolve(formatRecordsForClientFlowDB(resolvedResult));
        },
        (rejectedResult: any) => {
          const formattedResult = formatRecordsForIframe(rejectedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + id,
              formattedResult,
            );
          // fetchRecordsByTokenIdFlowDB rejects for both a full API failure
          // ({ error }) and a partial/all-token failure ({ records, errors }).
          // Only a full failure is a client-facing reject; a partial result must
          // resolve as success so the merged { records: [...] } (with inline
          // per-token errors) reaches the client per the reveal contract.
          if (rejectedResult?.error !== undefined) {
            reject(formatRecordsForClientFlowDB(rejectedResult));
          } else {
            resolve(formatRecordsForClientFlowDB(rejectedResult));
          }
        },
      );
    });
  }

  tokenize = (options: TokenizeDataInput): Promise<CollectResponse> => {
    const id: string = options.containerId;
    if (!this.#client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const insertResponseObject: any = {};
    const updateResponseObject: any = {};
    const cvvMap: CVVMap = { insert: {}, update: {} };
    let errorMessage = '';
    for (let i = 0; i < options.elementIds.length; i += 1) {
      const Frame = window.parent.frames[`${options.elementIds[i].frameId}:${id}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`];
      const inputElement = Frame.document
        .getElementById(options.elementIds[i].elementId);
      if (inputElement) {
        if (
          inputElement.iFrameFormElement.fieldType
          !== ELEMENTS.FILE_INPUT.name && inputElement.iFrameFormElement.fieldType
          !== ELEMENTS.MULTI_FILE_INPUT.name
        ) {
          const {
            state, doesClientHasError, clientErrorText, errorText, onFocusChange, validations,
            setValue,
          } = inputElement.iFrameFormElement;
          if (state.isRequired || !state.isValid) {
            onFocusChange(false);
          }
          if (validations
            && checkForElementMatchRule(validations)
            && checkForValueMatch(validations, inputElement.iFrameFormElement)) {
            setValue(state.value);
            onFocusChange(false);
          }
          if (!state.isValid || !state.isComplete) {
            if (doesClientHasError) {
              errorMessage += `${state.name}:${clientErrorText}`;
            } else { errorMessage += `${state.name}:${errorText} `; }
          }
        }
      }
    }

    if (errorMessage.length > 0) {
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.COMPLETE_AND_VALID_INPUTS, [`${errorMessage}`], true));
    }

    for (let i = 0; i < options.elementIds.length; i += 1) {
      const Frame = window.parent.frames[`${options.elementIds[i].frameId}:${id}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`];
      const inputElement = Frame.document
        .getElementById(options.elementIds[i].elementId);
      if (inputElement) {
        const {
          state, tableName, validations, skyflowID,
        } = inputElement.iFrameFormElement;
        if (tableName) {
          if (
            inputElement.iFrameFormElement.fieldType
        !== ELEMENTS.FILE_INPUT.name
         && inputElement.iFrameFormElement.fieldType !== ELEMENTS.MULTI_FILE_INPUT.name
          ) {
            const isCVV = inputElement.iFrameFormElement.fieldType === ELEMENTS.CVV.name;
            if (
              inputElement.iFrameFormElement.fieldType
          === ELEMENTS.checkbox.name
            ) {
              if (insertResponseObject[state.name]) {
                insertResponseObject[state.name] = `${insertResponseObject[state.name]},${state.value
                }`;
              } else {
                insertResponseObject[state.name] = state.value;
              }
            } else if (insertResponseObject[tableName] && !(skyflowID === '') && skyflowID === undefined) {
              if (get(insertResponseObject[tableName], state.name)
            && !(validations && checkForElementMatchRule(validations))) {
                return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT,
                  [state.name, tableName], true));
              }
              set(
                insertResponseObject[tableName],
                state.name,
                inputElement.iFrameFormElement.getUnformattedValue(),
              );
              if (isCVV) {
                cvvMap.insert[tableName] = {
                  ...(cvvMap.insert[tableName] || {}),
                  [state.name]: inputElement.iFrameFormElement.getUnformattedValue(),
                };
              }
            } else if (skyflowID || skyflowID === '') {
              if (skyflowID === '' || skyflowID === null) {
                return Promise.reject(new SkyflowError(
                  SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS,
                ));
              }
              if (updateResponseObject[skyflowID]) {
                set(
                  updateResponseObject[skyflowID],
                  state.name,
                  inputElement.iFrameFormElement.getUnformattedValue(),
                );
              } else {
                updateResponseObject[skyflowID] = {};
                set(
                  updateResponseObject[skyflowID],
                  state.name,
                  inputElement.iFrameFormElement.getUnformattedValue(),
                );
                set(
                  updateResponseObject[skyflowID],
                  'table',
                  tableName,
                );
              }
              if (isCVV) {
                cvvMap.update[skyflowID] = {
                  ...(cvvMap.update[skyflowID] || {}),
                  [state.name]: inputElement.iFrameFormElement.getUnformattedValue(),
                };
              }
            } else {
              insertResponseObject[tableName] = {};
              set(
                insertResponseObject[tableName],
                state.name,
                inputElement.iFrameFormElement.getUnformattedValue(),
              );
              if (isCVV) {
                cvvMap.insert[tableName] = {
                  ...(cvvMap.insert[tableName] || {}),
                  [state.name]: inputElement.iFrameFormElement.getUnformattedValue(),
                };
              }
            }
          }
        }
      }
    }
    let finalInsertRequest: FlowDBInsertRequestBody;
    let finalUpdateRequest: FlowDBUpdateRequestBody;
    let finalInsertRecords;
    let finalUpdateRecords;
    try {
      [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq(
        insertResponseObject, updateResponseObject, options,
      );
      finalInsertRequest = constructFlowDBInsertRequest(
        finalInsertRecords, options, this.#client.config.vaultID,
      );
      finalUpdateRequest = constructFlowDBUpdateRequest(
        finalUpdateRecords, options, this.#client.config.vaultID,
      );
    } catch (error:any) {
      return Promise.reject({
        error: error?.message,
      });
    }
    const client = this.#client;
    const sendRequest = (): Promise<CollectResponse> => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        const requests: Promise<any>[] = [];
        if (finalInsertRecords.records.length !== 0) {
          requests.push(insertDataInCollectFlowDB(
            finalInsertRequest,
            client,
            options,
            finalInsertRecords,
            authToken as string,
          ));
        }
        if (finalUpdateRecords.updateRecords.length !== 0) {
          requests.push(updateDataInCollectFlowDB(
            finalUpdateRequest,
            client,
            options,
            finalUpdateRecords,
            authToken as string,
          ));
        }
        if (requests.length === 0) {
          rootResolve({ records: [] });
          return;
        }
        Promise.all(requests).then((responses: any[]) => {
          const failure = responses.find((response) => response?.error !== undefined);
          if (failure) {
            rootReject(failure);
            return;
          }
          const records = responses.reduce(
            (acc, response) => acc.concat(response?.records || []),
            [] as any[],
          );
          replaceCVVTokensInResponse(records, cvvMap);
          rootResolve({ records });
        });
      }).catch((err) => {
        rootReject(err);
      });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  };
}
export default SkyflowFrameController;
