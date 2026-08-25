/*
Copyright (c) 2025 Skyflow, Inc.
*/
import SkyflowError, { ISkyflowError } from '@core/errors';

export interface IFlowDBError {
  grpcCode?: number;
  httpCode?: number | string;
  message?: string;
  httpStatus?: string;
  details?: any[];
}

// The flowDB API returns error bodies with snake_case keys
// (grpc_code, http_code, http_status). Normalize them to the SDK camelCase
// convention, accepting either casing and emitting only the keys that are
// present so pass-through and fallback shapes stay minimal. Also accepts the
// internal SkyflowError shape (`code`/`description`) and a bare message string
// so every rejection that reaches the wrapper stays informative.
export const normalizeFlowDBError = (raw: any = {}): IFlowDBError => {
  if (typeof raw === 'string') return { message: raw };
  const grpcCode = raw?.grpcCode ?? raw?.grpc_code;
  const httpCode = raw?.httpCode ?? raw?.http_code ?? raw?.code;
  const httpStatus = raw?.httpStatus ?? raw?.http_status;
  const message = raw?.message ?? raw?.description;
  const { details } = raw ?? {};
  return {
    ...(grpcCode !== undefined ? { grpcCode } : {}),
    ...(httpCode !== undefined ? { httpCode } : {}),
    ...(message !== undefined ? { message } : {}),
    ...(httpStatus !== undefined ? { httpStatus } : {}),
    ...(details !== undefined ? { details } : {}),
  };
};

// Thrown on a full flowDB API failure (an error body without a `records` object).
// Exposes the flowDB error contract in camelCase alongside a standard Error
// `message`. Unlike the 2.9.0-beta.1 version (which extended `Error` directly),
// this extends the variant-neutral @core `SkyflowError` base, so
// `instanceof SkyflowError` holds and flowvault's public `SkyflowError` export
// is this class — while the flowDB-specific fields (grpcCode/httpCode/
// httpStatus/details) and the camelCase `error` object are added on top.
export default class SkyflowFlowDBError extends SkyflowError {
  grpcCode?: number;

  httpCode?: number | string;

  httpStatus?: string;

  details?: any[];

  // Superset of the neutral base's `ISkyflowError` (so this override is
  // assignable to `SkyflowError.error`) carrying the flowDB camelCase fields.
  error: IFlowDBError & ISkyflowError;

  constructor(errorBody: any = {}) {
    const normalized = normalizeFlowDBError(errorBody);
    const code = normalized.httpCode ?? normalized.grpcCode ?? '';
    const description = normalized.message ?? '';
    // Feed the neutral base a structured ISkyflowError so `.message` and
    // `instanceof SkyflowError` behave like the shared base.
    super({ code, description }, [], true);
    this.name = 'SkyflowError';
    this.grpcCode = normalized.grpcCode;
    this.httpCode = normalized.httpCode;
    this.httpStatus = normalized.httpStatus;
    this.details = normalized.details;
    this.error = { ...normalized, code, description };
  }
}
