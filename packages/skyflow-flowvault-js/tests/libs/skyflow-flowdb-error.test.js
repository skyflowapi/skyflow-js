/*
Copyright (c) 2025 Skyflow, Inc.
*/
import SkyflowError from '@core/errors';
import SkyflowFlowDBError, { normalizeFlowDBError } from '../../src/libs/skyflow-flowdb-error';

describe('normalizeFlowDBError', () => {
  it('maps snake_case flowDB keys to camelCase', () => {
    expect(
      normalizeFlowDBError({
        grpc_code: 5,
        http_code: 404,
        http_status: 'NOT_FOUND',
        message: 'not found',
        details: [{ a: 1 }],
      }),
    ).toEqual({
      grpcCode: 5,
      httpCode: 404,
      httpStatus: 'NOT_FOUND',
      message: 'not found',
      details: [{ a: 1 }],
    });
  });

  it('accepts camelCase input unchanged', () => {
    expect(
      normalizeFlowDBError({
        grpcCode: 3, httpCode: 400, httpStatus: 'BAD', message: 'bad',
      }),
    ).toEqual({
      grpcCode: 3, httpCode: 400, httpStatus: 'BAD', message: 'bad',
    });
  });

  it('emits only the keys that are present (minimal shape)', () => {
    expect(normalizeFlowDBError({ http_code: 500 })).toEqual({ httpCode: 500 });
    expect(normalizeFlowDBError({})).toEqual({});
    expect(normalizeFlowDBError()).toEqual({});
  });

  it('accepts a bare message string', () => {
    expect(normalizeFlowDBError('boom')).toEqual({ message: 'boom' });
  });

  it('accepts the internal SkyflowError code/description shape', () => {
    expect(normalizeFlowDBError({ code: 409, description: 'conflict' }))
      .toEqual({ httpCode: 409, message: 'conflict' });
  });
});

describe('SkyflowFlowDBError', () => {
  it('extends the @core SkyflowError base and surfaces flowDB fields', () => {
    const err = new SkyflowFlowDBError({
      grpc_code: 5,
      http_code: 404,
      http_status: 'NOT_FOUND',
      message: 'nope',
      details: [{ x: 1 }],
    });
    expect(err).toBeInstanceOf(SkyflowError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SkyflowError');
    expect(err.message).toBe('nope');
    expect(err.grpcCode).toBe(5);
    expect(err.httpCode).toBe(404);
    expect(err.httpStatus).toBe('NOT_FOUND');
    expect(err.details).toEqual([{ x: 1 }]);
    expect(err.error).toMatchObject({
      grpcCode: 5,
      httpCode: 404,
      message: 'nope',
      code: 404,
      description: 'nope',
    });
  });

  it('handles an empty error body', () => {
    const err = new SkyflowFlowDBError();
    expect(err).toBeInstanceOf(SkyflowError);
    expect(err.name).toBe('SkyflowError');
    expect(err.error).toEqual({ code: '', description: '' });
  });
});
