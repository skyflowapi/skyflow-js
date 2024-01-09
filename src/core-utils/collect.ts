/*
Copyright (c) 2022 Skyflow, Inc.
*/
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import get from 'lodash/get';
import Client from '../client';
import SkyflowError from '../libs/skyflow-error';
import { getAccessToken } from '../utils/bus-events';
import {
  IInsertRecordInput, IInsertRecord, IValidationRule, ValidationRuleType,
  MessageType, LogLevel,
} from '../utils/common';
import SKYFLOW_ERROR_CODE from '../utils/constants';
import { printLog } from '../utils/logs-helper';

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
) => {
  const requestBody: any = [];
  records.records.forEach((record) => {
    const upsertColumn = getUpsertColumn(record.table, options.upsert);
    requestBody.push({
      method: 'POST',
      quorum: true,
      tableName: record.table,
      fields: record.fields,
      ...(options?.upsert ? { upsert: upsertColumn } : {}),
      ...(options?.tokens ? { tokenization: true } : {}),
    });
  });
  return requestBody;
};

export const constructInsertRecordResponse = (
  responseBody: any,
  tokens: boolean,
  records: IInsertRecord[],
) => {
  if (tokens) {
    return {
      records: responseBody.responses
        .map((res, index) => {
          const skyflowId = responseBody.responses[index].records[0].skyflow_id;
          return {
            table: records[index].table,
            fields: {
              skyflow_id: skyflowId,
              ...res.records[0].tokens,
            },
          };
        }),
    };
  }
  return {
    records: responseBody.responses.map((res, index) => ({
      table: records[index].table,
      skyflow_id: res.records[0].skyflow_id,
    })),
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

export const constructUploadResponse = (response) => response;

const keyify = (obj, prefix = '') => Object.keys(obj).reduce((res: any, el) => {
  if (Array.isArray(obj[el])) {
    return [...res, prefix + el];
  } if (typeof obj[el] === 'object' && obj[el] !== null) {
    return [...res, ...keyify(obj[el], `${prefix + el}.`)];
  }
  return [...res, prefix + el];
}, []);

const checkDuplicateColumns = (additionalColumns, columns, table) => {
  const keys = keyify(additionalColumns);
  keys.forEach((key) => {
    const value = get(columns, key);
    if (value) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT, [`${key}`, `${table}`], true);
    }
  });
};

export const constructElementsInsertReq = (req, update, options) => {
  let tables = Object.keys(req);
  let ids = Object.keys(update);
  const additionalFields = options?.additionalFields;
  if (additionalFields) {
    // merge additionalFields in req
    additionalFields.records.forEach((record) => {
      if (record.fields.skyflowID) {
        if (ids.includes(record.fields.skyflowID)) {
          checkDuplicateColumns(
            record.fields, update[record.fields.skyflowID], record.table,
          );
          const temp = record.fields;
          merge(temp, update[record.fields.skyflowID]);
          update[record.fields.skyflowID] = temp;
        } else {
          update[record.fields.skyflowID] = {
            ...record.fields,
            table: record.table,
          };
        }
      } else if (!record.fields.skyflowID) {
        if (tables.includes(record.table)) {
          checkDuplicateColumns(record.fields, req[record.table], record.table);
          const temp = record.fields;
          merge(temp, req[record.table]);
          req[record.table] = temp;
        } else {
          req[record.table] = record.fields;
        }
      }
    });
  }
  const records: IInsertRecord[] = [];
  const updateRecords: IInsertRecord[] = [];

  tables = Object.keys(req);
  tables.forEach((table) => {
    records.push({
      table,
      fields: req[table],
    });
  });
  ids = Object.keys(update);
  ids.forEach((id) => {
    updateRecords.push({
      table: update[id].table,
      fields: update[id],
      skyflowID: id,
    });
  });
  return [{ records }, { updateRecords }];
};
const updateRecordsInVault = (
  skyflowIdRecord: IInsertRecord,
  client: Client,
  authToken: string,
  options,
) => {
  const table = skyflowIdRecord.fields.table;
  const skyflowID = skyflowIdRecord.skyflowID;
  skyflowIdRecord.fields = omit(skyflowIdRecord.fields, 'table');
  skyflowIdRecord.fields = omit(skyflowIdRecord.fields, 'skyflowID');
  return client.request({
    body: {
      record: {
        fields: { ...skyflowIdRecord.fields },
      },
      tokenization: options?.tokens !== undefined ? options.tokens : true,
    },
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

export const checkForElementMatchRule = (validations: IValidationRule[]) => {
  for (let i = 0; i < validations.length; i += 1) {
    if (validations[i].type === ValidationRuleType.ELEMENT_VALUE_MATCH_RULE) {
      return true;
    }
  }
  return false;
};
