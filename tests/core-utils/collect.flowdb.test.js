import Client from '../../src/client';
import {
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
    const options = { tokens: true, upsert: [{ table: 'table1', column: 'card_number' }] };
    const req = constructFlowDBInsertRequest(finalInsertRecords, options, 'vault123');
    expect(req.records[0].upsert).toEqual({ uniqueColumns: ['card_number'] });
    expect(req.records[1].upsert).toBeUndefined();
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

  test('builds { table, fields: { skyflow_id, ...tokens } } when tokens enabled', () => {
    const res = constructFlowDBInsertResponse(responseBody, true);
    expect(res).toEqual({
      records: [
        {
          table: 'table1',
          fields: {
            skyflow_id: 'id1',
            card_number: [{ token: 'tok-1', tokenGroupName: 'nondeterministic' }],
          },
        },
      ],
      errors: [],
    });
  });

  test('fields has only skyflow_id when tokens disabled', () => {
    const res = constructFlowDBInsertResponse(responseBody, false);
    expect(res.records[0].fields).toEqual({ skyflow_id: 'id1' });
  });

  test('splits per-record error into errors array using tableName/httpCode', () => {
    const body = {
      records: [
        { skyflowID: 'ok1', tableName: 'table1', httpCode: 200, tokens: {} },
        { tableName: 'table2', httpCode: 404, error: 'not found' },
      ],
    };
    const res = constructFlowDBInsertResponse(body, true);
    expect(res.records).toHaveLength(1);
    expect(res.records[0].fields.skyflow_id).toBe('ok1');
    expect(res.errors).toEqual([
      { table: 'table2', error: { code: 404, description: 'not found' } },
    ]);
  });

  test('includes hashedData only when non-empty', () => {
    const body = {
      records: [
        { skyflowID: 'a', tableName: 't', httpCode: 200, tokens: {}, hashedData: { ssn: [{ data: 'h', hashName: 'hash1' }] } },
        { skyflowID: 'b', tableName: 't', httpCode: 200, tokens: {}, hashedData: {} },
        { skyflowID: 'c', tableName: 't', httpCode: 200, tokens: {} },
      ],
    };
    const res = constructFlowDBInsertResponse(body, true);
    expect(res.records[0].hashedData).toEqual({ ssn: [{ data: 'h', hashName: 'hash1' }] });
    expect(res.records[1]).not.toHaveProperty('hashedData');
    expect(res.records[2]).not.toHaveProperty('hashedData');
  });
});

describe('constructFlowDBInsertError', () => {
  test('wraps error code/description in errors array', () => {
    const out = constructFlowDBInsertError({ error: { code: 500, description: 'boom' } });
    expect(out).toEqual({ errors: [{ error: { code: 500, description: 'boom' } }] });
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

describe('insertDataInCollectFlowDB', () => {
  const finalInsertRecords = { records: [{ table: 'table1', fields: { ssn: '999' } }] };

  test('resolves with parsed { records, errors } on success', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      records: [{ skyflowID: 'id1', tableName: 'table1', httpCode: 200, tokens: { ssn: [{ token: 't1', tokenGroupName: 'det' }] } }],
    });
    const out = await insertDataInCollectFlowDB(undefined, client, { tokens: true }, finalInsertRecords, 'auth-token');
    expect(out).toEqual({
      records: [{ table: 'table1', fields: { skyflow_id: 'id1', ssn: [{ token: 't1', tokenGroupName: 'det' }] } }],
      errors: [],
    });
  });

  test('always resolves with { errors } on request failure', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockRejectedValue({ error: { code: 500, description: 'insert failed' } });
    const out = await insertDataInCollectFlowDB(undefined, client, { tokens: true }, finalInsertRecords, 'auth-token');
    expect(out).toEqual({ errors: [{ error: { code: 500, description: 'insert failed' } }] });
    expect(out.records).toBeUndefined();
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
      records: [{ table: 'table1', fields: { skyflow_id: 'id1', name: [{ token: 't1', tokenGroupName: 'det' }] } }],
      errors: [],
    });
  });

  test('always resolves with { errors } on request failure', async () => {
    const client = buildClient();
    jest.spyOn(client, 'request').mockRejectedValue({ error: { code: 400, description: 'update failed' } });
    const out = await updateDataInCollectFlowDB(undefined, client, { tokens: true }, finalUpdateRecords, 'auth-token');
    expect(out).toEqual({ errors: [{ error: { code: 400, description: 'update failed' } }] });
  });
});
