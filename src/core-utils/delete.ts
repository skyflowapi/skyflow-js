import Client from '../client';
import SkyflowError from '../libs/skyflow-error';
import { getAccessToken } from '../utils/bus-events';
import {
  IDeleteRecord,
  IDeleteResponseType,
  LogLevel,
  MessageType,
} from '../utils/common';
import { printLog } from '../utils/logs-helper';

const formatErrorResponse = (cause, skyflow_Id: String) => ({
  id: skyflow_Id,
  ...new SkyflowError(
    {
      code: cause?.error?.code,
      description: cause?.error?.description,
    },
    [],
    true,
  ),
});

export const deleteRecordsFromVault = async (
  record: IDeleteRecord,
  authToken: String,
  client: Client,
): Promise<any> => {
  const vaultURL = client.config.vaultURL;
  const vaultEndPointUrl: string = `${vaultURL}/v1/vaults/${client.config.vaultID}/${record.table}/${record.id}`;

  return client.request({
    requestMethod: 'DELETE',
    url: vaultEndPointUrl,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  });
};

export const deleteData = async (
  records,
  options,
  client,
): Promise<IDeleteResponseType> => {
  const clientId = client.toJSON()?.metaData?.uuid || '';

  return new Promise((rootResolve, rootReject) => {
    getAccessToken(clientId)
      .then((authToken) => {
        const vaultResponseSet: Promise<any>[] = records.records.map(
          (record) => new Promise((resolve) => {
            const apiResponse: any = [];
            deleteRecordsFromVault(record, authToken as String, client)
              .then(
                (response: any) => {
                  delete response.requestId;
                  apiResponse.push(response);
                },
                (cause: any) => {
                  const errorData = formatErrorResponse(cause, record.id);
                  printLog(
                    errorData.error?.description || '',
                    MessageType.ERROR,
                    LogLevel.ERROR,
                  );
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
          } else if (recordsResponse.length === 0) {
            rootReject({ errors: errorResponse });
          } else {
            rootReject({ records: recordsResponse, errors: errorResponse });
          }
        });
      })
      .catch((err) => {
        rootReject(err);
      });
  });
};
