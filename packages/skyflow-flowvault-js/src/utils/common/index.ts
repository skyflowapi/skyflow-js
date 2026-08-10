/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault (flowDB) shared type surface.
//
// Variant-neutral types (enums, element/style/config/option interfaces) are
// REUSED from `@core/types` — re-exported here, never redefined — so flowvault
// and skyflow-js stay structurally aligned on the shared pieces. Only the
// flowDB-specific public input types (upsert / reveal input / reveal options)
// and the `UpdateType` enum are defined locally; the flowDB request/response
// bodies live in ../../core/internal/internal-types.

// --- Reused, variant-neutral @core types (do not redefine) ---
export {
  ErrorType,
  RedactionType,
  RequestMethod,
  EventName,
  LogLevel,
  Env,
  MessageType,
  ValidationRuleType,
  ContainerType,
  IRevealElementOptions,
} from '@core/types';
export type {
  ErrorMessages,
  IValidationRule,
  Style,
  ContainerOptions,
  ErrorTextStyles,
  LabelStyles,
  InputStyles,
  CollectElementOptions,
  CollectElementUpdateOptions,
  FormattedCollectElementOptions,
  CardMetadata,
  ElementState,
  MetaData,
  EventConfig,
  SkyflowConfigOptions,
  ISkyflow,
  Context,
  ElementInfo,
  ContainerProps,
  RevealContainerProps,
  InternalState,
  ClientMetadata,
  BatchInsertRequestBody,
  MeticsObjectType,
  SharedMeticsObjectType,
  IRevealRecord,
  IRevealRecordComposable,
  UploadFilesResponse,
  IInsertRecordInput,
  IDetokenizeInput,
  IGetInput,
  IGetOptions,
  IGetByIdInput,
  IDeleteRecordInput,
  IUpdateRequest,
  IUpdateOptions,
} from '@core/types';

// Type-only imports used by the flowDB definitions below.
// eslint-disable-next-line import/first
import type {
  IInsertRecordInput as IInsertRecordInputType,
  CollectElementInput as ICoreCollectElementInput,
} from '@core/types';

// flowDB collect element input. Extends the neutral input with the flowDB
// client-facing keys `tableName` / `skyflowId` (mapped internally to the
// pipeline's `table` / `skyflowID`).
export interface CollectElementInput extends ICoreCollectElementInput {
  tableName?: string;
  skyflowId?: string;
}

// --- flowDB-specific update semantics ---
export enum UpdateType {
  UPDATE = 'UPDATE',
  REPLACE = 'REPLACE',
}

// --- flowDB public input types ---

// Upsert config for a flowDB collect insert (per table). PDB's upsert is
// { table, column }; flowDB's is { tableName, uniqueColumns, updateType } —
// intentionally different (see package-split decisions).
export interface IFlowDBUpsertOptions {
  tableName: string;
  uniqueColumns: string[];
  updateType?: UpdateType;
}

// flowDB reveal element input — token-based only (no redaction / skyflowID /
// table / column / file-render keys). Redaction is supplied via reveal options.
export interface IFlowDBRevealElementInput {
  token?: string;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}

// Per-token-group redaction supplied through flowDB reveal options.
export interface TokenGroupRedaction {
  tokenGroupName: string;
  redaction: string;
}

export interface IRevealOptions {
  tokenGroupRedactions?: TokenGroupRedaction[];
}

// flowDB collect options. Unlike privacyDB, `upsert` uses the flowDB upsert shape
// (IFlowDBUpsertOptions) and an optional top-level `updateType` drives the flowDB
// update variant.
export interface ICollectOptions {
  tokens?: boolean;
  additionalFields?: IInsertRecordInputType;
  upsert?: Array<IFlowDBUpsertOptions>;
  updateType?: UpdateType;
}
