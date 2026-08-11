/* eslint-disable import/prefer-default-export */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral reveal formatter: groups response records by token for the
// element iframes. The privacyDB /v1 fetch/parse transport stays in
// src/api-utils/reveal and consumes this helper.
import { IRevealResponseType } from '@core/types';
import SkyflowError from '@core/errors';

// Token-based generic failure formatter. Variant-neutral — moved here from each
// package's api-utils/reveal so both SDKs share one copy. purejs=true returns a
// plain { code, description }; otherwise the SkyflowError envelope is spread in.
export const formatForPureJsFailure = (cause, tokenId: string, purejs: boolean) => {
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

export const formatRecordsForIframe = (response: IRevealResponseType) => {
  const result: Record<string, any> = {};
  if (response.records) {
    response.records.forEach((record) => {
      const key = record.token;
      const recordData = {
        value: record.value,
        redaction: record.redaction,
      };

      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(recordData);
        } else {
          result[key] = [result[key], recordData];
        }
      } else {
        result[key] = recordData;
      }
    });
  }
  return result;
};
