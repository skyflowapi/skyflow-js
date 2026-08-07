/*
Copyright (c) 2022 Skyflow, Inc.
*/
import omit from 'lodash/omit';
import { getAccessToken } from '@core/utils/bus-events';
import Client from '../client';
import {
  IInsertRecordInput, IInsertRecord,
  MessageType, LogLevel,
  InsertResponse,
  IUpdateRequest,
  IUpdateOptions,
  UpdateResponse,
  UpdateResponseType,
} from '../utils/common';
import { printLog } from '../utils/logs-helper';
import { BatchInsertRequestBody } from '../core/internal/internal-types';

export interface IUpsertOptions{
  table: string,
  column:string,
}

export const getUpsertColumn = (tableName: string, options:Array<IUpsertOptions> | undefined) => {
  let uniqueColumn = '';
  if (options) {
    options.forEach((upsertOptions) => {
      if (tableName === upsertOptions.table) {
        uniqueColumn = upsertOptions.column;
      }
    });
  }

  return uniqueColumn;
};
export const constructInsertRecordRequest = (
  records: IInsertRecordInput,
  options: Record<string, any> = { tokens: true },
): Array<BatchInsertRequestBody> => {
  const requestBody: Array<BatchInsertRequestBody> = [];
  if (options?.tokens || options === null) {
    records.records.forEach((record, index) => {
      const upsertColumn = getUpsertColumn(record.table, options.upsert);
      requestBody.push({
        method: 'POST',
        quorum: true,
        tableName: record.table,
        fields: record.fields,
        ...(options?.upsert ? { upsert: upsertColumn } : {}),
      });
      requestBody.push({
        method: 'GET',
        tableName: record.table,
        ID: `$responses.${2 * index}.records.0.skyflow_id`,
        tokenization: true,
      });
    });
  } else {
    records.records.forEach((record) => {
      const elseUpsertColumn = getUpsertColumn(record.table, options.upsert);

      requestBody.push({
        method: 'POST',
        quorum: true,
        tableName: record.table,
        fields: record.fields,
        ...(options?.upsert ? { upsert: elseUpsertColumn } : {}),
      });
    });
  }
  return requestBody;
};

export const constructInsertRecordResponse = (
  responseBody: any,
  tokens: boolean,
  records: IInsertRecord[],
): InsertResponse => {
  if (tokens) {
    return {
      records: responseBody.responses
        .map((res, index) => {
          if (index % 2 !== 0) {
            const skyflowId = responseBody.responses[index - 1].records[0].skyflow_id;
            delete res.fields['*'];
            return {
              table: records[Math.floor(index / 2)].table,
              fields: {
                skyflow_id: skyflowId,
                ...res.fields,
              },
            };
          }
          return res;
        }).filter((res, index) => index % 2 !== 0),
    };
  }
  return {
    records: responseBody.responses.map((res, index) => ({
      table: records[index].table,
      skyflow_id: res.records[0].skyflow_id,
    })),
  };
};

export const constructUpdateRecordRequest = (
  updateData: IUpdateRequest,
  options: IUpdateOptions = { tokens: true },
) => {
  const tokenization = options?.tokens ?? false;

  return {
    record: {
      fields: updateData.fields,
    },
    tokenization,
  };
};

export const constructUpdateRecordResponse = (
  responseBody: any,
  tokenization: boolean,
): UpdateResponse => {
  const result: UpdateResponseType = {
    skyflowID: responseBody.skyflow_id,
  };

  if (tokenization && responseBody.tokens) {
    Object.entries(responseBody.tokens).forEach(([key, value]) => {
      result[key] = value;
    });
  }

  return {
    updatedField: result,
  };
};

export const constructFinalUpdateRecordResponse = (
  responseBody: any,
  tokens: boolean,
  records: any,
) => {
  if (tokens) {
    return {
      table: records.table,
      fields: {
        skyflow_id: records.skyflowID,
        ...responseBody.tokens,
      },
    };
  }
  return {
    table: records.table,
    skyflow_id: responseBody.skyflow_id,
  };
};

export const constructUploadResponse = (response) => {
  const data = typeof response === 'string' ? JSON.parse(response) : response;
  return JSON.stringify({ skyflow_id: data.skyflowID }) as any;
};

// keyify / checkDuplicateColumns / constructElementsInsertReq moved to
// @core/core-utils/collect (variant-neutral request assembly).

const updateRecordsInVault = (
  skyflowIdRecord: IInsertRecord,
  client: Client,
  authToken: string,
  options,
) => {
  const table = skyflowIdRecord.fields.table;
  const skyflowID = skyflowIdRecord?.skyflowID;
  skyflowIdRecord.fields = omit(skyflowIdRecord.fields, 'table');
  skyflowIdRecord.fields = omit(skyflowIdRecord.fields, 'skyflowID');
  return client.request({
    body: JSON.stringify({
      record: {
        fields: { ...skyflowIdRecord.fields },
      },
      tokenization: options?.tokens !== undefined ? options.tokens : true,
    }),
    requestMethod: 'PUT',
    url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${table}/${skyflowID}`,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  });
};

export const updateRecordsBySkyflowID = async (
  skyflowIdRecords,
  client: Client,
  options,
) => new Promise((rootResolve, rootReject) => {
  let updateResponseSet: Promise<any>[];
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    updateResponseSet = skyflowIdRecords.updateRecords.map(
      (skyflowIdRecord: IInsertRecord) => new Promise((resolve, reject) => {
        updateRecordsInVault(skyflowIdRecord, client, authToken as string, options)
          .then((resolvedResult: any) => {
            const resp = constructFinalUpdateRecordResponse(
              resolvedResult, options?.tokens, skyflowIdRecord,
            );
            resolve(resp);
          },
          (rejectedResult) => {
            let errorResponse = rejectedResult;
            if (rejectedResult && rejectedResult.error) {
              errorResponse = {
                error: {
                  code: rejectedResult?.error?.code,
                  description: rejectedResult?.error?.description,
                  type: rejectedResult?.error?.type,
                },
              };
            }
            printLog(rejectedResult.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
            reject(errorResponse);
          }).catch((error) => {
            reject(error);
          });
      }),
    );
    Promise.allSettled(updateResponseSet).then((resultSet: any) => {
      const recordsResponse: any[] = [];
      const errorsResponse: any[] = [];
      resultSet.forEach((result: { status: string; value: any; reason?: any; }) => {
        if (result.status === 'fulfilled') {
          recordsResponse.push(result.value);
        } else {
          errorsResponse.push(result.reason);
        }
      });

      if (errorsResponse.length === 0) {
        rootResolve(recordsResponse);
      } else if (recordsResponse.length === 0) rootReject({ errors: errorsResponse });
      else rootReject({ records: recordsResponse, errors: errorsResponse });
    });
  }).catch((err) => {
    rootReject(err);
  });
});

export const updateRecordsBySkyflowIDComposable = async (
  skyflowIdRecords,
  client: Client,
  options,
  authToken: string,
) => new Promise((rootResolve, rootReject) => {
  let updateResponseSet: Promise<any>[];
  // eslint-disable-next-line prefer-const
  updateResponseSet = skyflowIdRecords?.updateRecords?.map(
    (skyflowIdRecord: IInsertRecord) => new Promise((resolve, reject) => {
      updateRecordsInVault(skyflowIdRecord, client, authToken, options)
        ?.then((resolvedResult: any) => {
          const resp = constructFinalUpdateRecordResponse(
            resolvedResult,
            options?.tokens,
            skyflowIdRecord,
          );
          resolve(resp);
        },
        (rejectedResult) => {
          let errorResponse = rejectedResult;
          if (rejectedResult?.error) {
            errorResponse = {
              error: {
                code: rejectedResult?.error?.code,
                description: rejectedResult?.error?.description,
                type: rejectedResult?.error?.type,
              },
            };
          }
          printLog(rejectedResult?.error?.description ?? '', MessageType.ERROR, LogLevel.ERROR);
          reject(errorResponse);
        })?.catch((error) => {
          reject(error);
        });
    }),
  );
  Promise.allSettled(updateResponseSet)?.then((resultSet: any) => {
    const recordsResponse: any[] = [];
    const errorsResponse: any[] = [];
    resultSet?.forEach((result: { status: string; value: any; reason?: any; }) => {
      if (result?.status === 'fulfilled') {
        recordsResponse?.push(result?.value);
      } else {
        errorsResponse?.push(result?.reason);
      }
    });

    if (errorsResponse?.length === 0) {
      rootResolve({ records: recordsResponse });
    } else if (recordsResponse?.length === 0) {
      rootReject({ errors: errorsResponse });
    } else {
      rootReject({ records: recordsResponse, errors: errorsResponse });
    }
  });
});

export const insertDataInCollect = async (
  records,
  client: Client,
  options,
  finalInsertRecords,
  authToken: string,
) => new Promise((resolve) => {
  let insertResponse: any;
  let insertErrorResponse: any;
  client
    ?.request({
      body: JSON.stringify({
        records,
      }),
      requestMethod: 'POST',
      url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}`,
      headers: {
        authorization: `Bearer ${authToken}`,
        'content-type': 'application/json',
      },
    })
    ?.then((response: any) => {
      insertResponse = constructInsertRecordResponse(
        response,
        options?.tokens,
        finalInsertRecords?.records,
      );
      resolve(insertResponse);
    })
    ?.catch((error) => {
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
      resolve(insertErrorResponse);
    });
});

export const insertDataInMultipleFiles = async (
  records,
  client: Client,
  options,
  finalInsertRecords,
  authToken: string,
) => new Promise((resolve) => {
  let insertResponse: any;
  let insertErrorResponse: any;
  client
    ?.request({
      body: JSON.stringify({
        records,
      }),
      requestMethod: 'POST',
      url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}`,
      headers: {
        authorization: `Bearer ${authToken}`,
        'content-type': 'application/json',
      },
    })
    ?.then((response: any) => {
      insertResponse = constructInsertRecordResponse(
        response,
        options?.tokens,
        finalInsertRecords?.records,
      );
      resolve(insertResponse);
    })
    ?.catch((error) => {
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
      resolve(insertErrorResponse);
    });
});

// checkForElementMatchRule / checkForValueMatch moved to @core/helpers
// (variant-neutral frame leaf-helpers). Frame code imports them from @core.
