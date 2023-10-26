/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Client from '../client';
import { getAccessToken } from '../utils/bus-events';
import SkyflowError from '../libs/skyflow-error';
import {
  IRevealRecord, IRevealResponseType, MessageType, LogLevel, IGetRecord, ISkyflowIdRecord,
  RedactionType,
  IGetOptions,
} from '../utils/common';
import { printLog } from '../utils/logs-helper';

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

const formatForPureJsFailure = (cause, tokenId:string) => ({
  token: tokenId,
  ...new SkyflowError({
    code: cause?.error?.code,
    description: cause?.error?.description,
  }, [], true),
});

const getRecordsFromVault = (
  skyflowIdRecord: IGetRecord,
  client: Client,
  authToken:string,
  options?: IGetOptions,
) => {
  let paramList: string = '';

  skyflowIdRecord.ids?.forEach((skyflowId) => {
    paramList += `skyflow_ids=${skyflowId}&`;
  });

  skyflowIdRecord.columnValues?.forEach((column) => {
    paramList += `column_name=${skyflowIdRecord.columnName}&column_values=${column}&`;
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
  });
};
const getSkyflowIdRecordsFromVault = (
  skyflowIdRecord: ISkyflowIdRecord,
  client: Client,
  authToken:string,
) => {
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
  });
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
      {
        detokenizationParameters: [
          {
            token,
            redaction,
          },
        ],
      },
  });
};

export const fetchRecordsByTokenId = (
  tokenIdRecords: IRevealRecord[],
  client: Client,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    const vaultResponseSet: Promise<any>[] = tokenIdRecords.map(
      (tokenRecord) => new Promise((resolve) => {
        const apiResponse: any = [];
        const redaction: RedactionType = tokenRecord.redaction ? tokenRecord.redaction
          : RedactionType.PLAIN_TEXT;
        getTokenRecordsFromVault(tokenRecord.token, redaction, client, authToken as string)
          .then(
            (response: IApiSuccessResponse) => {
              const fieldsData = formatForPureJsSuccess(response);
              apiResponse.push(...fieldsData);
            },
            (cause: any) => {
              const errorData = formatForPureJsFailure(cause, tokenRecord.token);
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
export const formatRecordsForIframe = (response: IRevealResponseType) => {
  const result: Record<string, string> = {};
  if (response.records) {
    response.records.forEach((record) => {
      result[record.token] = record.value;
    });
  }
  return result;
};

export const formatRecordsForClient = (response: IRevealResponseType) => {
  if (response.records) {
    const successRecords = response.records.map((record) => ({
      token: record.token,
      valueType: record.valueType,
    }));
    if (response.errors) return { success: successRecords, errors: response.errors };
    return { success: successRecords };
  }
  return { errors: response.errors };
};

export const fetchRecordsGET = async (
  skyflowIdRecords: IGetRecord[],
  client: Client,
  options?: IGetOptions,
) => new Promise((rootResolve, rootReject) => {
  let vaultResponseSet: Promise<any>[];
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    vaultResponseSet = skyflowIdRecords.map(
      (skyflowIdRecord) => new Promise((resolve, reject) => {
        getRecordsFromVault(skyflowIdRecord, client, authToken as string, options)
          .then(
            (resolvedResult: any) => {
              const response: any[] = [];
              const recordsData: any[] = resolvedResult.records;
              recordsData.forEach((fieldData) => {
                const id = fieldData.fields.skyflow_id;
                const currentRecord = {
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

/** SKYFLOW ID  */
export const fetchRecordsBySkyflowID = async (
  skyflowIdRecords: ISkyflowIdRecord[],
  client: Client,
) => new Promise((rootResolve, rootReject) => {
  let vaultResponseSet: Promise<any>[];
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    vaultResponseSet = skyflowIdRecords.map(
      (skyflowIdRecord) => new Promise((resolve, reject) => {
        getSkyflowIdRecordsFromVault(skyflowIdRecord, client, authToken as string)
          .then(
            (resolvedResult: any) => {
              const response: any[] = [];
              const recordsData: any[] = resolvedResult.records;
              recordsData.forEach((fieldData) => {
                const id = fieldData.fields.skyflow_id;
                const currentRecord = {
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
