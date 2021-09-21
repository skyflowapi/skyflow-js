import { IInsertRecordInput, IInsertRecord } from "../Skyflow";
import { validateInsertRecords } from "../utils/validators";
import _ from "lodash";

export const constructInsertRecordRequest = (
  records: IInsertRecordInput,
  options: Record<string, any> = { tokens: true }
) => {
  let requestBody: any = [];
  if (options.tokens) {
    records.records.forEach((record, index) => {
      requestBody.push({
        method: "POST",
        quorum: true,
        tableName: record.table,
        fields: record.fields,
      });
      requestBody.push({
        method: "GET",
        tableName: record.table,
        ID: "$responses." + 2 * index + ".records.0.skyflow_id",
        tokenization: true,
      });
    });
  } else {
    records.records.forEach((record, index) => {
      requestBody.push({
        method: "POST",
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
  records: IInsertRecord[]
) => {
  if (tokens) {
    return {
      records: responseBody.responses
        .filter((res, index) => index % 2 != 0)
        .map((res, index) => {
          let skyflow_id = res.fields["*"];
          delete res.fields["*"];
          return {
            table: records[index].table,
            fields: {
              skyflow_id,
              ...res.fields,
            },
          };
        }),
    };
  } else {
    return {
      records: responseBody.responses.map((res, index) => ({
        table: records[index].table,
        skyflow_id: res.records[0].skyflow_id,
      })),
    };
  }
};

export const constructElementsInsertReq = (req, options) => {
  const tables = Object.keys(req);
  const additionalFields = options?.additionalFields;
  if (additionalFields) {
    validateInsertRecords(additionalFields);

    //merge additionalFields in req
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

const checkDuplicateColumns = (additionalColumns, columns, table) => {
  const keys = keyify(additionalColumns);
  keys.forEach((key) => {
    const value = _.get(columns, key);
    if (value) {
      throw new Error("Duplicate column " + key + " found in " + table);
    }
  });
};

const keyify = (obj, prefix = "") =>
  Object.keys(obj).reduce((res: any, el) => {
    if (Array.isArray(obj[el])) {
      return [...res, prefix + el];
    } else if (typeof obj[el] === "object" && obj[el] !== null) {
      return [...res, ...keyify(obj[el], prefix + el + ".")];
    }
    return [...res, prefix + el];
  }, []);
