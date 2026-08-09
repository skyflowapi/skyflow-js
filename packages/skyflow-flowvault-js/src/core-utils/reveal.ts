/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB (/v2) reveal/detokenize data layer: request builder, response/error
// parsers, the detokenize transport variant, the token-fetch entrypoints
// (element + composable), and the client-facing response formatters. The
// variant-neutral iframe formatter (`formatRecordsForIframe`) lives in @core and
// is consumed by the reveal frame, not here.
import { getAccessToken } from '@core/utils/bus-events';
import SkyflowError from '@core/errors';
import {
  IRevealRecord,
  IRevealRecordComposable,
  IRevealResponseType,
  MessageType,
  LogLevel,
} from '@core/types';
import Client from '../client';
import { printLog } from '../utils/logs-helper';
import { normalizeFlowDBError } from '../libs/skyflow-flowdb-error';
import {
  FlowDBDetokenizeRequestBody,
  FlowDBDetokenizeResponseBody,
  FlowDBDetokenizeResponse,
  FlowDBDetokenizeRequestError,
  RevealResponse,
  RevealError,
} from '../core/internal/internal-types';

const formatForPureJsFailure = (cause, tokenId: string, purejs: boolean) => {
  if (purejs) {
    return {
      token: tokenId,
      error: {
        code: cause?.error?.code,
        description: cause?.error?.description,
      },
    };
  }
  return ({
    token: tokenId,
    ...new SkyflowError({
      code: cause?.error?.code,
      description: cause?.error?.description,
      type: cause?.error?.type,
    }, [], true),
  });
};

export const constructFlowDBDetokenizeRequest = (
  tokenIdRecords: IRevealRecord[] | IRevealRecordComposable[],
  vaultID: string | undefined,
  options?: Record<string, any>,
): FlowDBDetokenizeRequestBody => {
  const tokens = tokenIdRecords.map((record) => record.token as string);

  const tokenGroupRedactions = options?.tokenGroupRedactions;

  return {
    vaultID,
    tokens,
    ...(Array.isArray(tokenGroupRedactions) && tokenGroupRedactions.length > 0
      ? { tokenGroupRedactions }
      : {}),
  };
};

export const constructFlowDBDetokenizeResponse = (
  responseBody: FlowDBDetokenizeResponseBody,
): FlowDBDetokenizeResponse => {
  const records: FlowDBDetokenizeResponse['records'] = [];
  const errors: FlowDBDetokenizeResponse['errors'] = [];
  (responseBody?.response || []).forEach((res) => {
    if (res.error) {
      errors.push({
        token: res.token,
        error: { code: res.httpCode, description: res.error },
      });
      return;
    }
    const hasMetadata = res.metadata && Object.keys(res.metadata).length > 0;
    records.push({
      token: res.token,
      value: res.value,
      ...(res.tokenGroupName ? { tokenGroupName: res.tokenGroupName } : {}),
      ...(hasMetadata ? { metadata: res.metadata } : {}),
      httpCode: res.httpCode,
    });
  });
  return { records, errors };
};

export const constructFlowDBDetokenizeError = (
  error: any,
): FlowDBDetokenizeRequestError => ({
  errors: [
    {
      token: '',
      error: {
        code: error?.error?.code,
        description: error?.error?.description,
      },
    },
  ],
  // Pass the raw API error body through for the element/composable reveal contract,
  // normalized to the SDK camelCase convention. flowDB returns a flat error envelope
  // ({ grpcCode, httpCode, message, httpStatus, details }); accept that or a nested
  // { error } shape, and fall back to the SkyflowError envelope only when there is no
  // raw body (e.g. non-JSON responses).
  error: error?.data
    ? normalizeFlowDBError(error?.data?.error ?? error.data)
    : { httpCode: error?.error?.code, message: error?.error?.description },
});

interface IDetokenizeVariant {
  buildRequest(
    client: Client,
    tokenIdRecords: IRevealRecord[] | IRevealRecordComposable[],
    options: Record<string, any> | undefined,
    authToken: string,
  ): Promise<any> | undefined;
  parseSuccess(response: any): FlowDBDetokenizeResponse;
  parseError(error: any): FlowDBDetokenizeResponse | FlowDBDetokenizeRequestError;
}

// When the flowDB detokenize API rejects with a non-2xx status it can still return
// a body carrying a `response` array (partial failure). In that case route it through
// the success constructor so per-token results/errors flow to the client, and only
// fall back to the top-level error envelope on a full failure.
const parseFlowDBDetokenizeError = (
  error: any,
): FlowDBDetokenizeResponse | FlowDBDetokenizeRequestError => {
  if (Array.isArray(error?.data?.response)) {
    return constructFlowDBDetokenizeResponse(error.data);
  }
  return constructFlowDBDetokenizeError(error);
};

const flowDBDetokenizeVariant: IDetokenizeVariant = {
  buildRequest: (client, tokenIdRecords, options, authToken) => client?.request({
    body: JSON.stringify(
      constructFlowDBDetokenizeRequest(tokenIdRecords, client.config.vaultID, options),
    ),
    requestMethod: 'POST',
    url: `${client.config.vaultURL}/v2/tokens/detokenize`,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
  }),
  parseSuccess: (response) => constructFlowDBDetokenizeResponse(response),
  parseError: (error) => parseFlowDBDetokenizeError(error),
};

const executeDetokenize = (
  variant: IDetokenizeVariant,
  tokenIdRecords: IRevealRecord[] | IRevealRecordComposable[],
  client: Client,
  options: Record<string, any> | undefined,
  authToken: string,
): Promise<FlowDBDetokenizeResponse | FlowDBDetokenizeRequestError> => new Promise((resolve) => {
  try {
    variant.buildRequest(client, tokenIdRecords, options, authToken)
      ?.then((response: any) => {
        resolve(variant.parseSuccess(response));
      })
      ?.catch((error: any) => {
        resolve(variant.parseError(error));
      });
  } catch (error) {
    resolve(variant.parseError(error));
  }
});

export const fetchRecordsByTokenIdFlowDB = (
  tokenIdRecords: IRevealRecord[],
  client: Client,
  purejs: boolean,
  options?: Record<string, any>,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const clientId = client.toJSON()?.metaData?.uuid || '';
  getAccessToken(clientId).then((authToken) => {
    executeDetokenize(
      flowDBDetokenizeVariant, tokenIdRecords, client, options, authToken as string,
    ).then((result) => {
      // Element contract: a full API failure surfaces the raw body as a top-level { error }.
      if (!purejs && (result as FlowDBDetokenizeRequestError).error
        && !(result as FlowDBDetokenizeResponse).records) {
        rootReject({ error: (result as FlowDBDetokenizeRequestError).error });
        return;
      }
      const successRecords = (result as FlowDBDetokenizeResponse).records || [];
      const failedRecords = (result.errors || []).map((errRecord) => {
        const errorData = formatForPureJsFailure(
          { error: { code: errRecord.error?.code, description: errRecord.error?.description } },
          errRecord.token,
          purejs,
        );
        printLog(errorData.error?.description || '', MessageType.ERROR, LogLevel.ERROR);
        return errorData;
      });
      if (purejs) {
        // Keep pure-js detokenize() output unchanged (no per-record httpCode leak).
        const pureRecords = successRecords.map((record: any) => ({
          token: record.token,
          value: record.value,
          ...(record.tokenGroupName ? { tokenGroupName: record.tokenGroupName } : {}),
          ...(record.metadata ? { metadata: record.metadata } : {}),
        }));
        if (failedRecords.length === 0) {
          rootResolve({ records: pureRecords });
        } else if (pureRecords.length === 0) {
          rootReject({ errors: failedRecords });
        } else {
          rootReject({ records: pureRecords, errors: failedRecords });
        }
        return;
      }
      if (failedRecords.length === 0) {
        // flowDB records are richer than @core IRevealResponseType's
        // Record<string,string>[]; the runtime shape is the flowDB contract.
        rootResolve({ records: successRecords as any });
      } else if (successRecords.length === 0) {
        rootReject({ errors: failedRecords });
      } else {
        rootReject({ records: successRecords, errors: failedRecords });
      }
    });
  }).catch((err) => {
    rootReject(err);
  });
});

export const fetchRecordsByTokenIdComposableFlowDB = (
  tokenIdRecords: IRevealRecordComposable[],
  client: Client,
  authToken: string,
  options?: Record<string, any>,
): Promise<IRevealResponseType> => new Promise((rootResolve, rootReject) => {
  const frameIdByToken: Record<string, string> = {};
  tokenIdRecords?.forEach((record) => {
    frameIdByToken[record?.token ?? ''] = record?.iframeName ?? '';
  });

  executeDetokenize(flowDBDetokenizeVariant, tokenIdRecords, client, options, authToken)
    .then((result) => {
      // Full API failure: surface the raw body as a top-level { error }.
      if ((result as FlowDBDetokenizeRequestError).error
        && !(result as FlowDBDetokenizeResponse).records) {
        rootReject({ error: (result as FlowDBDetokenizeRequestError).error });
        return;
      }
      const recordsResponse: Record<string, any>[] = [];
      const errorResponse: Record<string, any>[] = [];

      ((result as FlowDBDetokenizeResponse).records || []).forEach((record) => {
        recordsResponse.push({
          0: {
            token: record.token,
            value: record.value,
            ...(record.tokenGroupName ? { tokenGroupName: record.tokenGroupName } : {}),
            ...(record.metadata ? { metadata: record.metadata } : {}),
            httpCode: record.httpCode,
          },
          frameId: frameIdByToken[record.token] ?? '',
        });
      });

      (result.errors || []).forEach((errRecord) => {
        const errorData = formatForPureJsFailure(
          { error: { code: errRecord.error?.code, description: errRecord.error?.description } },
          errRecord.token,
          false,
        );
        printLog(errorData?.error?.description ?? '', MessageType.ERROR, LogLevel.ERROR);
        errorResponse.push({
          ...errorData,
          frameId: frameIdByToken[errRecord.token] ?? '',
        });
      });

      if (errorResponse.length === 0) {
        rootResolve({ records: recordsResponse });
      } else if (recordsResponse.length === 0) {
        rootReject({ errors: errorResponse });
      } else {
        rootReject({ records: recordsResponse, errors: errorResponse });
      }
    });
});

const normalizeFlowDBMetadata = (metadata: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = { ...metadata };
  if (Object.prototype.hasOwnProperty.call(result, 'table')) {
    result.tableName = result.table;
    delete result.table;
  }
  if (Object.prototype.hasOwnProperty.call(result, 'skyflowID')) {
    result.skyflowId = result.skyflowID;
    delete result.skyflowID;
  }
  return result;
};

export const formatRecordsForClientFlowDB = (
  response: any,
): RevealResponse | RevealError => {
  // Full API failure: pass the raw error body straight through.
  if (response?.error) {
    return { error: response.error };
  }
  const records: RevealResponse['records'] = [];
  (response?.records || []).forEach((record: any) => {
    records.push({
      token: record.token,
      ...(record.tokenGroupName ? { tokenGroupName: record.tokenGroupName } : {}),
      ...(record.metadata && Object.keys(record.metadata).length > 0
        ? { metadata: normalizeFlowDBMetadata(record.metadata) } : {}),
      httpCode: record.httpCode,
    });
  });
  (response?.errors || []).forEach((errorRecord: any) => {
    records.push({
      error: errorRecord.error?.description ?? errorRecord.error,
      token: errorRecord.token,
      httpCode: errorRecord.error?.code,
    });
  });
  return { records };
};

export const formatRecordsForClientComposableFlowDB = (response) => {
  // Full API failure: pass the raw error body straight through.
  if (response?.error) {
    return { error: response.error };
  }

  const records: any[] = [];

  (response?.records || []).forEach((record) => {
    const data = record?.[0] ?? {};
    records.push({
      token: data.token ?? '',
      ...(data.tokenGroupName ? { tokenGroupName: data.tokenGroupName } : {}),
      ...(data.metadata && Object.keys(data.metadata).length > 0
        ? { metadata: normalizeFlowDBMetadata(data.metadata) } : {}),
      httpCode: data.httpCode,
    });
  });

  (response?.errors || []).forEach((errorRecord) => {
    records.push({
      error: errorRecord?.error?.description ?? errorRecord?.error,
      token: errorRecord?.token ?? '',
      httpCode: errorRecord?.error?.code,
    });
  });

  return { records };
};
