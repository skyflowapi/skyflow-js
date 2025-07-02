/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import get from 'lodash/get';
import Client from '../../../client';
import {
  checkForElementMatchRule,
  checkForValueMatch,
  constructElementsInsertReq,
  constructInsertRecordRequest,
  constructInsertRecordResponse,
  constructUploadResponse,
  updateRecordsBySkyflowID,
} from '../../../core-utils/collect';
import {
  fetchRecordsGET,
  fetchRecordsByTokenId,
  fetchRecordsBySkyflowID,
  getFileURLFromVaultBySkyflowID,
  formatRecordsForClient,
  formatRecordsForIframe,
} from '../../../core-utils/reveal';
import { getAccessToken } from '../../../utils/bus-events';
import {
  COLLECT_TYPES,
  CORALOGIX_DOMAIN,
  DEFAULT_FILE_RENDER_ERROR, DOMAIN,
  ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, PUREJS_TYPES, REVEAL_TYPES, SDK_IFRAME_EVENT,
} from '../../constants';
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
  IInsertResponse,
} from '../../../utils/common';
import { deleteData } from '../../../core-utils/delete';
import properties from '../../../properties';
import {
  fileValidation, generateUploadFileName,
  getAtobValue, getSDKNameAndVersion, getValueFromName, vaildateFileName,
} from '../../../utils/helpers';
import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';

const set = require('set-value');

const CLASS_NAME = 'SkyflowFrameController';
class SkyflowFrameController {
  #clientId: string;

  #clientDomain: string;

  #client!: Client;

  #context!: Context;

  constructor(clientId: string) {
    window.addEventListener('message', (event) => {
      console.log('SDK controller iframe inside received message:', event);
      if (event.data.data.type === 'COLLECT') {
        console.log('SDK controller iframe insde received message:', event.data);
        this.tokenize(event.data.data)
          .then((response) => {
            console.log('SDK controller iframe insde response:', response);
          // callback(response);
          })
          .catch((error) => {
            console.log('SDK controller iframe insde error:', error);
          });
      }

      // Handle the message if needed
    });
    window.addEventListener('message', (event) => {
      if (event.data.type === 'SKYFLOW_FRAME_READY') {
        this.#client = event.data.data.client;
        console.log('SkyflowFrameController client:', event.data.client);
        console.log(this.#client.config);
      }
    });
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
                MessageType.LOG, this.#context.logLevel);
            } catch (err: any) {
              printLog(parameterizedString(logs.infoLogs.UNKNOWN_METRIC_CAPTURE_EVENT,
                err.toString()),
              MessageType.LOG, this.#context.logLevel);
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
                  parameterizedString(logs.errorLogs.FETCH_RECORDS_REJECTED),
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
                  parameterizedString(logs.errorLogs.INSERT_RECORDS_REJECTED),
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
                printLog(parameterizedString(
                  logs.errorLogs.GET_REJECTED,
                ),
                MessageType.ERROR,
                this.#context.logLevel);

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
                  parameterizedString(logs.errorLogs.GET_BY_SKYFLOWID_REJECTED),
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
                parameterizedString(
                  logs.errorLogs.DELETE_RECORDS_REJECTED,
                ),
                MessageType.ERROR,
                this.#context.logLevel,
              );

              callback({ error: rejectedResult });
            });
          }
        },
      );
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
    bus
      // .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.#clientId, (data, callback) => {
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
          this.tokenize(data)
            .then((response) => {
              callback(response);
            })
            .catch((error) => {
              callback({ error });
            });
        } else if (data.type === COLLECT_TYPES.FILE_UPLOAD) {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
          MessageType.LOG, this.#context.logLevel);
          this.parallelUploadFiles(data)
            .then((response) => {
              callback(response);
            })
            .catch((error) => {
              callback({ error });
            });
        }
      });
    bus
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
        if (data.type === REVEAL_TYPES.REVEAL) {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST),
          MessageType.LOG, this.#context.logLevel);
          this.revealData(data.records as any, data.containerId).then(
            (resolvedResult) => {
              callback(resolvedResult);
            },
            (rejectedResult) => {
              callback({ error: rejectedResult });
            },
          );
        } else if (data.type === REVEAL_TYPES.RENDER_FILE) {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
          MessageType.LOG, this.#context.logLevel);
          this.renderFile(data.records, data.iframeName).then(
            (resolvedResult) => {
              callback(
                resolvedResult,
              );
            },
            (rejectedResult) => {
              callback({ errors: rejectedResult });
            },
          );
        }
      });
  }

  static init(clientId) {
    const trackingStatus = getValueFromName(window.name, 3) === 'true';
    if (trackingStatus) {
      const scriptTag = document.createElement('script');
      scriptTag.src = CORALOGIX_DOMAIN;
      document.head.append(scriptTag);
    }
    return new SkyflowFrameController(clientId);
  }

  revealData(revealRecords: IRevealRecord[], containerId) {
    const id = containerId;
    return new Promise((resolve, reject) => {
      fetchRecordsByTokenId(revealRecords, this.#client).then(
        (resolvedResult) => {
          const formattedResult = formatRecordsForIframe(resolvedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + id,
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
                + id,
              formattedResult,
            );
          reject(formatRecordsForClient(rejectedResult));
        },
      );
    });
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

  renderFile(data, iframeName) {
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
                + iframeName,
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
                + iframeName,
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

  tokenize = (options) => {
    console.log('lakl', options);
    const id = options.containerId;
    // if (!this.#client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const insertResponseObject: any = {};
    const updateResponseObject: any = {};
    let errorMessage = '';
    for (let i = 0; i < options.elementIds.length; i += 1) {
      let Frame;
      try {
        Frame = window.parent.frames[`${options.elementIds[i].frameId}:${id}:DEBUG:${btoa(this.#clientDomain)}`];
      } catch (error) {
        console.error('Error in tokenize:', error);
      }

      const inputElement = Frame.document
        .getElementById(options.elementIds[i].elementId);
      if (inputElement) {
        if (
          inputElement.iFrameFormElement.fieldType
          !== ELEMENTS.FILE_INPUT.name
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
      const Frame = window.parent.frames[`${options.elementIds[i].frameId}:${id}:DEBUG:${btoa(this.#clientDomain)}`];
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
          ) {
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
            } else {
              insertResponseObject[tableName] = {};
              set(
                insertResponseObject[tableName],
                state.name,
                inputElement.iFrameFormElement.getUnformattedValue(),
              );
            }
          }
        }
      }
    }
    let finalInsertRequest;
    let finalInsertRecords;
    let finalUpdateRecords;
    let insertResponse: IInsertResponse;
    let updateResponse: IInsertResponse;
    let insertErrorResponse: any;
    let updateErrorResponse;
    let insertDone = false;
    let updateDone = false;
    try {
      [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq(
        insertResponseObject, updateResponseObject, options,
      );
      finalInsertRequest = constructInsertRecordRequest(finalInsertRecords, options);
    } catch (error:any) {
      return Promise.reject({
        error: error?.message,
      });
    }
    const client = new Client(this.#client.config, {});
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      // getAccessToken(clientId).then((authToken) => {
      if (finalInsertRequest.length !== 0) {
        client
          .request({
            body: {
              records: finalInsertRequest,
            },
            requestMethod: 'POST',
            url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}`,
            headers: {
              authorization: 'Bearer <sample_token>',
              'content-type': 'application/json',
            },
          })
          .then((response: any) => {
            insertResponse = constructInsertRecordResponse(
              response,
              options.tokens,
              finalInsertRecords.records,
            );
            insertDone = true;
            if (finalUpdateRecords.updateRecords.length === 0) {
              rootResolve(insertResponse);
            }
            if (updateDone && updateErrorResponse !== undefined) {
              if (updateErrorResponse.records === undefined) {
                updateErrorResponse.records = insertResponse.records;
              } else {
                updateErrorResponse.records = insertResponse.records
                  .concat(updateErrorResponse.records);
              }
              rootReject(updateErrorResponse);
            } else if (updateDone && updateResponse !== undefined) {
              rootResolve({ records: insertResponse.records.concat(updateResponse.records) });
            }
          })
          .catch((error) => {
            insertDone = true;
            if (finalUpdateRecords.updateRecords.length === 0) {
              rootReject(error);
            } else {
              insertErrorResponse = {
                errors: [
                  {
                    error: {
                      code: error?.error?.code,
                      description: error?.error?.description,
                    },
                  },
                ],
              };
            }
            if (updateDone && updateResponse !== undefined) {
              const errors = insertErrorResponse.errors;
              const records = updateResponse.records;
              rootReject({ errors, records });
            } else if (updateDone && updateErrorResponse !== undefined) {
              updateErrorResponse.errors = updateErrorResponse.errors
                .concat(insertErrorResponse.errors);
              rootReject(updateErrorResponse);
            }
          });
      }
      if (finalUpdateRecords.updateRecords.length !== 0) {
        updateRecordsBySkyflowID(finalUpdateRecords, client, options)
          .then((response: any) => {
            updateResponse = {
              records: response,
            };
            updateDone = true;
            if (finalInsertRequest.length === 0) {
              rootResolve(updateResponse);
            }
            if (insertDone && insertResponse !== undefined) {
              rootResolve({ records: insertResponse.records.concat(updateResponse.records) });
            } else if (insertDone && insertErrorResponse !== undefined) {
              const errors = insertErrorResponse.errors;
              const records = updateResponse.records;
              rootReject({ errors, records });
            }
          }).catch((error) => {
            updateErrorResponse = error;
            updateDone = true;
            if (finalInsertRequest.length === 0) {
              rootReject(error);
            }
            if (insertDone && insertResponse !== undefined) {
              if (updateErrorResponse.records === undefined) {
                updateErrorResponse.records = insertResponse.records;
              } else {
                updateErrorResponse.records = insertResponse.records
                  .concat(updateErrorResponse.records);
              }
              rootReject(updateErrorResponse);
            } else if (insertDone && insertErrorResponse !== undefined) {
              updateErrorResponse.errors = updateErrorResponse.errors
                .concat(insertErrorResponse.errors);
              rootReject(updateErrorResponse);
            }
          });
      }
      // }).catch((err) => {
      //   rootReject(err);
      // });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  };

  parallelUploadFiles = (options) => new Promise((rootResolve, rootReject) => {
    const id = options.containerId;
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < options.elementIds.length; i += 1) {
      let res: Promise<unknown>;
      const Frame = window.parent.frames[`${options.elementIds[i]}:${id}:${this.#context.logLevel}:${btoa(this.#clientDomain)}`];
      const inputElement = Frame.document
        .getElementById(options.elementIds[i]);
      if (inputElement) {
        if (
          inputElement.iFrameFormElement.fieldType
          === ELEMENTS.FILE_INPUT.name
        ) {
          res = this.uploadFiles(inputElement.iFrameFormElement);
          promises.push(res);
        }
      }
    }
    Promise.allSettled(
      promises,
    ).then((resultSet) => {
      const fileUploadResponse: Record<string, any>[] = [];
      const errorResponse: Record<string, any>[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value !== undefined && result.value !== null) {
            if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
              errorResponse.push(result.value);
            } else {
              fileUploadResponse.push(result.value);
            }
          }
        } else if (result.status === 'rejected') {
          errorResponse.push(result.reason);
        }
      });
      if (errorResponse.length === 0) {
        rootResolve({ fileUploadResponse });
      } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
      else rootReject({ fileUploadResponse, errorResponse });
    });
  });

  uploadFiles = (fileElement) => {
    if (!this.#client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const fileUploadObject: any = {};

    const {
      state, tableName, skyflowID, onFocusChange, preserveFileName,
    } = fileElement;

    if (state.isRequired) {
      onFocusChange(false);
    }
    try {
      fileValidation(state.value, state.isRequired, fileElement);
    } catch (err) {
      return Promise.reject(err);
    }

    const validatedFileState = fileValidation(state.value, state.isRequired, fileElement);

    if (!validatedFileState) {
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true));
    }
    fileUploadObject[state.name] = state.value;

    const formData = new FormData();

    const column = Object.keys(fileUploadObject)[0];

    const value: Blob = Object.values(fileUploadObject)[0] as Blob;

    if (preserveFileName) {
      const isValidFileName = vaildateFileName(state.value.name);
      if (!isValidFileName) {
        return Promise.reject(
          new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_NAME, [], true),
        );
      }
      formData.append(column, value);
    } else {
      const generatedFileName = generateUploadFileName(state.value.name);
      formData.append(column, new File([value], generatedFileName, { type: state.value.type }));
    }

    const client = this.#client;
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        client
          .request({
            body: formData,
            requestMethod: 'POST',
            url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${tableName}/${skyflowID}/files`,
            headers: {
              authorization: `Bearer ${authToken}`,
              'content-type': 'multipart/form-data',
            },
          })
          .then((response: any) => {
            rootResolve(constructUploadResponse(response));
          })
          .catch((error) => {
            rootReject(error);
          });
      }).catch((err) => {
        rootReject(err);
      });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => {
          reject(err);
        });
    });
  };
}
export default SkyflowFrameController;
