/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  constructFlowDBDetokenizeRequest,
  constructFlowDBDetokenizeResponse,
  constructFlowDBDetokenizeError,
  formatRecordsForClientFlowDB,
  formatRecordsForClientComposableFlowDB,
  fetchRecordsByTokenIdFlowDB,
  fetchRecordsByTokenIdComposableFlowDB,
} from '../../src/core-utils/reveal';
import { Env, LogLevel, RedactionType } from '../../src/utils/common';
import Client from '../../src/client';

jest.mock('../../src/utils/bus-events', () => ({
  getAccessToken: jest.fn(() => Promise.resolve('mockAccessToken')),
}));

const skyflowConfig = {
  vaultID: 'vault123',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientJSON = {
  context: { logLevel: LogLevel.ERROR, env: Env.PROD },
  config: { ...skyflowConfig, getBearerToken: jest.fn().toString() },
  metaData: { uuid: 'id' },
};

const makeClient = () => Client.fromJSON(clientJSON);

describe('constructFlowDBDetokenizeRequest', () => {
  it('sends only vaultID and tokens when no redaction info is present', () => {
    const records = [{ token: 'token1' }, { token: 'token2' }];
    const req = constructFlowDBDetokenizeRequest(records, 'vault123');
    expect(req).toEqual({ vaultID: 'vault123', tokens: ['token1', 'token2'] });
    expect(req.tokenGroupRedactions).toBeUndefined();
  });

  it('uses explicit tokenGroupRedactions from options when provided', () => {
    const records = [{ token: 'token1' }];
    const tokenGroupRedactions = [
      { tokenGroupName: 'det_reg_rtf', redaction: RedactionType.PLAIN_TEXT },
    ];
    const req = constructFlowDBDetokenizeRequest(records, 'vault123', { tokenGroupRedactions });
    expect(req).toEqual({ vaultID: 'vault123', tokens: ['token1'], tokenGroupRedactions });
  });

  it('builds tokenGroupRedactions from elements carrying tokenGroupName + redaction', () => {
    const records = [
      { token: 'token1', tokenGroupName: 'grp1', redaction: RedactionType.MASKED },
      { token: 'token2' },
    ];
    const req = constructFlowDBDetokenizeRequest(records, 'vault123');
    expect(req.tokens).toEqual(['token1', 'token2']);
    expect(req.tokenGroupRedactions).toEqual([
      { tokenGroupName: 'grp1', redaction: RedactionType.MASKED },
    ]);
  });
});

describe('constructFlowDBDetokenizeResponse', () => {
  it('splits response into records (with tokenGroupName, no valueType) and inline errors', () => {
    const responseBody = {
      response: [
        { token: 'token1', value: 'Bata Gali', tokenGroupName: 'nondet_reg', error: null, httpCode: 200 },
        { token: 'dummy', value: null, tokenGroupName: null, error: 'token not found', httpCode: 500 },
      ],
    };
    const result = constructFlowDBDetokenizeResponse(responseBody);
    expect(result.records).toEqual([
      { token: 'token1', value: 'Bata Gali', tokenGroupName: 'nondet_reg' },
    ]);
    expect(result.records[0].valueType).toBeUndefined();
    expect(result.errors).toEqual([
      { token: 'dummy', error: { code: 500, description: 'token not found' } },
    ]);
  });

  it('omits tokenGroupName when it is null/absent', () => {
    const responseBody = {
      response: [
        { token: 't1', value: 'a', tokenGroupName: null, httpCode: 200 },
        { token: 't2', value: 'b', httpCode: 200 },
      ],
    };
    const result = constructFlowDBDetokenizeResponse(responseBody);
    expect(result.records[0].tokenGroupName).toBeUndefined();
    expect(result.records[1].tokenGroupName).toBeUndefined();
  });

  it('preserves non-string values', () => {
    const responseBody = {
      response: [{ token: 't', value: [9087, 6543], error: null, httpCode: 200 }],
    };
    const result = constructFlowDBDetokenizeResponse(responseBody);
    expect(result.records[0].value).toEqual([9087, 6543]);
  });

  it('includes metadata only when it is a non-empty object', () => {
    const responseBody = {
      response: [
        { token: 't1', value: 'a', metadata: { table: 'persons', skyflowID: 'id1' }, httpCode: 200 },
        { token: 't2', value: 'b', metadata: {}, httpCode: 200 },
        { token: 't3', value: 'c', httpCode: 200 },
      ],
    };
    const result = constructFlowDBDetokenizeResponse(responseBody);
    expect(result.records[0].metadata).toEqual({ table: 'persons', skyflowID: 'id1' });
    expect(result.records[1].metadata).toBeUndefined();
    expect(result.records[2].metadata).toBeUndefined();
  });

  it('handles an empty/absent response array', () => {
    expect(constructFlowDBDetokenizeResponse({})).toEqual({ records: [], errors: [] });
    expect(constructFlowDBDetokenizeResponse({ response: [] })).toEqual({ records: [], errors: [] });
  });
});

describe('constructFlowDBDetokenizeError', () => {
  it('wraps a request-level failure into the errors shape', () => {
    const err = { error: { code: 500, description: 'network error' } };
    expect(constructFlowDBDetokenizeError(err)).toEqual({
      errors: [{ token: '', error: { code: 500, description: 'network error' } }],
    });
  });
});

describe('formatRecordsForClientFlowDB', () => {
  it('maps success records to token (drops valueType) and includes tokenGroupName/metadata when present', () => {
    const response = {
      records: [
        { token: 't1', value: 'a' },
        { token: 't2', value: 'b', tokenGroupName: 'nondet_reg', metadata: { table: 'persons' } },
      ],
    };
    expect(formatRecordsForClientFlowDB(response)).toEqual({
      success: [
        { token: 't1' },
        { token: 't2', tokenGroupName: 'nondet_reg', metadata: { table: 'persons' } },
      ],
    });
  });

  it('maps errors', () => {
    const response = { errors: [{ token: 't1', error: { code: 404, description: 'nf' } }] };
    expect(formatRecordsForClientFlowDB(response)).toEqual({
      errors: [{ token: 't1', error: { code: 404, description: 'nf' } }],
    });
  });
});

describe('formatRecordsForClientComposableFlowDB', () => {
  it('reads token from index-0 shape and drops valueType', () => {
    const response = { records: [{ 0: { token: 't1', value: 'a' }, frameId: 'f1' }] };
    expect(formatRecordsForClientComposableFlowDB(response)).toEqual({
      success: [{ token: 't1' }],
    });
  });

  it('returns both success and errors when present', () => {
    const response = {
      records: [{ 0: { token: 't1', value: 'a' }, frameId: 'f1' }],
      errors: [{ token: 't2', error: { code: 404 }, frameId: 'f2' }],
    };
    const out = formatRecordsForClientComposableFlowDB(response);
    expect(out.success).toEqual([{ token: 't1' }]);
    expect(out.errors).toEqual([{ error: { code: 404 } }]);
  });
});

describe('fetchRecordsByTokenIdFlowDB', () => {
  it('issues a single batch POST to /v2/tokens/detokenize and resolves records', async () => {
    const client = makeClient();
    const requestSpy = jest.spyOn(client, 'request').mockResolvedValue({
      response: [
        { token: 'token1', value: 'val1', tokenGroupName: 'nondet_reg', httpCode: 200 },
        { token: 'token2', value: 'val2', httpCode: 200 },
      ],
    });

    const result = await fetchRecordsByTokenIdFlowDB(
      [{ token: 'token1' }, { token: 'token2' }], client, true,
    );

    expect(requestSpy).toHaveBeenCalledTimes(1);
    const call = requestSpy.mock.calls[0][0];
    expect(call.requestMethod).toBe('POST');
    expect(call.url).toBe('https://testurl.com/v2/tokens/detokenize');
    expect(JSON.parse(call.body)).toEqual({ vaultID: 'vault123', tokens: ['token1', 'token2'] });
    expect(result).toEqual({
      records: [
        { token: 'token1', value: 'val1', tokenGroupName: 'nondet_reg' },
        { token: 'token2', value: 'val2' },
      ],
    });
  });

  it('rejects with only errors when every token fails inline', async () => {
    const client = makeClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      response: [{ token: 'token1', value: null, error: 'not found', httpCode: 404 }],
    });

    await expect(fetchRecordsByTokenIdFlowDB([{ token: 'token1' }], client, true))
      .rejects.toEqual({
        errors: [{ token: 'token1', error: { code: 404, description: 'not found' } }],
      });
  });

  it('rejects with records and errors on partial success', async () => {
    const client = makeClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      response: [
        { token: 'ok', value: 'v', httpCode: 200 },
        { token: 'bad', value: null, error: 'not found', httpCode: 404 },
      ],
    });

    await expect(
      fetchRecordsByTokenIdFlowDB([{ token: 'ok' }, { token: 'bad' }], client, true),
    ).rejects.toEqual({
      records: [{ token: 'ok', value: 'v' }],
      errors: [{ token: 'bad', error: { code: 404, description: 'not found' } }],
    });
  });

  it('always resolves the executor and rejects with errors on a request-level failure', async () => {
    const client = makeClient();
    jest.spyOn(client, 'request').mockRejectedValue({
      error: { code: 500, description: 'network error' },
    });

    await expect(fetchRecordsByTokenIdFlowDB([{ token: 'token1' }], client, true))
      .rejects.toEqual({
        errors: [{ token: '', error: { code: 500, description: 'network error' } }],
      });
  });
});

describe('fetchRecordsByTokenIdComposableFlowDB', () => {
  it('re-attaches frameId per token and reshapes to index-0 records', async () => {
    const client = makeClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      response: [
        { token: 'token1', value: 'val1', httpCode: 200 },
        { token: 'token2', value: 'val2', metadata: { table: 't' }, httpCode: 200 },
      ],
    });

    const records = [
      { token: 'token1', iframeName: 'frame1' },
      { token: 'token2', iframeName: 'frame2' },
    ];
    const result = await fetchRecordsByTokenIdComposableFlowDB(records, client, 'mockToken');

    expect(client.request).toHaveBeenCalledTimes(1);
    expect(result.records).toEqual([
      { 0: { token: 'token1', value: 'val1' }, frameId: 'frame1' },
      { 0: { token: 'token2', value: 'val2', metadata: { table: 't' } }, frameId: 'frame2' },
    ]);
  });

  it('rejects with errors carrying frameId when all tokens fail', async () => {
    const client = makeClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      response: [{ token: 'token1', error: 'not found', httpCode: 404 }],
    });

    await expect(
      fetchRecordsByTokenIdComposableFlowDB([{ token: 'token1', iframeName: 'frame1' }], client, 'mockToken'),
    ).rejects.toEqual({
      errors: [expect.objectContaining({ token: 'token1', frameId: 'frame1' })],
    });
  });

  it('rejects with both records and errors on partial success', async () => {
    const client = makeClient();
    jest.spyOn(client, 'request').mockResolvedValue({
      response: [
        { token: 'ok', value: 'v', httpCode: 200 },
        { token: 'bad', error: 'not found', httpCode: 404 },
      ],
    });

    const records = [
      { token: 'ok', iframeName: 'frame1' },
      { token: 'bad', iframeName: 'frame2' },
    ];
    await expect(fetchRecordsByTokenIdComposableFlowDB(records, client, 'mockToken'))
      .rejects.toEqual({
        records: [{ 0: { token: 'ok', value: 'v' }, frameId: 'frame1' }],
        errors: [expect.objectContaining({ token: 'bad', frameId: 'frame2' })],
      });
  });
});
