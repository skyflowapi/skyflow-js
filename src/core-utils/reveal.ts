import Client from '../client';
import { getAccessToken } from '../utils/busEvents';
import SkyflowError from '../libs/SkyflowError';
import {
  ISkyflowIdRecord, IRevealRecord, IRevealResponseType, MessageType, LogLevel,
} from '../utils/common';
import logs from '../utils/logs';
import { printLog, parameterizedString } from '../utils/logsHelper';

const RegexParser = require('regex-parser');

interface IApiSuccessResponse {
  records: [
    {
      token: string;
      valueType:string;
      value:string;
    },
  ];
}

const formatForPureJsSuccess = (response: IApiSuccessResponse) => {
  const currentResponseRecords = response.records;
  return currentResponseRecords.map((record) => ({ token: record.token, value: record.value }));
};

const formatForPureJsFailure = (cause, tokenId:string) => ({
  token: tokenId,
  ...new SkyflowError({
    code: cause?.error?.code,
    description: cause?.error?.description,
  }, [], true),
});

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
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  });
};

const getTokenRecordsFromVault = (
  token:string,
  client: Client,
  authToken:string,
): Promise<any> => {
  const vaultEndPointurl: string = `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/detokenize`;
  return client.request({
    requestMethod: 'POST',
    url: vaultEndPointurl,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
    body:
      {
        detokenizationParameters: [
          {
            token,
          },
        ],
      },
  });
};

export const fetchRecordsByTokenId = (
  tokenIdRecords: IRevealRecord[],
  client: Client,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    const vaultResponseSet: Promise<any>[] = tokenIdRecords.map(
      (tokenRecord) => new Promise((resolve) => {
        const apiResponse: any = [];
        getTokenRecordsFromVault(tokenRecord.token, client, authToken as string)
          .then(
            (response: IApiSuccessResponse) => {
              const fieldsData = formatForPureJsSuccess(response);
              apiResponse.push(...fieldsData);
            },
            (cause: any) => {
              const errorData = formatForPureJsFailure(cause, tokenRecord.token);
              printLog(errorData.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
              apiResponse.push(errorData);
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
      result[record.token] = record.value;
    });
  }
  return result;
};

export const applyFormatRegex = (formattedResult: object, revealRecords: any) => {
  const finalResult = { ...formattedResult };
  revealRecords.forEach((record: any) => {
    if (record.formatRegex && record.replaceText) {
      const tempRegex = RegexParser(record.formatRegex);
      finalResult[record.token] = formattedResult[record.token]?.replace(tempRegex,
        record.replaceText);
    } else if (record.formatRegex) {
      const tempRegex = RegexParser(record.formatRegex);
      const matchResults = formattedResult[record.token]?.match(tempRegex);
      if (matchResults && matchResults.length > 0) {
        finalResult[record.token] = matchResults[0];
      } else {
        printLog(parameterizedString(logs.warnLogs.NO_MATCH_FOUND_FOR_FORMAT_REGEX,
          record.formatRegex), MessageType.WARN, LogLevel.WARN);
      }
    }
  });

  return finalResult;
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
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
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
                    code: rejectedResult?.error?.code,
                    description: rejectedResult?.error?.description,
                  },
                  ids: skyflowIdRecord.ids,
                };
              }
              printLog(rejectedResult.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
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
