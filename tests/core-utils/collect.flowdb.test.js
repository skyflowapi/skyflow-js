import Client from '../../src/client';
import {
  constructElementsInsertReq,
  constructFlowDBInsertRequest,
  constructFlowDBInsertResponse,
  constructFlowDBInsertError,
  constructFlowDBUpdateRequest,
  insertDataInCollectFlowDB,
  updateDataInCollectFlowDB,
} from '../../src/core-utils/collect';

jest.mock('../../src/utils/bus-events', () => ({
  getAccessToken: jest.fn().mockResolvedValue('auth-token'),
}));

const buildClient = () => Client.fromJSON({ config: { vaultID: 'vault123', vaultURL: 'https://vaulturl.com' } });

describe('constructFlowDBInsertRequest', () => {
  const finalInsertRecords = {
    records: [
      { table: 'table1', fields: { card_number: '4111', cvv: '123' } },
      { table: 'table2', fields: { ssn: '999' } },
    ],
  };

  test('maps records to flowDB shape with vaultID at root and tableName per record', () => {
    const req = constructFlowDBInsertRequest(finalInsertRecords, { tokens: true }, 'vault123');
    expect(req).toEqual({
      vaultID: 'vault123',
      records: [
        { tableName: 'table1', data: { card_number: '4111', cvv: '123' } },
        { tableName: 'table2', data: { ssn: '999' } },
      ],
    });
  });

  test('adds upsert uniqueColumns when upsert option matches table', () => {
    const options = { tokens: true, upsert: [{ table: 'table1', uniqueColumns: ['card_number'] }] };
    const req = constructFlowDBInsertRequest(finalInsertRecords, options, 'vault123');
    expect(req.records[0].upsert).toEqual({ uniqueColumns: ['card_number'] });
    expect(req.records[1].upsert).toBeUndefined();
  });

  test('supports multiple uniqueColumns per table', () => {
    const options = {
      tokens: true,
      upsert: [{ table: 'table1', uniqueColumns: ['card_number', 'cvv'] }],
    };
    const req = constructFlowDBInsertRequest(finalInsertRecords, options, 'vault123');
    expect(req.records[0].upsert).toEqual({ uniqueColumns: ['card_number', 'cvv'] });
  });

  test('includes updateType in upsert only when provided', () => {
    const options = {
      tokens: true,
      upsert: [
        { table: 'table1', uniqueColumns: ['card_number'], updateType: 'REPLACE' },
        { table: 'table2', uniqueColumns: ['ssn'] },
      ],
    };
    const req = constructFlowDBInsertRequest(finalInsertRecords, options, 'vault123');
    expect(req.records[0].upsert).toEqual({ uniqueColumns: ['card_number'], updateType: 'REPLACE' });
    expect(req.records[1].upsert).toEqual({ uniqueColumns: ['ssn'] });
    expect(req.records[1].upsert.updateType).toBeUndefined();
  });
});

describe('constructFlowDBInsertResponse', () => {
  const responseBody = {
    records: [
      {
        skyflowID: 'id1',
        tableName: 'table1',
        httpCode: 200,
        tokens: { card_number: [{ token: 'tok-1', tokenGroupName: 'nondeterministic' }] },
      },
    ],
  };

  test('builds { tableName, skyflowId, tokens, httpCode }', () => {
    const res = constructFlowDBInsertResponse(responseBody);
    expect(res).toEqual({
      records: [
        {
          tableName: 'table1',
          skyflowId: 'id1',
          tokens: {
            card_number: [{ token: 'tok-1', tokenGroupName: 'nondeterministic' }],
          },
          httpCode: 200,
        },
      ],
    });
  });

  test('omits skyflowId when null and defaults tokens to empty object', () => {
    const body = {
      records: [
        { skyflowID: null, tableName: 'table1', httpCode: 200 },
      ],
    };
    const res = constructFlowDBInsertResponse(body);
    expect(res.records[0].tokens).toEqual({});
    expect(res.records[0]).not.toHaveProperty('skyflowId');
    expect(res.records[0]).not.toHaveProperty('errors');
  });

  test('inlines per-record error into records without a skyflowId field', () => {
    const body = {
      records: [
        { skyflowID: 'ok1', tableName: 'table1', httpCode: 200, tokens: {} },
        { skyflowID: null, tableName: '', httpCode: 400, error: 'not found' },
      ],
    };
    const res = constructFlowDBInsertResponse(body);
    expect(res).not.toHaveProperty('errors');
    expect(res.records).toHaveLength(2);
    expect(res.records[0]).toEqual({
      tableName: 'table1', skyflowId: 'ok1', tokens: {}, httpCode: 200,
    });
    expect(res.records[1]).toEqual({
      error: 'not found', tableName: '', httpCode: 400,
    });
  });

  test('includes hashedData only when non-empty', () => {
    const body = {
      records: [
        { skyflowID: 'a', tableName: 't', httpCode: 200, tokens: {}, hashedData: { ssn: [{ data: 'h', hashName: 'hash1' }] } },
        { skyflowID: 'b', tableName: 't', httpCode: 200, tokens: {}, hashedData: {} },
        { skyflowID: 'c', tableName: 't', httpCode: 200, tokens: {} },
      ],
    };
    const res = constructFlowDBInsertResponse(body);
    expect(res.records[0].hashedData).toEqual({ ssn: [{ data: 'h', hashName: 'hash1' }] });
    expect(res.records[1]).not.toHaveProperty('hashedData');
    expect(res.records[2]).not.toHaveProperty('hashedData');
  });
});

describe('constructFlowDBInsertError', () => {
  test('passes through raw API error body when present on error.data', () => {
    const out = constructFlowDBInsertError({
      data: {
        error: {
          httpCode: 404,
          message: 'Vault not found.',
          httpStatus: 'Not Found',
          details: [],
        },
      },
    });
    expect(out).toEqual({
      error: {
        httpCode: 404, message: 'Vault not found.', httpStatus: 'Not Found', details: [],
      },
    });
  });

  test('normalizes a snake_case API error body to camelCase', () => {
    const out = constructFlowDBInsertError({
      data: {
        error: {
          grpc_code: 5,
          http_code: 404,
          message: 'Vault not found.',
          http_status: 'Not Found',
          details: [],
        },
      },
    });
    expect(out).toEqual({
      error: {
        grpcCode: 5, httpCode: 404, message: 'Vault not found.', httpStatus: 'Not Found', details: [],
      },
    });
  });

  test('falls back to SkyflowError code/description when no raw body', () => {
    const out = constructFlowDBInsertError({ error: { code: 500, description: 'boom', type: 'INTERNAL_SERVER_ERROR' } });
    expect(out).toEqual({
      error: { httpCode: 500, message: 'boom' },
    });
  });
});

describe('constructFlowDBUpdateRequest', () => {
  const finalUpdateRecords = {
    updateRecords: [
      { table: 'table1', skyflowID: 'id1', fields: { name: 'Vivek', table: 'table1', skyflowID: 'id1' } },
    ],
  };

  test('maps to flowDB update shape, omitting table/skyflowID from data', () => {
    const req = constructFlowDBUpdateRequest(finalUpdateRecords, { tokens: true }, 'vault123');
    expect(req).toEqual({
      vaultID: 'vault123',
      records: [
        { skyflowID: 'id1', tableName: 'table1', data: { name: 'Vivek' } },
      ],
    });
  });

  test('includes updateType when provided in options', () => {
    const req = constructFlowDBUpdateRequest(finalUpdateRecords, { updateType: 'REPLACE' }, 'vault123');
    expect(req.records[0].updateType).toBe('REPLACE');
  });
});

describe('additionalFields (AdditionalFields) → flowDB request bodies', () => {
  test('records without skyflowId become inserts (tableName/data) in the flowDB insert body', () => {
    const options = {
      additionalFields: {
        records: [
          { tableName: 'table1', data: { ssn: '999' } },
        ],
      },
    };
    const [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq({}, {}, options);
    const insertReq = constructFlowDBInsertRequest(finalInsertRecords, options, 'vault123');

    expect(insertReq).toEqual({
      vaultID: 'vault123',
      records: [{ tableName: 'table1', data: { ssn: '999' } }],
    });
    expect(finalUpdateRecords.updateRecords).toHaveLength(0);
  });

  test('records with top-level skyflowId become updates (skyflowID/tableName/data) in the flowDB update body', () => {
    const options = {
      additionalFields: {
        records: [
          { tableName: 'table1', data: { name: 'Vivek' }, skyflowId: 'id1' },
        ],
      },
    };
    const [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq({}, {}, options);
    const updateReq = constructFlowDBUpdateRequest(finalUpdateRecords, { tokens: true }, 'vault123');

    expect(finalInsertRecords.records).toHaveLength(0);
    expect(updateReq).toEqual({
      vaultID: 'vault123',
      records: [{ skyflowID: 'id1', tableName: 'table1', data: { name: 'Vivek' } }],
    });
  });

  test('mixes inserts and skyflowId updates in a single additionalFields batch', () => {
    const options = {
      additionalFields: {
        records: [
          { tableName: 'table1', data: { ssn: '999' } },
          { tableName: 'table2', data: { name: 'Vivek' }, skyflowId: 'id2' },
        ],
      },
    };
    const [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq({}, {}, options);

    expect(constructFlowDBInsertRequest(finalInsertRecords, options, 'vault123').records)
      .toEqual([{ tableName: 'table1', data: { ssn: '999' } }]);
    expect(constructFlowDBUpdateRequest(finalUpdateRecords, {}, 'vault123').records)
      .toEqual([{ skyflowID: 'id2', tableName: 'table2', data: { name: 'Vivek' } }]);
  });
});

describe('insertDataInCollectFlowDB', () => {
  const finalInsertRecords = { records: [{ table: 'table1', fields: { ssn: '999' } }] };

  test('resolves with parsed { records, errors } on success', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      records: [{ skyflowID: 'id1', tableName: 'table1', httpCode: 200, tokens: { ssn: [{ token: 't1', tokenGroupName: 'det' }] } }],
    });
    const out = await insertDataInCollectFlowDB(undefined, client, { tokens: true }, finalInsertRecords, 'auth-token');
    expect(out).toEqual({
      records: [{
        tableName: 'table1', skyflowId: 'id1', tokens: { ssn: [{ token: 't1', tokenGroupName: 'det' }] }, httpCode: 200,
      }],
    });
  });

  test('always resolves with { error } on request failure', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockRejectedValue({ error: { code: 500, description: 'insert failed' } });
    const out = await insertDataInCollectFlowDB(undefined, client, { tokens: true }, finalInsertRecords, 'auth-token');
    expect(out).toEqual({
      error: { httpCode: 500, message: 'insert failed' },
    });
    expect(out.records).toBeUndefined();
  });

  test('resolves as success when a rejected body carries a records key (partial failure)', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockRejectedValue({
      error: { code: 400, description: 'partial failure' },
      data: {
        records: [
          { skyflowID: 'id1', tableName: 'table1', httpCode: 200, tokens: { ssn: [{ token: 't1', tokenGroupName: 'det' }] } },
          { skyflowID: null, tableName: '', httpCode: 400, error: 'not found' },
        ],
      },
    });
    const out = await insertDataInCollectFlowDB(undefined, client, { tokens: true }, finalInsertRecords, 'auth-token');
    expect(out).not.toHaveProperty('error');
    expect(out.records).toEqual([
      {
        tableName: 'table1', skyflowId: 'id1', tokens: { ssn: [{ token: 't1', tokenGroupName: 'det' }] }, httpCode: 200,
      },
      { error: 'not found', tableName: '', httpCode: 400 },
    ]);
  });
});

describe('updateDataInCollectFlowDB', () => {
  const finalUpdateRecords = {
    updateRecords: [{ table: 'table1', skyflowID: 'id1', fields: { name: 'V', table: 'table1', skyflowID: 'id1' } }],
  };

  test('resolves with parsed { records, errors } on success', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      records: [{ skyflowID: 'id1', tableName: 'table1', httpCode: 200, tokens: { name: [{ token: 't1', tokenGroupName: 'det' }] } }],
    });
    const out = await updateDataInCollectFlowDB(undefined, client, { tokens: true }, finalUpdateRecords, 'auth-token');
    expect(out).toEqual({
      records: [{
        tableName: 'table1', skyflowId: 'id1', tokens: { name: [{ token: 't1', tokenGroupName: 'det' }] }, httpCode: 200,
      }],
    });
  });

  test('always resolves with { error } on request failure', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockRejectedValue({ error: { code: 400, description: 'update failed' } });
    const out = await updateDataInCollectFlowDB(undefined, client, { tokens: true }, finalUpdateRecords, 'auth-token');
    expect(out).toEqual({
      error: { httpCode: 400, message: 'update failed' },
    });
  });

  test('resolves as success when a rejected body carries a records key (partial failure)', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockRejectedValue({
      error: { code: 400, description: 'partial failure' },
      data: {
        records: [
          { skyflowID: 'id1', tableName: 'table1', httpCode: 200, tokens: { name: [{ token: 't1', tokenGroupName: 'det' }] } },
        ],
      },
    });
    const out = await updateDataInCollectFlowDB(undefined, client, { tokens: true }, finalUpdateRecords, 'auth-token');
    expect(out).not.toHaveProperty('error');
    expect(out.records).toEqual([
      {
        tableName: 'table1', skyflowId: 'id1', tokens: { name: [{ token: 't1', tokenGroupName: 'det' }] }, httpCode: 200,
      },
    ]);
  });
});
