/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB (/v2) collect data layer: request builders, response/error parsers, and
// the insert/update transport variants. The generic element-collection step
// (`constructElementsInsertReq`) is reused from @core — not redefined — and
// re-exported here so consumers import it from the flowvault collect surface.
import merge from 'lodash/merge';
import get from 'lodash/get';
import omit from 'lodash/omit';
import { IInsertRecordInput, IInsertRecord } from '@core/types';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';
import Client from '@core/client';
import { normalizeFlowDBError } from '../libs/skyflow-flowdb-error';
import { generateMockCVV } from '../utils/helpers';
import { IFlowDBUpsertOptions } from '../utils/common';
import {
  FlowDBInsertRecordData,
  FlowDBInsertRequestBody,
  FlowDBInsertResponseBody,
  CollectResponse,
  CollectRecord,
  CollectError,
  FlowDBUpdateRecordData,
  FlowDBUpdateRequestBody,
  FlowDBUpsert,
} from '../core/internal/internal-types';

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

// Generic element-collection assembly. NOTE: unlike @core's privacyDB variant,
// flowDB's AdditionalFields records use the flowDB shape `{ tableName, data,
// skyflowId }` (vs privacyDB `{ table, fields }`), so the additionalFields merge
// is variant-specific and this cannot reuse @core's constructElementsInsertReq.
// The element-collection loop that follows is identical in both variants
// (accepted loose-coupling duplication).
export const constructElementsInsertReq = (req, update, options) => {
  let tables = Object.keys(req);
  let ids = Object.keys(update);
  const additionalFields = options?.additionalFields;
  if (additionalFields) {
    // merge additionalFields in req
    additionalFields.records.forEach((record) => {
      const { tableName, data, skyflowId } = record;
      if (skyflowId) {
        if (ids.includes(skyflowId)) {
          checkDuplicateColumns(data, update[skyflowId], tableName);
          const temp = { ...data };
          merge(temp, update[skyflowId]);
          update[skyflowId] = temp;
        } else {
          update[skyflowId] = {
            ...data,
            table: tableName,
          };
        }
      } else if (tables.includes(tableName)) {
        checkDuplicateColumns(data, req[tableName], tableName);
        const temp = { ...data };
        merge(temp, req[tableName]);
        req[tableName] = temp;
      } else {
        req[tableName] = { ...data };
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

export const getFlowDBUpsertForTable = (
  tableName: string,
  options: Array<IFlowDBUpsertOptions> | undefined,
): FlowDBUpsert | undefined => {
  if (!options) return undefined;
  const match = options.find((upsertOption) => upsertOption.tableName === tableName);
  if (!match) return undefined;
  return {
    uniqueColumns: match.uniqueColumns,
    ...(match.updateType ? { updateType: match.updateType } : {}),
  };
};

export const constructFlowDBInsertRequest = (
  records: IInsertRecordInput,
  options: Record<string, any> = { tokens: true },
  vaultID: string | undefined,
): FlowDBInsertRequestBody => {
  const insertRecords: FlowDBInsertRecordData[] = records.records.map((record) => {
    const upsert = getFlowDBUpsertForTable(record.table, options?.upsert);
    return {
      tableName: record.table,
      data: record.fields,
      ...(upsert ? { upsert } : {}),
    };
  });

  return {
    vaultID,
    records: insertRecords,
  };
};

export const constructFlowDBInsertResponse = (
  responseBody: FlowDBInsertResponseBody,
): CollectResponse => {
  const records: Array<CollectRecord> = [];

  responseBody.records.forEach((res) => {
    if (res.error) {
      records.push({
        error: res.error,
        tableName: res.tableName,
        httpCode: res.httpCode as number,
      });
      return;
    }
    const hasHashedData = res.hashedData && Object.keys(res.hashedData).length > 0;
    records.push({
      tableName: res.tableName,
      ...(res.skyflowID ? { skyflowId: res.skyflowID } : {}),
      tokens: res.tokens ?? {},
      ...(hasHashedData ? { hashedData: res.hashedData } : {}),
      httpCode: res.httpCode as number,
    });
  });

  return { records };
};

export interface CVVMap {
  insert: Record<string, Record<string, string>>;
  update: Record<string, Record<string, string>>;
}

/**
 * Replaces the token of every CVV column in the collect response with a mock 3/4-digit
 * placeholder. The mock matches the length of the value the user entered and never equals it.
 *
 * The FlowDB response keys `tokens` by the top-level column name; each value is a list of token
 * entries. A flat column's entries carry no `path`; a nested JSON column exposes each subfield as
 * a separate entry carrying a dotted `path` (e.g. `city.street`) relative to that top-level
 * column. So the captured CVV column (which may be a dotted path like `address.city.street`) is
 * split at the FIRST dot into the top-level key + the remaining path, and the token is targeted:
 *   - flat column (no nested path): replace the path-less entries (all of them, e.g. one per token
 *     group), applying the same mock so they stay consistent.
 *   - nested column: replace only the entry whose `path` EXACTLY equals the remaining path. Exact
 *     equality (not a prefix) keeps parent and child paths isolated, since e.g. `city`,
 *     `city.street` and `city.ward` legitimately coexist in the same array.
 * hashedData and non-CVV columns are left untouched.
 */
export const replaceCVVTokensInResponse = (
  records: Array<CollectRecord>,
  cvvMap: CVVMap,
): Array<CollectRecord> => {
  if (!records) return records;
  records.forEach((record) => {
    if (!record || !record.tokens) return;
    const tokens = record.tokens as Record<string, any>;
    let columnMap: Record<string, string> | undefined;
    if (record.skyflowId && cvvMap.update[record.skyflowId]) {
      columnMap = cvvMap.update[record.skyflowId];
    } else if (record.tableName && cvvMap.insert[record.tableName]) {
      columnMap = cvvMap.insert[record.tableName];
    }
    if (!columnMap) return;
    Object.keys(columnMap).forEach((column) => {
      const dotIndex = column.indexOf('.');
      const topKey = dotIndex === -1 ? column : column.slice(0, dotIndex);
      const nestedPath = dotIndex === -1 ? undefined : column.slice(dotIndex + 1);
      if (!(topKey in tokens)) return;
      const enteredValue = columnMap![column];
      // An empty entered CVV has no sensitive value to mask; replace its token with an empty
      // string. This also avoids calling generateMockCVV with length 0 (which cannot produce a
      // value that differs from the empty entered value).
      const mock = enteredValue ? generateMockCVV(enteredValue.length, enteredValue) : '';
      const tokenValue = tokens[topKey];
      if (Array.isArray(tokenValue)) {
        tokenValue.forEach((entry) => {
          if (!entry || typeof entry !== 'object' || !('token' in entry)) return;
          if (nestedPath === undefined) {
            if (entry.path === undefined) entry.token = mock;
          } else if (entry.path === nestedPath) {
            entry.token = mock;
          }
        });
      } else if (nestedPath === undefined) {
        if (tokenValue && typeof tokenValue === 'object' && 'token' in tokenValue) {
          tokenValue.token = mock;
        } else {
          tokens[topKey] = mock;
        }
      }
    });
  });
  return records;
};

export const constructFlowDBInsertError = (error: any): CollectError => {
  const rawError = error?.data?.error;
  if (rawError) {
    return { error: normalizeFlowDBError(rawError) };
  }
  return {
    error: {
      httpCode: error?.error?.code,
      message: error?.error?.description,
    },
  };
};

export const constructFlowDBUpdateRequest = (
  updateRecords: { updateRecords: IInsertRecord[] },
  options: Record<string, any> = { tokens: true },
  vaultID: string | undefined,
): FlowDBUpdateRequestBody => {
  const records: FlowDBUpdateRecordData[] = updateRecords.updateRecords.map((record) => ({
    skyflowID: record.skyflowID as string,
    tableName: record.table,
    data: omit(record.fields, ['table', 'skyflowID']),
    ...(options?.updateType ? { updateType: options.updateType } : {}),
  }));

  return {
    vaultID,
    records,
  };
};

interface IInsertVariant {
  buildRequest(
    client: Client,
    records,
    options,
    finalInsertRecords,
    authToken: string,
  ): Promise<any> | undefined;
  parseSuccess(response: any, options, finalInsertRecords): any;
  parseError(error: any, options?): any;
}

// When the flowDB API rejects with a non-2xx status it can still return a body
// carrying a `records` key (partial failure). In that case resolve the request
// through the success constructor so the per-record results/errors flow to the
// client, and only fall back to the top-level error envelope on a full failure.
const parseFlowDBError = (error: any) => {
  if (Array.isArray(error?.data?.records)) {
    return constructFlowDBInsertResponse(error.data);
  }
  return constructFlowDBInsertError(error);
};

const flowDBInsertVariant: IInsertVariant = {
  buildRequest: (client, records, options, finalInsertRecords, authToken) => client?.request({
    body: JSON.stringify(
      constructFlowDBInsertRequest(finalInsertRecords, options, client.config.vaultID),
    ),
    requestMethod: 'POST',
    url: `${client.config.vaultURL}/v2/records/insert`,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  }),
  parseSuccess: (response) => constructFlowDBInsertResponse(response),
  parseError: (error) => parseFlowDBError(error),
};

const flowDBUpdateVariant: IInsertVariant = {
  buildRequest: (client, records, options, finalUpdateRecords, authToken) => client?.request({
    body: JSON.stringify(
      constructFlowDBUpdateRequest(finalUpdateRecords, options, client.config.vaultID),
    ),
    requestMethod: 'POST',
    url: `${client.config.vaultURL}/v2/records/update`,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  }),
  parseSuccess: (response) => constructFlowDBInsertResponse(response),
  parseError: (error) => parseFlowDBError(error),
};

const executeInsert = (
  variant: IInsertVariant,
  records,
  client: Client,
  options,
  finalInsertRecords,
  authToken: string,
) => new Promise((resolve) => {
  variant.buildRequest(client, records, options, finalInsertRecords, authToken)
    ?.then((response: any) => {
      resolve(variant.parseSuccess(response, options, finalInsertRecords));
    })
    ?.catch((error: any) => {
      resolve(variant.parseError(error, options));
    });
});

export const insertDataInCollectFlowDB = async (
  records,
  client: Client,
  options,
  finalInsertRecords,
  authToken: string,
) => executeInsert(flowDBInsertVariant, records, client, options, finalInsertRecords, authToken);

export const updateDataInCollectFlowDB = async (
  records,
  client: Client,
  options,
  finalUpdateRecords,
  authToken: string,
) => executeInsert(flowDBUpdateVariant, records, client, options, finalUpdateRecords, authToken);
