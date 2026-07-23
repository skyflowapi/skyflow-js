/* eslint-disable no-console */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Client from '../client';
import { getAccessToken } from '../utils/bus-events';
import SkyflowError from '../libs/skyflow-error';
import {
  IRevealRecord, IRevealResponseType, MessageType, LogLevel, IGetRecord, ISkyflowIdRecord,
  RedactionType,
  IRenderResponseType,
  IGetOptions,
  RenderFileResponse,
  RevealResponse,
  GetResponse,
  GetResponseRecord,
  GetByIdResponse,
  GetByIdResponseRecord,
  IRevealRecordComposable,
  RevealResponseFlowDB,
} from '../utils/common';
import { printLog } from '../utils/logs-helper';
import { FILE_DOWNLOAD_URL_PARAM } from '../core/constants';
import {
  FlowDBDetokenizeRequestBody,
  FlowDBDetokenizeResponseBody,
  FlowDBDetokenizeResponse,
  FlowDBDetokenizeRequestError,
} from '../core/internal/internal-types';

interface IApiSuccessResponse {
  records: [
    {
      token: string;
      valueType:string;
      value:string;
    },
  ];
}

const formatForPureJsSuccess = (response: IApiSuccessResponse) => {
  const currentResponseRecords = response.records;
  return currentResponseRecords.map((record) => (
    { token: record.token, value: record.value, valueType: record.valueType }));
};

const formatForPureJsFailure = (cause, tokenId:string, purejs: boolean) => {
  if (purejs) {
    return {
      token: tokenId,
      error: {
        code: cause?.error?.code,
        description: cause?.error?.description,
      },
    };
  }
  return ({
    token: tokenId,
    ...new SkyflowError({
      code: cause?.error?.code,
      description: cause?.error?.description,
      type: cause?.error?.type,
    }, [], true),
  });
};

const formatForRenderFileFailure = (cause, skyflowID:string, column: string) => ({
  skyflowId: skyflowID,
  column,
  error: {
    code: cause?.error?.code,
    description: cause?.error?.description,
    type: cause?.error?.type,
  },
});

const getRecordsFromVault = (
  skyflowIdRecord: IGetRecord,
  client: Client,
  authToken:string,
  options?: IGetOptions,
): Promise<GetResponse> => {
  let paramList: string = '';

  skyflowIdRecord.ids?.forEach((skyflowId) => {
    paramList += `skyflow_ids=${skyflowId}&`;
  });

  skyflowIdRecord.columnValues?.forEach((column, index) => {
    paramList += `${(index === 0) ? `column_name=${skyflowIdRecord.columnName}&` : ''}column_values=${column}&`;
  });

  if (options && Object.prototype.hasOwnProperty.call(options, 'tokens')) {
    paramList += `tokenization=${options.tokens}&`;
  }

  if (skyflowIdRecord?.redaction) {
    paramList += `redaction=${skyflowIdRecord.redaction}`;
  }

  const vault = client.config.vaultURL;
  const vaultEndPointurl: string = `${vault}/v1/vaults/${client.config.vaultID}/${skyflowIdRecord.table}?${paramList}`;

  return client.request({
    requestMethod: 'GET',
    url: vaultEndPointurl,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  }) as Promise<GetResponse>;
};
const getSkyflowIdRecordsFromVault = (
  skyflowIdRecord: ISkyflowIdRecord,
  client: Client,
  authToken:string,
): Promise<GetByIdResponse> => {
  let paramList: string = '';

  skyflowIdRecord.ids.forEach((skyflowId) => {
    paramList += `skyflow_ids=${skyflowId}&`;
  });

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${skyflowIdRecord.table}?${paramList}redaction=${skyflowIdRecord.redaction}`;

  return client.request({
    requestMethod: 'GET',
    url: vaultEndPointurl,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  }) as Promise<GetByIdResponse>;
};
const getTokenRecordsFromVault = (
  token:string,
  redaction: RedactionType,
  client: Client,
  authToken:string,
): Promise<any> => {
  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/detokenize`;
  return client.request({
    requestMethod: 'POST',
    url: vaultEndPointurl,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
    body:
      JSON.stringify({
        detokenizationParameters: [
          {
            token,
            redaction,
          },
        ],
      }),
  });
};

export const constructFlowDBDetokenizeRequest = (
  tokenIdRecords: IRevealRecord[] | IRevealRecordComposable[],
  vaultID: string | undefined,
  options?: Record<string, any>,
): FlowDBDetokenizeRequestBody => {
  const tokens = tokenIdRecords.map((record) => record.token as string);

  const explicit = options?.tokenGroupRedactions;
  let tokenGroupRedactions;
  if (Array.isArray(explicit) && explicit.length > 0) {
    tokenGroupRedactions = explicit;
  } else {
    const fromElements = tokenIdRecords
      .filter((record: any) => record?.tokenGroupName && record?.redaction)
      .map((record: any) => ({
        tokenGroupName: record.tokenGroupName,
        redaction: record.redaction,
      }));
    if (fromElements.length > 0) {
      tokenGroupRedactions = fromElements;
    }
  }

  return {
    vaultID,
    tokens,
    ...(tokenGroupRedactions ? { tokenGroupRedactions } : {}),
  };
};

export const constructFlowDBDetokenizeResponse = (
  responseBody: FlowDBDetokenizeResponseBody,
): FlowDBDetokenizeResponse => {
  const records: FlowDBDetokenizeResponse['records'] = [];
  const errors: FlowDBDetokenizeResponse['errors'] = [];
  (responseBody?.response || []).forEach((res) => {
    if (res.error) {
      errors.push({
        token: res.token,
        error: { code: res.httpCode, description: res.error },
      });
      return;
    }
    const hasMetadata = res.metadata && Object.keys(res.metadata).length > 0;
    records.push({
      token: res.token,
      value: res.value,
      ...(res.tokenGroupName ? { tokenGroupName: res.tokenGroupName } : {}),
      ...(hasMetadata ? { metadata: res.metadata } : {}),
    });
  });
  return { records, errors };
};

export const constructFlowDBDetokenizeError = (
  error: any,
): FlowDBDetokenizeRequestError => ({
  errors: [
    {
      token: '',
      error: {
        code: error?.error?.code,
        description: error?.error?.description,
      },
    },
  ],
});

interface IDetokenizeVariant {
  buildRequest(
    client: Client,
    tokenIdRecords: IRevealRecord[] | IRevealRecordComposable[],
    options: Record<string, any> | undefined,
    authToken: string,
  ): Promise<any> | undefined;
  parseSuccess(response: any): FlowDBDetokenizeResponse;
  parseError(error: any): FlowDBDetokenizeRequestError;
}

const flowDBDetokenizeVariant: IDetokenizeVariant = {
  buildRequest: (client, tokenIdRecords, options, authToken) => client?.request({
    body: JSON.stringify(
      constructFlowDBDetokenizeRequest(tokenIdRecords, client.config.vaultID, options),
    ),
    requestMethod: 'POST',
    url: `${client.config.vaultURL}/v2/tokens/detokenize`,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  }),
  parseSuccess: (response) => constructFlowDBDetokenizeResponse(response),
  parseError: (error) => constructFlowDBDetokenizeError(error),
};

const executeDetokenize = (
  variant: IDetokenizeVariant,
  tokenIdRecords: IRevealRecord[] | IRevealRecordComposable[],
  client: Client,
  options: Record<string, any> | undefined,
  authToken: string,
): Promise<FlowDBDetokenizeResponse | FlowDBDetokenizeRequestError> => new Promise((resolve) => {
  try {
    variant.buildRequest(client, tokenIdRecords, options, authToken)
      ?.then((response: any) => {
        resolve(variant.parseSuccess(response));
      })
      ?.catch((error: any) => {
        resolve(variant.parseError(error));
      });
  } catch (error) {
    resolve(variant.parseError(error));
  }
});

export const getFileURLForRender = (
  skyflowIdRecord: IRevealRecord,
  client: Client,
  authToken: string,
): Promise<any> => {
  let paramList: string = '';

  paramList += `${skyflowIdRecord.skyflowID}?`;

  paramList += `fields=${skyflowIdRecord.column}&${FILE_DOWNLOAD_URL_PARAM}&returnFileMetadata=true`;

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${skyflowIdRecord.table}/${paramList}`;
  return client.request({
    requestMethod: 'GET',
    url: vaultEndPointurl,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  });
};

export const getFileURLFromVaultBySkyflowID = (
  skyflowIdRecord: IRevealRecord,
  client: Client,
): Promise<IRenderResponseType> => new Promise((rootResolve, rootReject) => {
  try {
    const clientId = client.toJSON().metaData.uuid || '';
    getAccessToken(clientId).then((authToken) => {
      getFileURLForRender(
        skyflowIdRecord, client, authToken as string,
      ).then((resolvedResult: IRenderResponseType) => {
        rootResolve(resolvedResult);
      }).catch((err: any) => {
        const errorData = formatForRenderFileFailure(err, skyflowIdRecord.skyflowID as string,
          skyflowIdRecord.column as string);
        printLog(errorData.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
        rootReject(errorData);
      });
    }).catch((err) => {
      rootReject(err);
    });
  } catch (err) {
    rootReject(err);
  }
});

export const getFileURLFromVaultBySkyflowIDComposable = (
  skyflowIdRecord: IRevealRecord,
  client: Client,
  authToken: string,
): Promise<IRenderResponseType> => new Promise((rootResolve, rootReject) => {
  try {
    getFileURLForRender(
      skyflowIdRecord, client, authToken as string,
    ).then((resolvedResult: IRenderResponseType) => {
      rootResolve(resolvedResult);
    }).catch((err: any) => {
      const errorData = formatForRenderFileFailure(err, skyflowIdRecord.skyflowID as string,
        skyflowIdRecord.column as string);
      printLog(errorData.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
      rootReject(errorData);
    });
  } catch (err) {
    rootReject(err);
  }
});
export const fetchRecordsByTokenId = (
  tokenIdRecords: IRevealRecord[],
  client: Client,
  purejs: boolean,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    const vaultResponseSet: Promise<any>[] = tokenIdRecords.map(
      (tokenRecord) => new Promise((resolve) => {
        const apiResponse: any = [];
        const redaction: RedactionType = tokenRecord.redaction ? tokenRecord.redaction
          : RedactionType.PLAIN_TEXT;
        // eslint-disable-next-line max-len
        getTokenRecordsFromVault(tokenRecord.token as string, redaction, client, authToken as string)
          .then(
            (response: IApiSuccessResponse) => {
              const fieldsData = formatForPureJsSuccess(response);
              const fieldsDataWithRedaction = purejs
                ? fieldsData
                : fieldsData.map((field) => ({
                  ...field,
                  redaction,
                }));
              apiResponse.push(...fieldsDataWithRedaction);
            },
            (cause: any) => {
              const errorData = formatForPureJsFailure(cause, tokenRecord.token as string, purejs);
              printLog(errorData.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
              apiResponse.push(errorData);
            },
          )
          .finally(() => {
            resolve(apiResponse);
          });
      }),
    );

    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      const recordsResponse: Record<string, any>[] = [];
      const errorResponse: Record<string, any>[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          result.value.forEach((res: Record<string, any>) => {
            if (Object.prototype.hasOwnProperty.call(res, 'error')) {
              errorResponse.push(res);
            } else {
              recordsResponse.push(res);
            }
          });
        }
      });
      if (errorResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) rootReject({ errors: errorResponse });
      else rootReject({ records: recordsResponse, errors: errorResponse });
    });
  }).catch((err) => {
    rootReject(err);
  });
});

export const fetchRecordsByTokenIdComposable = (
  tokenIdRecords: IRevealRecordComposable[],
  client: Client,
  authToken: string,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const vaultResponseSet: Promise<any>[] = tokenIdRecords?.map(
    (tokenRecord) => new Promise((resolve) => {
      const apiResponse: any = [];
      const redaction: RedactionType = tokenRecord?.redaction ?? RedactionType.PLAIN_TEXT;

      getTokenRecordsFromVault(tokenRecord?.token ?? '', redaction, client, authToken)
        ?.then(
          (response: IApiSuccessResponse) => {
            const fieldsData = formatForPureJsSuccess(response);
            apiResponse?.push({
              ...fieldsData,
              frameId: tokenRecord?.iframeName ?? '',
            });
          },
          (cause: any) => {
            const errorData = formatForPureJsFailure(cause, tokenRecord?.token ?? '', false);
            printLog(errorData?.error?.description ?? '', MessageType.ERROR, LogLevel.ERROR);
            apiResponse?.push({
              ...errorData,
              frameId: tokenRecord?.iframeName ?? '',
            });
          },
        )
        ?.finally(() => {
          resolve(apiResponse);
        });
    }),
  );

  Promise.allSettled(vaultResponseSet)?.then((resultSet) => {
    const recordsResponse: Record<string, any>[] = [];
    const errorResponse: Record<string, any>[] = [];
    resultSet?.forEach((result) => {
      if (result?.status === 'fulfilled') {
        result?.value?.forEach((res: Record<string, any>) => {
          if (Object.prototype.hasOwnProperty.call(res, 'error')) {
            errorResponse?.push(res);
          } else {
            recordsResponse?.push(res);
          }
        });
      }
    });
    if (errorResponse?.length === 0) {
      rootResolve({ records: recordsResponse });
    } else if (recordsResponse?.length === 0) {
      rootReject({ errors: errorResponse });
    } else {
      rootReject({ records: recordsResponse, errors: errorResponse });
    }
  });
});

export const fetchRecordsByTokenIdFlowDB = (
  tokenIdRecords: IRevealRecord[],
  client: Client,
  purejs: boolean,
  options?: Record<string, any>,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    executeDetokenize(
      flowDBDetokenizeVariant, tokenIdRecords, client, options, authToken as string,
    ).then((result) => {
      const successRecords = (result as FlowDBDetokenizeResponse).records || [];
      const failedRecords = (result.errors || []).map((errRecord) => {
        const errorData = formatForPureJsFailure(
          { error: { code: errRecord.error?.code, description: errRecord.error?.description } },
          errRecord.token,
          purejs,
        );
        printLog(errorData.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
        return errorData;
      });
      if (failedRecords.length === 0) {
        rootResolve({ records: successRecords });
      } else if (successRecords.length === 0) {
        rootReject({ errors: failedRecords });
      } else {
        rootReject({ records: successRecords, errors: failedRecords });
      }
    });
  }).catch((err) => {
    rootReject(err);
  });
});

export const fetchRecordsByTokenIdComposableFlowDB = (
  tokenIdRecords: IRevealRecordComposable[],
  client: Client,
  authToken: string,
  options?: Record<string, any>,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const frameIdByToken: Record<string, string> = {};
  tokenIdRecords?.forEach((record) => {
    frameIdByToken[record?.token ?? ''] = record?.iframeName ?? '';
  });

  executeDetokenize(flowDBDetokenizeVariant, tokenIdRecords, client, options, authToken)
    .then((result) => {
      const recordsResponse: Record<string, any>[] = [];
      const errorResponse: Record<string, any>[] = [];

      ((result as FlowDBDetokenizeResponse).records || []).forEach((record) => {
        recordsResponse.push({
          0: {
            token: record.token,
            value: record.value,
            ...(record.tokenGroupName ? { tokenGroupName: record.tokenGroupName } : {}),
            ...(record.metadata ? { metadata: record.metadata } : {}),
          },
          frameId: frameIdByToken[record.token] ?? '',
        });
      });

      (result.errors || []).forEach((errRecord) => {
        const errorData = formatForPureJsFailure(
          { error: { code: errRecord.error?.code, description: errRecord.error?.description } },
          errRecord.token,
          false,
        );
        printLog(errorData?.error?.description ?? '', MessageType.ERROR, LogLevel.ERROR);
        errorResponse.push({
          ...errorData,
          frameId: frameIdByToken[errRecord.token] ?? '',
        });
      });

      if (errorResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) {
        rootReject({ errors: errorResponse });
      } else {
        rootReject({ records: recordsResponse, errors: errorResponse });
      }
    });
});

export const formatRecordsForIframe = (response: IRevealResponseType) => {
  const result: Record<string, any> = {};
  if (response.records) {
    response.records.forEach((record) => {
      const key = record.token;
      const recordData = {
        value: record.value,
        redaction: record.redaction,
      };

      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(recordData);
        } else {
          result[key] = [result[key], recordData];
        }
      } else {
        result[key] = recordData;
      }
    });
  }
  return result;
};
export const formatRecordsForRender = (response : IRenderResponseType, column, skyflowID) => {
  let url = '';
  if (response.fields) {
    url = response.fields[column];
  }
  return {
    column,
    skyflowID,
    url,
  };
};

// eslint-disable-next-line consistent-return
export const formatForRenderClient = (response: IRenderResponseType, column: string)
: RenderFileResponse => {
  const formattedResponse: RenderFileResponse = {};
  if (response.fields) {
    const successRecord = {
      skyflow_id: response.fields.skyflow_id,
      column,
      fileMetadata: response.fileMetadata,
    };
    formattedResponse.success = successRecord;
  } else if (response.errors) {
    formattedResponse.errors = {
      skyflowId: response.errors.skyflowId,
      column: response.errors.column,
      error: response.errors.error,
    };
  }
  return formattedResponse;
};

export const formatRecordsForClient = (response: IRevealResponseType): RevealResponse => {
  const revealResponse: RevealResponse = {};
  if (response.records) {
    const successRecords = response.records.map((record) => ({
      token: record.token,
      valueType: record.valueType,
    }));
    revealResponse.success = successRecords;
  }
  if (response.errors) {
    const errorRecords = response.errors.map((errorRecord) => ({
      token: errorRecord.token,
      error: errorRecord.error,
    }));
    revealResponse.errors = errorRecords;
  }
  return revealResponse;
};

export const formatRecordsForClientFlowDB = (
  response: IRevealResponseType,
): RevealResponseFlowDB => {
  const revealResponse: RevealResponseFlowDB = {};
  if (response.records) {
    revealResponse.success = response.records.map((record: any) => ({
      token: record.token,
      ...(record.tokenGroupName ? { tokenGroupName: record.tokenGroupName } : {}),
      ...(record.metadata && Object.keys(record.metadata).length > 0
        ? { metadata: record.metadata } : {}),
    }));
  }
  if (response.errors) {
    revealResponse.errors = response.errors.map((errorRecord: any) => ({
      token: errorRecord.token,
      error: errorRecord.error,
    }));
  }
  return revealResponse;
};

export const formatRecordsForClientComposableFlowDB = (response) => {
  let successRecords = [];
  let errorRecords = [];

  if (response?.errors && response?.errors?.length > 0) {
    errorRecords = response?.errors?.map((errors) => ({
      error: errors?.error ?? {},
    }));
  }

  if (response?.records) {
    successRecords = response?.records?.map((record) => ({
      token: record?.[0]?.token ?? '',
      ...(record?.[0]?.tokenGroupName ? { tokenGroupName: record[0].tokenGroupName } : {}),
      ...(record?.[0]?.metadata && Object.keys(record[0].metadata).length > 0
        ? { metadata: record[0].metadata } : {}),
    }));
  }

  if (successRecords?.length > 0 && errorRecords?.length > 0) {
    return { success: successRecords, errors: errorRecords };
  }

  if (successRecords?.length > 0) {
    return { success: successRecords };
  }

  return { errors: errorRecords };
};

export const formatRecordsForClientComposable = (response) => {
  let successRecords = [];
  let errorRecords = [];

  if (response?.errors && response?.errors?.length > 0) {
    errorRecords = response?.errors?.map((errors) => ({
      error: errors?.error ?? {},
    }));
  }

  if (response?.records) {
    successRecords = response?.records?.map((record) => ({
      token: record?.[0]?.token ?? '',
      valueType: record?.[0]?.valueType ?? '',
    }));
  }

  if (successRecords?.length > 0 && errorRecords?.length > 0) {
    return { success: successRecords, errors: errorRecords };
  }

  if (successRecords?.length > 0) {
    return { success: successRecords };
  }

  return { errors: errorRecords };
};

export const fetchRecordsGET = async (
  skyflowIdRecords: IGetRecord[],
  client: Client,
  options?: IGetOptions,
): Promise<GetResponse> => new Promise((rootResolve, rootReject) => {
  let vaultResponseSet: Promise<any>[];
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    vaultResponseSet = skyflowIdRecords.map(
      (skyflowIdRecord: IGetRecord) => new Promise((resolve, reject) => {
        getRecordsFromVault(skyflowIdRecord, client, authToken as string, options)
          .then(
            (resolvedResult: GetResponse) => {
              const response: GetResponseRecord[] = [];
              const recordsData: GetResponseRecord[] = resolvedResult.records || [];
              recordsData.forEach((fieldData) => {
                const id = fieldData.fields.skyflow_id;
                const currentRecord: GetResponseRecord = {
                  fields: {
                    id,
                    ...fieldData.fields,
                  },
                  table: skyflowIdRecord.table,
                };
                delete currentRecord.fields.skyflow_id;
                response.push(currentRecord);
              });
              resolve(response);
            },
            (rejectedResult) => {
              let errorResponse = rejectedResult;
              if (rejectedResult && rejectedResult.error) {
                errorResponse = {
                  error: {
                    code: rejectedResult?.error?.code,
                    description: rejectedResult?.error?.description,
                  },
                  ids: skyflowIdRecord.ids,
                  ...(skyflowIdRecord?.columnName ? { columnName: skyflowIdRecord?.columnName }
                    : {}),
                };
              }
              printLog(rejectedResult.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
              reject(errorResponse);
            },
          )
          .catch((error: unknown) => {
            reject(error);
          });
      }),
    );
    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      const recordsResponse: any[] = [];
      const errorsResponse: any[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          recordsResponse.push(...result.value);
        } else {
          errorsResponse.push(result.reason);
        }
      });
      if (errorsResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) rootReject({ errors: errorsResponse });
      else rootReject({ records: recordsResponse, errors: errorsResponse });
    });
  }).catch((err) => {
    rootReject(err);
  });
});

/** SKYFLOW ID  */
export const fetchRecordsBySkyflowID = async (
  skyflowIdRecords: ISkyflowIdRecord[],
  client: Client,
): Promise<GetByIdResponse> => new Promise((rootResolve, rootReject) => {
  let vaultResponseSet: Promise<any>[];
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    vaultResponseSet = skyflowIdRecords.map(
      (skyflowIdRecord: ISkyflowIdRecord) => new Promise((resolve, reject) => {
        getSkyflowIdRecordsFromVault(skyflowIdRecord, client, authToken as string)
          .then(
            (resolvedResult: GetByIdResponse) => {
              const response: any[] = [];
              const recordsData: GetByIdResponseRecord[] = resolvedResult.records || [];
              recordsData.forEach((fieldData) => {
                const id = fieldData.fields.skyflow_id;
                const currentRecord: GetByIdResponseRecord = {
                  fields: {
                    id,
                    ...fieldData.fields,
                  },
                  table: skyflowIdRecord.table,
                };
                delete currentRecord.fields.skyflow_id;
                response.push(currentRecord);
              });
              resolve(response);
            },
            (rejectedResult) => {
              let errorResponse = rejectedResult;
              if (rejectedResult && rejectedResult.error) {
                errorResponse = {
                  error: {
                    code: rejectedResult?.error?.code,
                    description: rejectedResult?.error?.description,
                  },
                  ids: skyflowIdRecord.ids,
                };
              }
              printLog(rejectedResult.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
              reject(errorResponse);
            },
          )
          .catch((error) => {
            reject(error);
          });
      }),
    );
    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      const recordsResponse: any[] = [];
      const errorsResponse: any[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          recordsResponse.push(...result.value);
        } else {
          errorsResponse.push(result.reason);
        }
      });
      if (errorsResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) rootReject({ errors: errorsResponse });
      else rootReject({ records: recordsResponse, errors: errorsResponse });
    });
  }).catch((err) => {
    rootReject(err);
  });
});
