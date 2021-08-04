import { IInsertRecord, IInsertRecordInput } from "../../Skyflow";

export const constructInsertRecordRequest = (
  records: IInsertRecordInput,
  options: Record<string, any>
) => {
  let requestBody: Record<string, any> = [];
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
        .map((res, index) => ({
          table: records[index].table,
          fields: res.fields,
        })),
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
