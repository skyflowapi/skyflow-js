import Client from "../client";
import {
  IRevealRecord,
  ISkyflowIdRecord,
  RedactionType,
  revealResponseType,
} from "../Skyflow";
import { isTokenValid } from "../utils/jwtUtils";

interface IApiSuccessResponse {
  records: [
    {
      token_id: string;
      fields: Record<string, string>;
    }
  ];
}
interface IApiFailureResponse {
  error?: {
    http_code: number;
    grpc_code: number;
    http_status: string;
    message: string;
  };
}

export const fetchRecordsByTokenId = async (
  tokenIdRecords: IRevealRecord[],
  client: Client
): Promise<revealResponseType> => {
  try {
    if (
      client.config.getBearerToken &&
      (!client.accessToken || !isTokenValid(client.accessToken))
    ) {
      client.accessToken = await client.config.getBearerToken();
    }
  } catch (err) {
    throw err;
  }
  let tokenRequest: Record<string, string[]> = {};

  tokenIdRecords.forEach((tokenRecord) => {
    if (tokenRequest[tokenRecord.redaction])
      tokenRequest[tokenRecord.redaction].push(tokenRecord.token);
    else tokenRequest[tokenRecord.redaction] = [tokenRecord.token];
  });

  const vaultResponseSet: Promise<any>[] = Object.entries(tokenRequest).map(
    ([redaction, tokenIds]) => {
      return new Promise((resolve, _) => {
        let apiResponse: any = [];
        getTokenRecordsFromVault(tokenIds, RedactionType[redaction], client)
          .then(
            (response: IApiSuccessResponse) => {
              const fieldsData = formatForPureJsSuccess(response);
              apiResponse.push(...fieldsData);
            },
            (cause: IApiFailureResponse) => {
              let errorSet = formatForPureJsFailure(cause, tokenIds);
              apiResponse.push(...errorSet);
            }
          )
          .finally(() => {
            resolve(apiResponse);
          });
      });
    }
  );

  return new Promise((resolve, reject) => {
    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      let recordsResponse: Record<string, any>[] = [];
      let errorResponse: Record<string, any>[] = [];
      resultSet.forEach((result) => {
        if (result.status === "fulfilled") {
          result.value.map((res: Record<string, any>) => {
            if (res.hasOwnProperty("error")) {
              errorResponse.push(res);
            } else {
              recordsResponse.push(res);
            }
          });
        }
      });
      if (errorResponse.length === 0) {
        resolve({ records: recordsResponse });
      } else {
        if (recordsResponse.length === 0) reject({ errors: errorResponse });
        else reject({ records: recordsResponse, errors: errorResponse });
      }
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

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/tokens?${paramList}redaction=${redactionType}`;

  return client.request({
    requestMethod: "GET",
    url: vaultEndPointurl,
  });
};

const formatForPureJsSuccess = (response: IApiSuccessResponse) => {
  const currentResponseRecords = response["records"];
  return currentResponseRecords.map((record) => {
    return { token: record["token_id"], ...record["fields"] };
  });
};

const formatForPureJsFailure = (cause: IApiFailureResponse, tokenIds) => {
  return tokenIds.map((tokenId) => ({
    token: tokenId,
    error: {
      code: cause?.error?.http_code || "",
      description: cause?.error?.message || "",
    },
  }));
};

export const formatRecordsForIframe = (response: revealResponseType) => {
  const result: Record<string, string> = {};
  if (response.records) {
    response.records.forEach((record) => {
      const values = Object.values(record);
      result[values[0]] = values[1];
    });
  }
  return result;
};

export const formatRecordsForClient = (response: revealResponseType) => {
  if (response.records) {
    const successRecords = response.records.map((record) => ({
      token: record.token,
    }));
    if (response.errors)
      return { success: successRecords, errors: response.errors };
    else return { success: successRecords };
  }
  return { errors: response.errors };
};

/** SKYFLOW ID  */

export const fetchRecordsBySkyflowID = async (
  skyflowIdRecords: ISkyflowIdRecord[],
  client: Client
) => {
  try {
    if (
      client.config.getBearerToken &&
      (!client.accessToken || !isTokenValid(client.accessToken))
    ) {
      client.accessToken = await client.config.getBearerToken();
    }
  } catch (err) {
    throw err;
  }
  const vaultResponseSet: Promise<any>[] = skyflowIdRecords.map(
    (skyflowIdRecord) => {
      return new Promise((resolve, reject) => {
        getSkyflowIdRecordsFromVault(skyflowIdRecord, client)
          .then(
            (resolvedResult: any) => {
              let response: any[] = [];
              const recordsData: any[] = resolvedResult.records;
              recordsData.map((fieldData) => {
                let id = fieldData.fields["skyflow_id"];
                let currentRecord = {
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
                    code: rejectedResult.error.http_code,
                    description: rejectedResult.error.message,
                  },
                  ids: skyflowIdRecord.ids,
                };
              }
              reject(errorResponse);
            }
          )
          .catch((error) => {
            reject(error);
          });
      });
    }
  );
  return new Promise((resolve, reject) => {
    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      let recordsResponse: any[] = [];
      let errorsResponse: any[] = [];
      resultSet.forEach((result) => {
        if (result.status === "fulfilled") {
          recordsResponse.push(...result.value);
        } else {
          errorsResponse.push(result.reason);
        }
      });
      if (errorsResponse.length === 0) {
        resolve({ records: recordsResponse });
      } else {
        if (recordsResponse.length === 0) reject({ errors: errorsResponse });
        else reject({ records: recordsResponse, errors: errorsResponse });
      }
    });
  });
};

const getSkyflowIdRecordsFromVault = (
  skyflowIdRecord: ISkyflowIdRecord,
  client: Client
) => {
  let paramList: string = "";

  skyflowIdRecord.ids.forEach((skyflowId) => {
    paramList += `skyflow_ids=${skyflowId}&`;
  });

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${skyflowIdRecord.table}?${paramList}redaction=${skyflowIdRecord.redaction}`;
  return client.request({
    requestMethod: "GET",
    url: vaultEndPointurl,
  });
};
