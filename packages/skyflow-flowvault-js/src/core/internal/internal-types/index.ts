/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB (/v2) internal request/response wire types. These describe the flowDB
// vault API bodies and the normalized records/errors surfaced to the element
// iframes and the public response contract. Ported from the 2.9.0-beta.1 tag;
// RedactionType is reused from @core (not redefined), UpdateType from the
// flowvault common surface.
import { RedactionType } from '@core/types';
import { UpdateType } from '../../../utils/common';

// --- Collect (insert / update) request bodies ---

export interface FlowDBUpsert {
  updateType?: UpdateType;
  uniqueColumns: string[];
}

export interface FlowDBInsertRecordData {
  data: Record<string, any>;
  tokens?: Record<string, any>;
  tableName?: string;
  upsert?: FlowDBUpsert;
}

export interface FlowDBInsertRequestBody {
  vaultID: string | undefined;
  tableName?: string;
  records: FlowDBInsertRecordData[];
  upsert?: FlowDBUpsert;
}

export interface FlowDBUpdateRecordData {
  skyflowID: string;
  data: Record<string, any>;
  tokens?: Record<string, any>;
  tableName?: string;
  updateType?: 'UPDATE' | 'REPLACE';
}

export interface FlowDBUpdateRequestBody {
  vaultID: string | undefined;
  tableName?: string;
  records: FlowDBUpdateRecordData[];
  updateType?: 'UPDATE' | 'REPLACE';
}

// --- Collect response (raw vault + normalized public contract) ---

export interface FlowDBRecordResponse {
  skyflowID: string | null;
  tokens?: Record<string, any>;
  data?: Record<string, any>;
  hashedData?: Record<string, any>;
  error?: string | null;
  httpCode?: number;
  tableName: string;
}

export interface FlowDBInsertResponseBody {
  records: FlowDBRecordResponse[];
}

export interface FlowDBError {
  code?: number | string;
  description?: string;
}

// Public flowDB collect record/response (surfaced to the SDK consumer).
export interface CollectRecord {
  tableName?: string;
  skyflowId?: string;
  tokens?: Record<string, any>;
  hashedData?: Record<string, any>;
  httpCode: number;
  error?: string;
}

export interface CollectResponse {
  records: Array<CollectRecord>;
}

// Full-failure body (no records) — normalized into SkyflowFlowDBError.
export interface FlowDBFullError {
  grpcCode?: number;
  httpCode?: number | string;
  message?: string;
  httpStatus?: string;
  details?: any[];
}

export interface CollectError {
  error: FlowDBFullError;
}

// --- Detokenize (reveal) request/response bodies ---

export interface FlowDBTokenGroupRedaction {
  tokenGroupName: string;
  redaction: RedactionType | string;
}

export interface FlowDBDetokenizeRequestBody {
  vaultID: string | undefined;
  tokens: string[];
  tokenGroupRedactions?: FlowDBTokenGroupRedaction[];
}

export interface FlowDBDetokenizeResponseObject {
  token: string;
  value?: any;
  tokenGroupName?: string | null;
  error?: string | null;
  httpCode?: number;
  metadata?: Record<string, any>;
}

export interface FlowDBDetokenizeResponseBody {
  response: FlowDBDetokenizeResponseObject[];
}

export interface FlowDBDetokenizeResponseRecord {
  token: string;
  value?: any;
  tokenGroupName?: string | null;
  metadata?: Record<string, any>;
  httpCode?: number;
}

export interface FlowDBDetokenizeResponseRecordError {
  token: string;
  error: FlowDBError;
}

export interface FlowDBDetokenizeResponse {
  records: FlowDBDetokenizeResponseRecord[];
  errors: FlowDBDetokenizeResponseRecordError[];
}

export interface FlowDBDetokenizeRequestError {
  errors: FlowDBDetokenizeResponseRecordError[];
  // Raw full-failure body passed through for the element/composable reveal contract.
  error?: FlowDBFullError;
}

// Public flowDB reveal record/response (surfaced to the SDK consumer).
export interface RevealRecord {
  token: string;
  tokenGroupName?: string;
  metadata?: Record<string, any>;
  httpCode: number;
  error?: string;
}

export interface RevealResponse {
  records: Array<RevealRecord>;
}

export interface RevealError {
  error: FlowDBFullError;
}
