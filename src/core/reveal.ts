import Client from '../client';
import {
  IRevealRecord,
  ISkyflowIdRecord,
  RedactionType,
  IRevealResponseType,
} from '../Skyflow';
import { getAccessToken } from '../utils/busEvents';
import SkyflowError from '../libs/SkyflowError';

interface IApiSuccessResponse {
  records: [
    {
      token_id: string;
      fields: Record<string, string>;
    },
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

const formatForPureJsSuccess = (response: IApiSuccessResponse) => {
  const currentResponseRecords = response.records;
  return currentResponseRecords.map((record) => ({ token: record.token_id, ...record.fields }));
};

const formatForPureJsFailure = (cause: IApiFailureResponse, tokenIds) => tokenIds.map((tokenId) => (
  {
    token: tokenId,
    ...new SkyflowError({ code: cause?.error?.http_code || '', description: cause?.error?.message || '' }, [], true),
  }));
const getSkyflowIdRecordsFromVault = (
  skyflowIdRecord: ISkyflowIdRecord,
  client: Client,
  authToken:string,
) => {
  let paramList: string = '';

  skyflowIdRecord.ids.forEach((skyflowId) => {
    paramList += `skyflow_ids=${skyflowId}&`;
  });

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${skyflowIdRecord.table}?${paramList}redaction=${skyflowIdRecord.redaction}`;

  return client.request({
    requestMethod: 'GET',
    url: vaultEndPointurl,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
};

const getTokenRecordsFromVault = (
  queryRecordIds: string[],
  redactionType: RedactionType,
  client: Client,
  authToken:string,
): Promise<any> => {
  let paramList: string = '';

  queryRecordIds.forEach((recordId) => {
    paramList += `token_ids=${recordId}&`;
  });

  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/tokens?${paramList}redaction=${redactionType}`;
  return client.request({
    requestMethod: 'GET',
    url: vaultEndPointurl,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
};

export const fetchRecordsByTokenId = (
  tokenIdRecords: IRevealRecord[],
  client: Client,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  getAccessToken().then((authToken) => {
    const tokenRequest: Record<string, string[]> = {};

    tokenIdRecords.forEach((tokenRecord) => {
      if (tokenRequest[tokenRecord.redaction]) {
        tokenRequest[tokenRecord.redaction].push(tokenRecord.token);
      } else {
        tokenRequest[tokenRecord.redaction] = [tokenRecord.token];
      }
    });
    const vaultResponseSet: Promise<any>[] = Object.entries(tokenRequest).map(
      ([redaction, tokenIds]) => new Promise((resolve) => {
        const apiResponse: any = [];
        getTokenRecordsFromVault(tokenIds, RedactionType[redaction], client, authToken as string)
          .then(
            (response: IApiSuccessResponse) => {
              const fieldsData = formatForPureJsSuccess(response);
              apiResponse.push(...fieldsData);
            },
            (cause: IApiFailureResponse) => {
              const errorSet = formatForPureJsFailure(cause, tokenIds);
              apiResponse.push(...errorSet);
            },
          )
          .finally(() => {
            resolve(apiResponse);
          });
      }),
    );

    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      const recordsResponse: Record<string, any>[] = [];
      const errorResponse: Record<string, any>[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          result.value.forEach((res: Record<string, any>) => {
            if (Object.prototype.hasOwnProperty.call(res, 'error')) {
              errorResponse.push(res);
            } else {
              recordsResponse.push(res);
            }
          });
        }
      });
      if (errorResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) rootReject({ errors: errorResponse });
      else rootReject({ records: recordsResponse, errors: errorResponse });
    });
  }).catch((err) => {
    rootReject(err);
  });
});
export const formatRecordsForIframe = (response: IRevealResponseType) => {
  const result: Record<string, string> = {};
  if (response.records) {
    response.records.forEach((record) => {
      const values = Object.values(record);
      result[values[0]] = values[1];
    });
  }
  return result;
};

export const formatRecordsForClient = (response: IRevealResponseType) => {
  if (response.records) {
    const successRecords = response.records.map((record) => ({
      token: record.token,
    }));
    if (response.errors) return { success: successRecords, errors: response.errors };
    return { success: successRecords };
  }
  return { errors: response.errors };
};

/** SKYFLOW ID  */
export const fetchRecordsBySkyflowID = async (
  skyflowIdRecords: ISkyflowIdRecord[],
  client: Client,
) => new Promise((rootResolve, rootReject) => {
  let vaultResponseSet: Promise<any>[];
  getAccessToken().then((authToken) => {
    vaultResponseSet = skyflowIdRecords.map(
      (skyflowIdRecord) => new Promise((resolve, reject) => {
        getSkyflowIdRecordsFromVault(skyflowIdRecord, client, authToken as string)
          .then(
            (resolvedResult: any) => {
              const response: any[] = [];
              const recordsData: any[] = resolvedResult.records;
              recordsData.forEach((fieldData) => {
                const id = fieldData.fields.skyflow_id;
                const currentRecord = {
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
            },
          )
          .catch((error) => {
            reject(error);
          });
      }),
    );
    Promise.allSettled(vaultResponseSet).then((resultSet) => {
      const recordsResponse: any[] = [];
      const errorsResponse: any[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          recordsResponse.push(...result.value);
        } else {
          errorsResponse.push(result.reason);
        }
      });
      if (errorsResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) rootReject({ errors: errorsResponse });
      else rootReject({ records: recordsResponse, errors: errorsResponse });
    });
  }).catch((err) => {
    rootReject(err);
  });
});
