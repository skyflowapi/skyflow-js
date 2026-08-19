/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB collect-option validators. These validate the flowDB input shapes
// (upsert: { tableName, uniqueColumns, updateType? }; additionalFields:
// { records: [{ tableName, data, skyflowId? }] }) — NOT privacyDB's
// { table, column } / { table, fields }. Guards the two regressions where the
// flowDB containers previously delegated to the privacyDB-shaped @core validators:
//   B1 — a valid flowDB upsert was rejected ("Missing 'table' key ...").
//   B2 — a privacyDB-shaped additionalFields passed validation, then the impl
//        dropped the data and POSTed a record keyed "undefined".
import SkyflowError from '@core/errors';
import {
  validateFlowDBUpsertOptions,
  validateFlowDBAdditionalFieldsInCollect,
  validateCollectElementOptions,
  validateRevealElementRecords,
  validateRevealOptions,
  validateCollectElementInput,
} from '../../src/utils/validators';
import { UpdateType, LogLevel } from '../../src/utils/common';

describe('validateFlowDBUpsertOptions', () => {
  test('B1: accepts a valid flowDB upsert ({ tableName, uniqueColumns })', () => {
    expect(() => validateFlowDBUpsertOptions([
      { tableName: 'cards', uniqueColumns: ['card_number'] },
    ])).not.toThrow();
  });

  test('accepts multiple uniqueColumns and an optional updateType', () => {
    expect(() => validateFlowDBUpsertOptions([
      { tableName: 'cards', uniqueColumns: ['card_number', 'cvv'], updateType: UpdateType.UPDATE },
      { tableName: 'people', uniqueColumns: ['ssn'], updateType: UpdateType.REPLACE },
    ])).not.toThrow();
  });

  test('rejects a non-array', () => {
    expect(() => validateFlowDBUpsertOptions({} as any)).toThrow(SkyflowError);
  });

  test('rejects an empty array', () => {
    expect(() => validateFlowDBUpsertOptions([])).toThrow(SkyflowError);
  });

  test("rejects an entry missing 'tableName' (names tableName, at index)", () => {
    expect(() => validateFlowDBUpsertOptions([{ uniqueColumns: ['card_number'] } as any]))
      .toThrow(/tableName.*index 0/);
  });

  test("rejects an empty 'tableName'", () => {
    expect(() => validateFlowDBUpsertOptions([{ tableName: '', uniqueColumns: ['x'] }]))
      .toThrow(/tableName/);
  });

  test("rejects missing / empty / non-string 'uniqueColumns'", () => {
    expect(() => validateFlowDBUpsertOptions([{ tableName: 'cards' } as any]))
      .toThrow(/uniqueColumns/);
    expect(() => validateFlowDBUpsertOptions([{ tableName: 'cards', uniqueColumns: [] }]))
      .toThrow(/uniqueColumns/);
    expect(() => validateFlowDBUpsertOptions([{ tableName: 'cards', uniqueColumns: [123] as any }]))
      .toThrow(/uniqueColumns/);
  });

  test("rejects an invalid 'updateType'", () => {
    expect(() => validateFlowDBUpsertOptions([
      { tableName: 'cards', uniqueColumns: ['card_number'], updateType: 'FOO' as any },
    ])).toThrow(/updateType/);
  });

  test('rejects a non-object / array / null entry (names the index)', () => {
    expect(() => validateFlowDBUpsertOptions([null as any])).toThrow(/index 0/);
    expect(() => validateFlowDBUpsertOptions(['cards' as any])).toThrow(/index 0/);
    expect(() => validateFlowDBUpsertOptions([[] as any])).toThrow(/index 0/);
  });

  test('regression: rejects the privacyDB upsert shape ({ table, column })', () => {
    expect(() => validateFlowDBUpsertOptions([{ table: 'cards', column: 'card_number' } as any]))
      .toThrow(/tableName/);
  });
});

describe('validateFlowDBAdditionalFieldsInCollect', () => {
  test('B2: accepts the flowDB record shape ({ tableName, data })', () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({
      records: [{ tableName: 'cards', data: { cvv: '123' } }],
    })).not.toThrow();
  });

  test('accepts a string skyflowId, including an empty string (treated as insert)', () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({
      records: [
        { tableName: 'cards', data: { name: 'A' }, skyflowId: 'id1' },
        { tableName: 'cards', data: { name: 'B' }, skyflowId: '' },
      ],
    })).not.toThrow();
  });

  test("rejects a missing 'records' key", () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({} as any)).toThrow(/records/);
  });

  test("rejects non-array / empty 'records'", () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({ records: {} as any })).toThrow(/records/);
    expect(() => validateFlowDBAdditionalFieldsInCollect({ records: [] })).toThrow(/records/);
  });

  test("rejects a record missing / empty 'tableName' (at index)", () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({ records: [{ data: { a: 1 } } as any] }))
      .toThrow(/tableName.*index 0/);
    expect(() => validateFlowDBAdditionalFieldsInCollect({
      records: [{ tableName: '', data: { a: 1 } }],
    })).toThrow(/tableName/);
  });

  test("rejects missing / non-object / array 'data'", () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({ records: [{ tableName: 't' } as any] }))
      .toThrow(/data/);
    expect(() => validateFlowDBAdditionalFieldsInCollect({
      records: [{ tableName: 't', data: [] as any }],
    })).toThrow(/data/);
  });

  test("rejects a non-string 'skyflowId'", () => {
    expect(() => validateFlowDBAdditionalFieldsInCollect({
      records: [{ tableName: 't', data: { a: 1 }, skyflowId: 5 as any }],
    })).toThrow(/skyflowId/);
  });

  test('regression: rejects the privacyDB additionalFields shape ({ table, fields })', () => {
    // Previously this passed the privacyDB validator, then the impl read tableName/data
    // as undefined and POSTed { tableName: "undefined", data: {} }. Now it is rejected.
    expect(() => validateFlowDBAdditionalFieldsInCollect({
      records: [{ table: 'cards', fields: { cvv: '123' } } as any],
    })).toThrow(/tableName/);
  });
});

describe('validateCollectElementOptions', () => {
  test('accepts a boolean returnMockValue', () => {
    expect(() => validateCollectElementOptions({ returnMockValue: true })).not.toThrow();
    expect(() => validateCollectElementOptions({ returnMockValue: false })).not.toThrow();
  });

  test('accepts options without returnMockValue', () => {
    expect(() => validateCollectElementOptions({ required: true })).not.toThrow();
    expect(() => validateCollectElementOptions(undefined)).not.toThrow();
  });

  test('rejects a non-boolean returnMockValue', () => {
    expect(() => validateCollectElementOptions({ returnMockValue: 'true' as any }))
      .toThrow(/returnMockValue/);
    expect(() => validateCollectElementOptions({ returnMockValue: 1 as any }))
      .toThrow(SkyflowError);
  });
});

describe('validateRevealElementRecords', () => {
  test('accepts a valid token-only record (optional string label/altText)', () => {
    expect(() => validateRevealElementRecords([{ token: 'tok-1' }])).not.toThrow();
    expect(() => validateRevealElementRecords([
      { token: 'tok-1', label: 'Card', altText: 'xxxx' } as any,
    ])).not.toThrow();
  });

  test('rejects an empty records array', () => {
    expect(() => validateRevealElementRecords([])).toThrow(SkyflowError);
  });

  test("rejects a record missing the 'token' key", () => {
    expect(() => validateRevealElementRecords([{} as any])).toThrow(SkyflowError);
    expect(() => validateRevealElementRecords([null as any])).toThrow(SkyflowError);
  });

  test('rejects an empty token', () => {
    expect(() => validateRevealElementRecords([{ token: '' }])).toThrow(SkyflowError);
  });

  test('rejects a non-string token', () => {
    expect(() => validateRevealElementRecords([{ token: 123 as any }])).toThrow(SkyflowError);
  });

  test('rejects a non-string label', () => {
    expect(() => validateRevealElementRecords([{ token: 'tok-1', label: 5 as any }]))
      .toThrow(SkyflowError);
  });

  test('rejects a non-string altText', () => {
    expect(() => validateRevealElementRecords([{ token: 'tok-1', altText: 5 as any }]))
      .toThrow(SkyflowError);
  });
});

describe('validateRevealOptions', () => {
  test('is a no-op when options are absent or tokenGroupRedactions is undefined', () => {
    expect(() => validateRevealOptions()).not.toThrow();
    expect(() => validateRevealOptions({})).not.toThrow();
  });

  test('accepts a valid tokenGroupRedactions array', () => {
    expect(() => validateRevealOptions({
      tokenGroupRedactions: [{ tokenGroupName: 'grp1', redaction: 'PLAIN_TEXT' }],
    })).not.toThrow();
  });

  test('rejects a non-array tokenGroupRedactions', () => {
    expect(() => validateRevealOptions({ tokenGroupRedactions: {} as any }))
      .toThrow(/tokenGroupRedactions/);
  });

  test('rejects an entry with an invalid tokenGroupName (names the index)', () => {
    expect(() => validateRevealOptions({
      tokenGroupRedactions: [{ tokenGroupName: '', redaction: 'PLAIN_TEXT' }],
    })).toThrow(/index 0/);
    expect(() => validateRevealOptions({
      tokenGroupRedactions: [{ redaction: 'PLAIN_TEXT' } as any],
    })).toThrow(/index 0/);
  });

  test('rejects an entry with an invalid redaction', () => {
    expect(() => validateRevealOptions({
      tokenGroupRedactions: [{ tokenGroupName: 'grp1', redaction: '' }],
    })).toThrow(/index 0/);
    expect(() => validateRevealOptions({
      tokenGroupRedactions: [null as any],
    })).toThrow(/index 0/);
  });
});

describe('validateCollectElementInput', () => {
  test('accepts a valid input', () => {
    expect(() => validateCollectElementInput({ type: 'CARD_NUMBER' } as any, LogLevel.ERROR))
      .not.toThrow();
  });

  test("rejects an input missing the 'type' key", () => {
    expect(() => validateCollectElementInput({} as any, LogLevel.ERROR)).toThrow(SkyflowError);
  });

  test('rejects an empty type', () => {
    expect(() => validateCollectElementInput({ type: '' } as any, LogLevel.ERROR))
      .toThrow(SkyflowError);
  });

  test('warns (does not throw) when the deprecated altText key is present', () => {
    expect(() => validateCollectElementInput(
      { type: 'CARD_NUMBER', altText: 'xxxx' } as any, LogLevel.WARN,
    )).not.toThrow();
  });

  test('rejects a non-string skyflowId', () => {
    expect(() => validateCollectElementInput(
      { type: 'CARD_NUMBER', skyflowId: 5 } as any, LogLevel.ERROR,
    )).toThrow(SkyflowError);
  });

  test('accepts a string skyflowId', () => {
    expect(() => validateCollectElementInput(
      { type: 'CARD_NUMBER', skyflowId: 'id1' } as any, LogLevel.ERROR,
    )).not.toThrow();
  });
});
