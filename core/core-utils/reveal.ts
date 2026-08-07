/* eslint-disable import/prefer-default-export */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral reveal formatter: groups response records by token for the
// element iframes. The privacyDB /v1 fetch/parse transport stays in
// src/core-utils/reveal and consumes this helper.
import { IRevealResponseType } from '@core/types';

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
