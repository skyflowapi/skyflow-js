/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB composable-collect controller-frame init: the shared @core base
// (validation, request-object assembly, DOM/grid build, message handling) plus the
// injected divergence — dispatchCollectRequest() (builds the privacyDB v1 insert
// record request, dispatches insert + update-by-skyflowID, aggregates records/errors)
// and the privacyDB-only file-upload surface: the two file-message hooks
// (handleMultiFileMessages / handleFileUploadRequest) and their upload machinery.
import Client from '@core/client';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import {
  COLLECT_TYPES, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS,
} from '@core/constants';
import SkyflowError from '@core/errors';
import IFrameFormElement from '@core/internal/iframe-form';
import { constructElementsInsertReq } from '@core/api-utils/collect';
import {
  CVVMap, ErrorType, MessageType,
} from '@core/types';
import CoreFrameElementInit from '@core/internal/frame-element-init';
import {
  fileValidation, generateUploadFileName, vaildateFileName,
} from '../utils/helpers';
import {
  constructInsertRecordRequest, insertDataInCollect,
  updateRecordsBySkyflowIDComposable,
} from '../api-utils/collect';
import { printLog } from '../utils/logs-helper';

export default class FrameElementInit extends CoreFrameElementInit {
  private static frameEle?: FrameElementInit;

  // privacyDB per-request client used by the file-upload machinery (independent of
  // the base's handshake client, which the request tails never read).
  #client!: Client;

  static startFrameElement = () => {
    FrameElementInit.frameEle = new FrameElementInit();
  };

  // eslint-disable-next-line class-methods-use-this
  protected dispatchCollectRequest(
    insertRequestObject: any,
    updateRequestObject: any,
    _cvvMap: CVVMap,
    options: any,
    clientConfig: any,
    errorMessages?: Record<ErrorType, string>,
  ): Promise<any> {
    let finalInsertRequest;
    let finalInsertRecords;
    let finalUpdateRecords;
    try {
      [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq(
        insertRequestObject, updateRequestObject, options,
      );
      finalInsertRequest = constructInsertRecordRequest(finalInsertRecords, options);
    } catch (error:any) {
      return Promise.reject({
        error: error?.message,
      });
    }
    const client = new Client(clientConfig, {
      uuid: '',
      clientDomain: '',
    });
    if (errorMessages && client) {
      client.setErrorMessages(errorMessages);
    }
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      const insertPromiseSet: Promise<any>[] = [];

      if (finalInsertRequest.length !== 0) {
        insertPromiseSet.push(
          insertDataInCollect(finalInsertRequest,
            client, options, finalInsertRecords, clientConfig.authToken as string),
        );
      }
      if (finalUpdateRecords.updateRecords.length !== 0) {
        insertPromiseSet.push(
          updateRecordsBySkyflowIDComposable(
            finalUpdateRecords, client, options, clientConfig.authToken as string,
          ),
        );
      }
      if (insertPromiseSet.length !== 0) {
        Promise.allSettled(insertPromiseSet).then((resultSet: any) => {
          const recordsResponse: any[] = [];
          const errorsResponse: any[] = [];

          resultSet.forEach((result:
          { status: string; value: any; reason?: any; }) => {
            if (result.status === 'fulfilled') {
              if (result.value.records !== undefined && Array.isArray(result.value.records)) {
                result.value.records.forEach((record) => {
                  recordsResponse.push(record);
                });
              }
              if (result.value.errors !== undefined && Array.isArray(result.value.errors)) {
                result.value.errors.forEach((error) => {
                  errorsResponse.push(error);
                });
              }
            } else {
              if (result.reason?.records !== undefined && Array.isArray(result.reason?.records)) {
                result.reason.records.forEach((record) => {
                  recordsResponse.push(record);
                });
              }
              if (result.reason?.errors !== undefined && Array.isArray(result.reason?.errors)) {
                result.reason.errors.forEach((error) => {
                  errorsResponse.push(error);
                });
              }
            }
          });
          if (errorsResponse.length === 0) {
            rootResolve({ records: recordsResponse });
          } else if (recordsResponse.length === 0) rootReject({ errors: errorsResponse });
          else rootReject({ records: recordsResponse, errors: errorsResponse });
        });
      }
    });

    return sendRequest();
  }

  // privacyDB per-element multi-file upload messages (MULTIPLE_UPLOAD_FILES).
  protected handleMultiFileMessages(event: MessageEvent): void {
    this.iframeFormList.forEach((inputElement) => {
      if (inputElement) {
        if (inputElement.fieldType
        === ELEMENTS.MULTI_FILE_INPUT.name) {
          if (event?.data && event?.data?.name === `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${inputElement.iFrameName}`) {
            this.#client = Client.fromJSON(event?.data?.clientConfig);
            this.multipleUploadFiles(inputElement, event?.data?.clientConfig,
              event?.data?.options, event?.data?.errorMessages)
              ?.then((response: any) => {
                window?.parent.postMessage({
                  type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${inputElement.iFrameName}`,
                  data: response,
                }, this.clientMetaData?.clientDomain);
              }).catch((error) => {
                window?.parent.postMessage({
                  type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${inputElement.iFrameName}`,
                  data: error,
                }, this.clientMetaData?.clientDomain);
              });
          }
        }
      }
    });
  }

  // privacyDB bulk file-upload request (COLLECT_TYPES.FILE_UPLOAD).
  protected handleFileUploadRequest(event: MessageEvent): void {
    if (event?.data?.data && event?.data?.data?.type === COLLECT_TYPES.FILE_UPLOAD) {
      this.parallelUploadFiles(event.data.data,
        event.data.clientConfig, event?.data?.errorMessages)
        .then((response: any) => {
          window?.parent.postMessage({
            type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + this.containerId,
            data: response,
          }, this.clientMetaData?.clientDomain);
        })
        .catch((error) => {
          window?.parent.postMessage({
            type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + this.containerId,
            data: error,
          }, this.clientMetaData?.clientDomain);
        });
    }
  }

  private parallelUploadFiles = (options, config,
    errorMessages?: Record<ErrorType, string>) => new Promise((rootResolve, rootReject) => {
    const promises: Promise<unknown>[] = [];
    this.iframeFormList.forEach((inputElement) => {
      let res: Promise<unknown>;
      if (inputElement) {
        if (
          inputElement.fieldType
          === ELEMENTS.FILE_INPUT.name
        ) {
          res = this.uploadFiles(inputElement, config, errorMessages);
          promises.push(res);
        }
      }
    });
    if (promises.length === 0) {
      rootReject(new SkyflowError(SKYFLOW_ERROR_CODE.NO_FILE_ELEMENT_FOUND, [], true));
    }
    Promise.allSettled(
      promises,
    ).then((resultSet) => {
      const fileUploadResponse: any[] = [];
      const errorResponse: any[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value !== undefined && result.value !== null) {
            if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
              errorResponse.push(result.value);
            } else {
              const response = typeof result.value === 'string'
                ? JSON.parse(result.value)
                : result.value;
              fileUploadResponse.push(response);
            }
          }
        } else if (result.status === 'rejected') {
          if (result.reason?.error) {
            errorResponse.push({ error: result.reason?.error });
          } else {
            errorResponse.push(result.reason);
          }
        }
      });
      if (errorResponse.length === 0) {
        rootResolve({ fileUploadResponse });
      } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
      else rootReject({ fileUploadResponse, errorResponse });
    });
  });

  uploadFiles = (fileElement, clientConfig, errorMessages?: Record<ErrorType, string>) => {
    this.#client = new Client(clientConfig, {
      uuid: '',
      clientDomain: '',
    });
    if (errorMessages && this.#client) {
      this.#client.setErrorMessages(errorMessages);
    }
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

    formData.append('columnName', column);
    formData.append('tableName', tableName);

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

    const client = this.#client;
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      client
        .request({
          body: formData,
          requestMethod: 'POST',
          url: `${client.config.vaultURL}/v2/vaults/${client.config.vaultID}/files/upload`,
          headers: {
            authorization: `Bearer ${clientConfig.authToken}`,
            'content-type': 'multipart/form-data',
          },
        })
        .then((response: any) => {
          rootResolve(response);
        })
        .catch((error) => {
          if (error?.error) {
            rootReject({
              error: {
                code: error?.error?.code,
                description: error?.error?.description,
                type: error?.error?.type,
              },
            });
          }
          rootReject(error);
        });
    });

    return sendRequest();
  };

  // eslint-disable-next-line consistent-return
  private multipleUploadFiles =
  (fileElement: IFrameFormElement,
    clientConfig, metaData,
    errorMessages?: Record<ErrorType, string>) => new Promise((rootResolve, rootReject) => {
    this.#client = new Client(clientConfig, {
      uuid: '',
      clientDomain: '',
    });
    if (errorMessages && this.#client) {
      this.#client.setErrorMessages(errorMessages);
    }
    if (!this.#client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);

    const {
      state, tableName, onFocusChange, preserveFileName,
    } = fileElement;
    if (state.isRequired) {
      onFocusChange(false);
    }

    if (state.value === undefined || state.value === null || state.value === '') {
      rootReject({ error: 'No files selected' });
      return;
    }

    const files = state.value instanceof FileList ? Array.from(state.value) : [state.value];
    try {
      this.validateFiles(files, state, fileElement);
    } catch (err: any) {
      rootReject({ errorResponse: [{ error: err?.error || err?.errors?.[0] || err }] });
      return;
    }

    const uploadFile = (file: File, skyflowID?: string) => {
      const formData = new FormData();
      formData.append('columnName', state.name);
      if (tableName) formData.append('tableName', tableName);
      if (preserveFileName) {
        formData.append('file', file);
      } else {
        const generatedFileName = generateUploadFileName(file.name);
        formData.append('file', new File([file], generatedFileName, { type: file.type }));
      }
      if (skyflowID) formData.append('skyflowID', skyflowID);
      const client = this.#client;
      return this.#client.request({
        body: formData,
        requestMethod: 'POST',
        url: `${client.config.vaultURL}/v2/vaults/${this.#client.config.vaultID}/files/upload`,
        headers: {
          authorization: `Bearer ${clientConfig.authToken}`,
          'content-type': 'multipart/form-data',
        },
      });
    };

    if (metaData && Object.keys(metaData).length > 0) {
      const insertRequest = this.createInsertRequest(files.length, metaData);
      this.insertDataCallInMultiFiles(
        insertRequest, this.#client, tableName as string, clientConfig.authToken as string,
      ).then((response: any) => {
        const skyflowIDs = this.extractSkyflowIDs(response);
        if (skyflowIDs.length === 0) {
          rootReject({ error: 'No skyflow IDs returned from insert data' });
          return;
        }
        const promises = files.map((file, idx) => uploadFile(file, skyflowIDs[idx]));
        Promise.allSettled(promises).then((resultSet) => {
          const fileUploadResponse: any[] = [];
          const errorResponse: any[] = [];
          resultSet.forEach((result) => {
            if (result.status === 'fulfilled') {
              if (result.value !== undefined && result.value !== null) {
                if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
                  errorResponse.push(result.value);
                } else {
                  const response1 = typeof result.value === 'string'
                    ? JSON.parse(result.value)
                    : result.value;
                  fileUploadResponse.push(response1);
                }
              }
            } else if (result.status === 'rejected') {
              if (result?.reason?.error) {
                errorResponse.push({ error: result?.reason?.error });
              } else {
                errorResponse.push({ error: result.reason });
              }
            }
          });
          if (errorResponse.length === 0) {
            rootResolve({ fileUploadResponse });
          } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
          else rootReject({ fileUploadResponse, errorResponse });
        });
      }).catch((error) => {
        printLog(`${error}`, MessageType.LOG, this.context?.logLevel);
        rootReject({
          error: error?.error || error,
        });
      });
    } else {
      const promises = files.map((file) => uploadFile(file));
      Promise.allSettled(promises).then((resultSet) => {
        const fileUploadResponse: any[] = [];
        const errorResponse: any[] = [];
        resultSet.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value !== undefined && result.value !== null) {
              if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
                errorResponse.push(result.value);
              } else {
                const response1 = typeof result.value === 'string'
                  ? JSON.parse(result.value)
                  : result.value;
                fileUploadResponse.push(response1);
              }
            }
          } else if (result.status === 'rejected') {
            if (result?.reason?.error) {
              errorResponse.push({ error: result?.reason?.error });
            } else {
              errorResponse.push({ error: result.reason });
            }
          }
        });
        if (errorResponse.length === 0) {
          rootResolve({ fileUploadResponse });
        } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
        else rootReject({ fileUploadResponse, errorResponse });
      });
    }
  });

  private validateFiles = (files: File[], state: any, fileElement: IFrameFormElement) => {
    if (files.length > fileElement.maxFileCount) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.FILE_COUNT_EXCEEDED,
        [String(fileElement.maxFileCount)],
        true,
      );
    }
    files.forEach((file) => {
      const validatedFileState = fileValidation(file, state.isRequired, fileElement);
      if (!validatedFileState) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true);
      }

      const isValidFileName = vaildateFileName(file.name);
      if (!isValidFileName) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_NAME, [], true);
      }
    });
    return true;
  };

  // eslint-disable-next-line class-methods-use-this
  private createInsertRequest = (numberOfRequests: number, options = {}) => {
  // Create basic request structure
    const request = {
      records: [] as Array<{ fields: Record<string, any> }>,
      tokenization: false,
    };

    // Add empty field objects based on number of requests
    for (let i = 0; i < numberOfRequests; i += 1) {
      request.records.push({
        fields: options === undefined ? {} : options,
      });
    }

    return request;
  };

  // eslint-disable-next-line class-methods-use-this
  private extractSkyflowIDs = (response: { records: Array<{ skyflow_id: string }> }): string[] => {
    if (!response?.records || !Array.isArray(response.records)) {
      return [];
    }

    return response.records
      .map((record) => record.skyflow_id)
      .filter((id) => id !== undefined && id !== null);
  };

  private insertDataCallInMultiFiles = (
    insertRequest,
    client: Client,
    tableName: string,
    authToken: string,
  ) => new Promise((rootResolve, rootReject) => {
    client
      .request({
        body: JSON.stringify(insertRequest),
        requestMethod: 'POST',
        url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${tableName}`,
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
      })
      .then((response: any) => {
        // Extract skyflow IDs from response
        const skyflowIDs = this.extractSkyflowIDs(response);
        rootResolve({
          ...response,
          skyflowIDs, // Add extracted IDs to response
        });
      })
      .catch((error) => {
        if (error?.error) {
          rootReject({
            error: {
              code: error?.error?.code,
              description: error?.error?.description,
              type: error?.error?.type,
            },
          });
        } else {
          rootReject(error);
        }
      });
  });
}
