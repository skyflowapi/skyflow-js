/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB (/v2) internal request/response wire types. These describe the flowDB
// vault API bodies and the normalized records/errors surfaced to the element
// iframes and the public response contract. Ported from the 2.9.0-beta.1 tag;
// RedactionType is reused from @core (not redefined), UpdateType from the
// flowvault common surface.
import {
  RedactionType, ContainerType, ClientMetadata, ElementInfo, ICollectResponseBase,
  IRevealResponseBase,
} from '@core/types';
import { ElementType } from '@core/constants';
import { UpdateType, ICollectOptions } from '../../utils/common';

// COLLECT tokenize input consumed by the skyflow-frame-controller. Mirrors the
// privacyDB shape but over flowDB's ICollectOptions.
export interface TokenizeDataInput extends ICollectOptions {
  type: string;
  elementIds: Array<ElementInfo>;
  containerId: string;
}

// Variant-neutral internal types re-exported from @core so copied element files'
// `../../internal/internal-types` imports resolve here. The flowDB wire types
// below are defined locally.
export type {
  ElementInfo,
  ContainerProps,
  RevealContainerProps,
  InternalState,
  BatchInsertRequestBody,
  FormattedCollectElementOptions,
  ClientMetadata,
} from '@core/types';

// Element metadata surfaced to the collect element/iframe classes. Mirrors the
// privacyDB `Metadata` but with loosely-typed clientJSON / skyflowContainer
// (flowvault does not import the privacyDB container classes).
export interface SkyflowElementProps {
  id: string;
  type: ElementType;
  element: HTMLElement;
  container: any;
}

export interface Metadata extends ClientMetadata {
  clientJSON: any;
  containerType: ContainerType;
  skyflowContainer: any;
  getSkyflowBearerToken: () => Promise<string>;
}

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
  // Insert/update responses (RecordResponseObject) always carry httpCode — the
  // flowdb.proto marks it `required` — so it is non-optional here and needs no cast.
  httpCode: number;
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
// `tokens` and `hashedData` are keyed by the dynamic column name (e.g.
// "card_number"); each value is a list of per-token / per-hash entries.
export interface CollectRecordToken {
  token: string;
  tokenGroupName?: string;
  // Present only for nested JSON columns (dotted/bracketed sub-path, e.g.
  // "street", "phone_numbers[1].number[0]"); flat columns omit it.
  path?: string;
}

export interface CollectRecordHashedData {
  data: string;
  hashName: string;
}

export interface CollectRecord {
  tableName?: string;
  skyflowId?: string;
  tokens?: Record<string, CollectRecordToken[]>;
  hashedData?: Record<string, CollectRecordHashedData[]>;
  // Real insert/update records (RecordResponseObject) always carry httpCode (the
  // flowdb.proto marks it `required`), but a mixed collect also folds a
  // fully-failed sibling endpoint into a synthesized inline error record whose
  // httpCode is only present when the error envelope carried a numeric code —
  // hence optional on the public contract.
  httpCode?: number;
  error?: string;
}

export interface CollectResponse extends ICollectResponseBase {
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
export interface RevealRecordMetadata {
  skyflowId?: string;
  tableName?: string;
}

export interface RevealRecord {
  token: string;
  tokenGroupName?: string;
  metadata?: RevealRecordMetadata;
  // Detokenize responses (FlowDetokenizeResponseObject) do NOT mark httpCode
  // `required` in flowdb.proto, and the error path sources it from `error?.code`,
  // so it can be absent — optional to keep the public contract honest.
  httpCode?: number;
  error?: string;
}

export interface RevealResponse extends IRevealResponseBase {
  records: Array<RevealRecord>;
}

export interface RevealError {
  error: FlowDBFullError;
}
