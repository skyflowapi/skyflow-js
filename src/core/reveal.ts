import Client from "../client";
import { IRevealRecord, RedactionType } from "../Skyflow";

/* TOKEN ID*/
export const fetchRecordsByTokenId = (
  tokenIdRecords: IRevealRecord[],
  client: Client
): Promise<Record<string, string>[]> => {
  let tokenRequest: Record<string, string[]> = {};

  tokenIdRecords.forEach((tokenRecord) => {
    if (tokenRequest[tokenRecord.redaction])
      tokenRequest[tokenRecord.redaction].push(tokenRecord.id);
    else tokenRequest[tokenRecord.redaction] = [tokenRecord.id];
  });

  const vaultResponseSet = Object.entries(tokenRequest).map(
    ([redaction, tokenIds]) =>
      getTokenRecordsFromVault(tokenIds, RedactionType[redaction], client)
  );

  return new Promise((resolve, _) => {
    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      const responseData: Record<string, string>[] = [];
      resultSet.forEach((result) => {
        if (result.status === "fulfilled") {
          const currentResponseRecords = result.value["records"];
          const fieldsData = currentResponseRecords.map((record) => {
            return { id: record["token_id"], ...record["fields"] };
          });
          responseData.push(...fieldsData);
        }
      });
      resolve(responseData);
    });
  });
};

const getTokenRecordsFromVault = (
  queryRecordIds: string[],
  redactionType: RedactionType,
  client: Client
): Promise<any> => {
  let paramList: string = "";

  queryRecordIds.forEach((recordId) => {
    paramList += `token_ids=${recordId}&`;
  });

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultId}/tokens?${paramList}redaction=${redactionType}`;
  return client.request({
    requestMethod: "GET",
    url: vaultEndPointurl,
  });
};

/** SKYFLOW IDS */
export const fetchRecordsBySkyflowId = (
  skyflowIdRecords: IRevealRecord[],
  client: Client
): Promise<Record<string, string>[]> => {
  let formattedSkyflowIdRecords = formatInputSkyflowIdRecords(skyflowIdRecords);
  let finalResponseSet = Object.entries(formattedSkyflowIdRecords).map(
    ([tableName, records]) =>
      getSkyflowIdRecordsFromVault(tableName, records, client)
  );
  return new Promise((resolve, _) => {
    Promise.allSettled(finalResponseSet).then((responseSet) => {
      let skyflowIdResponse: Record<string, string>[] = [];
      responseSet.forEach((response) => {
        if (response.status === "fulfilled") {
          skyflowIdResponse.push(
            ...(response.value as Record<string, string>[])
          );
        }
      });
      resolve(skyflowIdResponse);
    });
  });
};

const getSkyflowIdRecordsFromVault = (
  tableName: string,
  rowRecords: Record<
    string,
    {
      redaction: RedactionType;
      column: string;
    }[]
  >,
  client: Client
) => {
  const endpointUrl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultId}/query`;
  let rowQueries = getSkyflowQueryData(tableName, rowRecords);
  let vaultApiResponse: Record<string, any>[] = [];

  let requestSet = rowQueries.map((rowQuery) => {
    return client
      .request({
        requestMethod: "POST",
        url: endpointUrl,
        body: { query: rowQuery.query },
      })
      .then((value: any) => {
        let fieldData = value["records"].map((record: any) => {
          return { id: rowQuery.skyflow_id, ...record["fields"] };
        });
        vaultApiResponse.push(...fieldData);
      });
  });
  return new Promise((resolve, _) => {
    Promise.allSettled(requestSet).then(() => {
      resolve(vaultApiResponse);
    });
  });
};

export const formatInputSkyflowIdRecords = (
  skyflowIdRecords: IRevealRecord[]
): Record<
  string,
  Record<string, { redaction: RedactionType; column: string }[]>
> => {
  let skyflowIdRequest: Record<
    string,
    Record<string, { redaction: RedactionType; column: string }[]>
  > = {};

  skyflowIdRecords.forEach((skyflowIdRecord: IRevealRecord) => {
    if (skyflowIdRequest[skyflowIdRecord.table]) {
      if (skyflowIdRequest[skyflowIdRecord.table][skyflowIdRecord.id])
        skyflowIdRequest[skyflowIdRecord.table][skyflowIdRecord.id].push({
          redaction: skyflowIdRecord.redaction,
          column: skyflowIdRecord.column,
        });
      else {
        skyflowIdRequest[skyflowIdRecord.table][skyflowIdRecord.id] = [
          {
            redaction: skyflowIdRecord.redaction,
            column: skyflowIdRecord.column,
          },
        ];
      }
    } else {
      skyflowIdRequest[skyflowIdRecord.table] = {};
      skyflowIdRequest[skyflowIdRecord.table][skyflowIdRecord.id] = [
        {
          redaction: skyflowIdRecord.redaction,
          column: skyflowIdRecord.column,
        },
      ];
    }
  });
  return skyflowIdRequest;
};

const getSkyflowQueryData = (
  tableName: string,
  queryRows: Record<string, { redaction: RedactionType; column: string }[]>
): { skyflow_id: string; query: string }[] => {
  let queryParams = Object.entries(queryRows).map(([key, queryFields]) => {
    return { id: key, params: getSqlQueryParams(queryFields) };
  });
  return queryParams.map((row) => {
    return {
      skyflow_id: row.id,
      query: `SELECT ${row.params} FROM ${tableName} WHERE skyflow_id='${row.id}'`,
    };
  });
};

const getSqlQueryParams = (
  queryFields: { redaction: RedactionType; column: string }[]
): string => {
  let queryParam = "";
  queryFields.forEach((queryField, index) => {
    queryParam += `redaction(${formatJsonColumnForQuery(queryField.column)},'${
      queryField.redaction
    }')${queryFields.length - 1 === index ? "" : ","}`;
  });
  return queryParam;
};

const formatJsonColumnForQuery = (columnName: string): string => {
  if (columnName.trim().includes(".")) {
    let nestedFields = columnName.split(".");
    let formattedColumnName = "";
    nestedFields.forEach((field, index) => {
      const formatField = index === 0 ? `${field}` : `'${field}'`;
      formattedColumnName += `${formatField}${
        nestedFields.length - 1 === index ? "" : "->"
      }`;
    });
    return formattedColumnName;
  }
  return columnName;
};
