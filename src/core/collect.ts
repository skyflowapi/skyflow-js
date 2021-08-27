import { IInsertRecordInput, IInsertRecord } from "../Skyflow";

export const constructInsertRecordRequest = (
  records: IInsertRecordInput,
  options: Record<string, any> = { token: true }
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
  const records: IInsertRecord[] = [];

  Object.keys(req).forEach((table) => {
    records.push({
      table,
      fields: req[table],
    });
  });

  return constructInsertRecordRequest({ records }, options);
};
