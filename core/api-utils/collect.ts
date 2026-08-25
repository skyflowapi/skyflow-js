/* eslint-disable import/prefer-default-export */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral collect request-assembly. `constructElementsInsertReq` builds
// the generic records/updateRecords from collected element values; each package
// then builds its own API request (privacyDB constructInsertRecordRequest,
// flowDB constructFlowDBInsertRequest). The privacyDB /v1 builders and transport
// stay in src/api-utils/collect and consume this helper.
import get from 'lodash/get';
import { safeMerge } from '@core/utils/safe-merge';
import { IInsertRecord } from '@core/types';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';

const keyify = (obj, prefix = '') => Object.keys(obj).reduce((res: any, el) => {
  if (Array.isArray(obj[el])) {
    return [...res, prefix + el];
  } if (typeof obj[el] === 'object' && obj[el] !== null) {
    return [...res, ...keyify(obj[el], `${prefix + el}.`)];
  }
  return [...res, prefix + el];
}, []);

// Exported so flowDB's variant-specific constructElementsInsertReq can reuse the
// same duplicate-column guard (its additionalFields shape differs, but this check
// is identical). `keyify` stays private — only this helper consumes it.
export const checkDuplicateColumns = (additionalColumns, columns, table) => {
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
          safeMerge(temp, update[record.fields.skyflowID]);
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
          safeMerge(temp, req[record.table]);
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
