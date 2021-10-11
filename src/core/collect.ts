import _ from 'lodash';
import { IInsertRecordInput, IInsertRecord } from '../Skyflow';
import { validateInsertRecords } from '../utils/validators';
import { parameterizedString } from '../utils/helper';
import logs from '../utils/logsHelper';

export const constructInsertRecordRequest = (
  records: IInsertRecordInput,
  options: Record<string, any> = { tokens: true },
) => {
  const requestBody: any = [];
  if (options.tokens) {
    records.records.forEach((record, index) => {
      requestBody.push({
        method: 'POST',
        quorum: true,
        tableName: record.table,
        fields: record.fields,
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
      requestBody.push({
        method: 'POST',
        quorum: true,
        tableName: record.table,
        fields: record.fields,
      });
    });
  }
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
          if (index % 2 !== 0) {
            const skyflowId = responseBody.responses[index - 1].records[0].skyflow_id;
            delete res.fields['*'];
            return {
              table: records[index].table,
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
    const value = _.get(columns, key);
    if (value) {
      throw new Error(parameterizedString(logs.errorLogs.DUPLICATE_ELEMENT, key, table));
    }
  });
};

export const constructElementsInsertReq = (req, options) => {
  const tables = Object.keys(req);
  const additionalFields = options?.additionalFields;
  if (additionalFields) {
    validateInsertRecords(additionalFields);

    // merge additionalFields in req
    additionalFields.records.forEach((record) => {
      if (tables.includes(record.table)) {
        checkDuplicateColumns(record.fields, req[record.table], record.table);
        const temp = record.fields;
        _.merge(temp, req[record.table]);
        req[record.table] = temp;
      } else {
        req[record.table] = record.fields;
      }
    });
  }
  const records: IInsertRecord[] = [];

  tables.forEach((table) => {
    records.push({
      table,
      fields: req[table],
    });
  });

  return constructInsertRecordRequest({ records }, options);
};
