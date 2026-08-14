/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB skyflow-frame controller. Extends the shared @core base
// (CoreSkyflowFrameController) and supplies only the privacyDB divergence:
//   - registerDataAccessListeners(): the pure-JS channel
//     (DETOKENIZE/INSERT/UPDATE/GET/GET_BY_SKYFLOWID/DELETE) + PUREJS_FRAME_READY
//   - handleExtraCollectRequest(): file upload (COLLECT_TYPES.FILE_UPLOAD)
//   - handleExtraRevealRequest(): file render (REVEAL_TYPES.RENDER_FILE)
//   - sendCollectRequest(): the v1 insert + updateBySkyflowID send path
//   - fetchRevealRecords()/formatRevealForClient(): the privacyDB reveal path
//   - getSdkNameAndVersion()/wrapCallbackError(): telemetry + error-envelope
// The common bus topology, handshake and tokenize()/revealData() skeleton live
// in the @core base.
import bus from 'framebus';
import { getAccessToken } from '@core/utils/bus-events';
import {
  COLLECT_TYPES,
  DEFAULT_FILE_RENDER_ERROR,
  ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, PUREJS_TYPES, REVEAL_TYPES,
} from '@core/constants';
import logs from '@core/utils/logs';
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { constructElementsInsertReq } from '@core/api-utils/collect';
import { ICollectedElementsData } from '@core/internal/skyflow-frame/collect-elements';
import CoreSkyflowFrameController from '@core/internal/skyflow-frame/skyflow-frame-controller-base';
import { injectCoralogixTrackingScript } from '@core/helpers';
import SkyflowError from '@core/errors';
import IFrameFormElement from '@core/internal/iframe-form';
import { SdkInfo } from '@core/client';
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
  constructUpdateRecordRequest,
  constructUpdateRecordResponse,
  constructUploadResponse,
  updateRecordsBySkyflowID,
} from '../../api-utils/collect';
import {
  fetchRecordsGET,
  fetchRecordsByTokenId,
  fetchRecordsBySkyflowID,
  getFileURLFromVaultBySkyflowID,
  formatRecordsForClient,
} from '../../api-utils/reveal';
import { printLog, parameterizedString } from '../../utils/logs-helper';
import {
  IRevealRecord,
  IGetRecord,
  MessageType,
  ISkyflowIdRecord,
  IGetOptions,
  IInsertRecordInput,
  IInsertOptions,
  UploadFilesResponse,
  RevealResponse,
  InsertResponse,
  CollectResponse,
  IRevealResponseType,
  GetResponse,
  GetByIdResponse,
  IDeleteResponseType,
  IDeleteRecordInput,
  IRenderResponseType,
  IUpdateRequest,
  UpdateResponse,
  IUpdateOptions,
} from '../../utils/common';
import { deleteData } from '../../api-utils/delete';
import {
  fileValidation, generateUploadFileName, getSDKNameAndVersion, vaildateFileName,
} from '../../utils/helpers';
import {
  BatchInsertRequestBody, TokenizeDataInput, UploadFileDataInput,
} from '../internal-types';

const CLASS_NAME = 'SkyflowFrameController';
class SkyflowFrameController
  extends CoreSkyflowFrameController<TokenizeDataInput, CollectResponse, RevealResponse> {
  static init(clientId: string): SkyflowFrameController {
    injectCoralogixTrackingScript();
    return new SkyflowFrameController(clientId);
  }

  // privacyDB telemetry identity (deliberate loose-coupling duplication: each
  // package owns its telemetry helper).
  // eslint-disable-next-line class-methods-use-this
  protected getSdkNameAndVersion(metaData?: string): SdkInfo {
    return getSDKNameAndVersion(metaData);
  }

  // privacyDB error envelope for collect/reveal callbacks.
  // eslint-disable-next-line class-methods-use-this
  protected wrapCallbackError(error: any): any {
    return { error };
  }

  protected fetchRevealRecords(revealRecords: IRevealRecord[]): Promise<any> {
    return fetchRecordsByTokenId(revealRecords, this.client, false);
  }

  // eslint-disable-next-line class-methods-use-this
  protected formatRevealForClient(result: any): RevealResponse {
    return formatRecordsForClient(result);
  }

  // privacyDB pure-JS data channel: DETOKENIZE/INSERT/UPDATE/GET/GET_BY_SKYFLOWID/
  // DELETE, plus the PUREJS_FRAME_READY handshake. flowDB is elements-only and
  // does not register this channel.
  protected registerDataAccessListeners(): void {
    bus
      .target(this.clientDomain)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.clientId,
        (data, callback) => {
          printLog(
            parameterizedString(
              logs.infoLogs.CAPTURE_PURE_JS_REQUEST,
              CLASS_NAME,
              data.type,
            ),
            MessageType.LOG,
            this.context.logLevel,
          );

          if (data.type === PUREJS_TYPES.DETOKENIZE) {
            fetchRecordsByTokenId(
              data.records as IRevealRecord[],
              this.client,
              true,
            ).then(
              (resolvedResult: IRevealResponseType) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.FETCH_RECORDS_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.context.logLevel,
                );
                callback(resolvedResult);
              },
              (rejectedResult: IRevealResponseType) => {
                printLog(
                  parameterizedString(logs.errorLogs.FETCH_RECORDS_REJECTED),
                  MessageType.ERROR,
                  this.context.logLevel,
                );

                callback({ error: rejectedResult });
              },
            );
          } else if (data.type === PUREJS_TYPES.INSERT) {
            this.insertData(data.records as IInsertRecordInput, data.options as IInsertOptions)
              .then((result: InsertResponse) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.INSERT_RECORDS_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.context.logLevel,
                );
                callback(result);
              })
              .catch((error: InsertResponse) => {
                printLog(
                  parameterizedString(logs.errorLogs.INSERT_RECORDS_REJECTED),
                  MessageType.ERROR,
                  this.context.logLevel,
                );
                callback({ error });
              });
          } else if (data.type === PUREJS_TYPES.UPDATE) {
            this.updateData(data.record as IUpdateRequest, data.options as IUpdateOptions)
              .then((result: any) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.UPDATE_RECORD_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.context.logLevel,
                );
                callback(result);
              })
              .catch((error: any) => {
                printLog(
                  parameterizedString(logs.errorLogs.UPDATE_RECORD_REJECTED),
                  MessageType.ERROR,
                  this.context.logLevel,
                );
                callback({ error });
              });
          } else if (data.type === PUREJS_TYPES.GET) {
            fetchRecordsGET(
              data.records as IGetRecord[], this.client, data.options as IGetOptions,
            ).then(
              (resolvedResult: GetResponse) => {
                printLog(
                  parameterizedString(logs.infoLogs.GET_RESOLVED, CLASS_NAME),
                  MessageType.LOG,
                  this.context.logLevel,
                );

                callback(resolvedResult);
              },
              (rejectedResult: GetResponse) => {
                printLog(parameterizedString(
                  logs.errorLogs.GET_REJECTED,
                ),
                MessageType.ERROR,
                this.context.logLevel);

                callback({ error: rejectedResult });
              },
            );
          } else if (data.type === PUREJS_TYPES.GET_BY_SKYFLOWID) {
            fetchRecordsBySkyflowID(
              data.records as ISkyflowIdRecord[],
              this.client,
            ).then(
              (resolvedResult: GetByIdResponse) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.GET_BY_SKYFLOWID_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.context.logLevel,
                );

                callback(resolvedResult);
              },
              (rejectedResult: GetByIdResponse) => {
                printLog(
                  parameterizedString(logs.errorLogs.GET_BY_SKYFLOWID_REJECTED),
                  MessageType.ERROR,
                  this.context.logLevel,
                );

                callback({ error: rejectedResult });
              },
            );
          } else if (data.type === PUREJS_TYPES.DELETE) {
            deleteData(
              data.records as IDeleteRecordInput,
              data.options || {},
              this.client,
            ).then(
              (resolvedResult: IDeleteResponseType) => {
                printLog(
                  parameterizedString(
                    logs.infoLogs.DELETE_RESOLVED,
                    CLASS_NAME,
                  ),
                  MessageType.LOG,
                  this.context.logLevel,
                );

                callback(resolvedResult);
              },
            ).catch((rejectedResult: IDeleteResponseType) => {
              printLog(
                parameterizedString(
                  logs.errorLogs.DELETE_RECORDS_REJECTED,
                ),
                MessageType.ERROR,
                this.context.logLevel,
              );

              callback({ error: rejectedResult });
            });
          }
        },
      );
  }

  // privacyDB-only collect extra: file upload.
  protected handleExtraCollectRequest(data: any, callback: (response: any) => void): void {
    if (data.type === COLLECT_TYPES.FILE_UPLOAD) {
      printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
      MessageType.LOG, this.context.logLevel);
      const uploadFilesDataInput = {
        ...data,
        type: data.type,
        elementIds: data.elementIds as string[],
        containerId: data.containerId as string,
      };
      this.parallelUploadFiles(uploadFilesDataInput)
        .then((response: UploadFilesResponse) => {
          callback(response);
        })
        .catch((error: UploadFilesResponse) => {
          callback({ error });
        });
    }
  }

  // privacyDB-only reveal extra: file render.
  protected handleExtraRevealRequest(data: any, callback: (response: any) => void): void {
    if (data.type === REVEAL_TYPES.RENDER_FILE) {
      printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
      MessageType.LOG, this.context.logLevel);
      this.renderFile(data.records as IRevealRecord, data.iframeName as string).then(
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
  }

  insertData(records: IInsertRecordInput, options: IInsertOptions): Promise<InsertResponse> {
    const requestBody: Array<BatchInsertRequestBody> = constructInsertRecordRequest(
      records, options,
    );
    return new Promise((rootResolve, rootReject) => {
      getAccessToken(this.clientId).then((authToken) => {
        this.client
          .request({
            body: JSON.stringify({ records: requestBody }),
            requestMethod: 'POST',
            url:
            `${this.client.config.vaultURL}/v1/vaults/${
              this.client.config.vaultID}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },

          })
          .then((response: any) => {
            rootResolve(
              constructInsertRecordResponse(
                response,
                options?.tokens ?? true,
                records?.records,
              ),
            );
          })
          .catch((error) => {
            if (error?.error?.type) {
              error = {
                error: {
                  code: error?.error?.code,
                  description: error?.error?.description,
                },
              };
            }
            rootReject(error);
          });
      }).catch((err) => {
        rootReject(err);
      });
    });
  }

  updateData(updateData: IUpdateRequest, options?: IUpdateOptions): Promise<UpdateResponse> {
    const requestBody = constructUpdateRecordRequest(
      updateData, options,
    );
    return new Promise((rootResolve, rootReject) => {
      getAccessToken(this.clientId).then((authToken) => {
        const { table, skyflowID } = updateData;
        this.client
          .request({
            body: JSON.stringify(requestBody),
            requestMethod: 'PUT',
            url: `${this.client.config.vaultURL}/v1/vaults/${this.client.config.vaultID}/${table}/${skyflowID}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
              'content-type': 'application/json',
            },
          })
          .then((response: any) => {
            rootResolve(
              constructUpdateRecordResponse(response, options?.tokens ?? false),
            );
          })
          .catch((error: any) => {
            rootReject(error);
          });
      }).catch((err) => {
        rootReject(err);
      });
    });
  }

  renderFile(data: IRevealRecord, iframeName: string): Promise<IRenderResponseType> {
    return new Promise((resolve, reject) => {
      try {
        getFileURLFromVaultBySkyflowID(data, this.client)
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

  // privacyDB collect send path: v1 batch insert + updateBySkyflowID, merging the
  // insert/update responses (and their errors) into one collect response.
  protected sendCollectRequest(
    built: ICollectedElementsData,
    options: TokenizeDataInput,
  ): Promise<CollectResponse> {
    const { insertResponseObject, updateResponseObject } = built;
    let finalInsertRequest: Array<BatchInsertRequestBody>;
    let finalInsertRecords;
    let finalUpdateRecords;
    let insertResponse: InsertResponse;
    let updateResponse: InsertResponse;
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
    const client = this.client;
    const sendRequest = (): Promise<InsertResponse> => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        if (finalInsertRequest.length !== 0) {
          client
            .request({
              body: JSON.stringify({ records: finalInsertRequest }),
              requestMethod: 'POST',
              url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}`,
              headers: {
                authorization: `Bearer ${authToken}`,
                'content-type': 'application/json',
              },
            })
            .then((response: any) => {
              insertResponse = constructInsertRecordResponse(
                response,
                options.tokens ?? true,
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
                  updateErrorResponse.records = (insertResponse.records || [])
                    .concat(updateErrorResponse.records);
                }
                rootReject(updateErrorResponse);
              } else if (updateDone && updateResponse !== undefined) {
                rootResolve(
                  { records: (insertResponse.records || []).concat(updateResponse.records || []) },
                );
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
                        type: error?.error?.type,
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
                rootResolve(
                  { records: (insertResponse.records || []).concat(updateResponse.records || []) },
                );
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
                  updateErrorResponse.records = (insertResponse.records || [])
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
      }).catch((err) => {
        rootReject(err);
      });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  parallelUploadFiles = (options: UploadFileDataInput):
  Promise<UploadFilesResponse> => new Promise((rootResolve, rootReject) => {
    const id = options.containerId;
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < options.elementIds.length; i += 1) {
      let res: Promise<unknown>;
      const Frame = window.parent.frames[`${options.elementIds[i]}:${id}:${this.context.logLevel}:${btoa(this.clientDomain)}`];
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

  uploadFiles = (fileElement: IFrameFormElement) => {
    if (!this.client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
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

    formData.append('columnName', column);
    formData.append('tableName', tableName ?? '');

    if (preserveFileName) {
      const isValidFileName = vaildateFileName(state.value.name);
      if (!isValidFileName) {
        return Promise.reject(
          new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_NAME, [], true),
        );
      }
      formData.append('file', value);
    } else {
      const generatedFileName = generateUploadFileName(state.value.name);
      formData.append('file', new File([value], generatedFileName, { type: state.value.type }));
    }

    if (skyflowID) {
      formData.append('skyflowID', skyflowID);
    }

    const client = this.client;
    const sendRequest = ():
    Promise<UploadFilesResponse> => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        client
          .request({
            body: formData,
            requestMethod: 'POST',
            url: `${client.config.vaultURL}/v2/vaults/${client.config.vaultID}/files/upload`,
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
