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
// bodies live in ../../internal/internal-types.

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
} from '@core/types';
export type {
  IRevealElementOptions,
  ErrorMessages,
  IValidationRule,
  Style,
  ContainerOptions,
  ErrorTextStyles,
  LabelStyles,
  InputStyles,
  FormattedCollectElementOptions,
  CardMetadata,
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
  IRevealResponseType,
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
  ICollectOptionsBase,
  ICollectElementOptionsBase,
  ICollectElementUpdateOptionsBase,
  IElementStateBase,
  CollectElementInput as ICoreCollectElementInput,
} from '@core/types';

// flowDB collect element options: shared base only — flowDB has no file API, so
// no file options; declared for symmetry + future flowDB-only options. See 2.3.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CollectElementOptions extends ICollectElementOptionsBase {
  returnMockValue?: boolean;
}

// flowDB element state: shared base + `value` without `Blob` (no file elements).
// See Decision 2.5.
export interface ElementState extends IElementStateBase {
  value: string | Object | undefined;
}

// flowDB collect element input. Extends the neutral input with the flowDB
// client-facing keys `tableName` / `skyflowId` (mapped internally to the
// pipeline's `table` / `skyflowID`).
export interface CollectElementInput extends ICoreCollectElementInput {
  tableName?: string;
  skyflowId?: string;
}

// flowDB collect-element update options: shared base + flowDB client-facing identity
// keys. Binds `CollectElement`/`CollectContainer`'s `TUpdateOptions` so
// `element.update()` is typed to flowDB naming (`tableName`/`skyflowId`). See 2.1.
export interface CollectElementUpdateOptions extends ICollectElementUpdateOptionsBase {
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

// flowDB additionalFields input. Non-PCI data inserted/updated alongside the
// collected elements, in flowDB naming (`tableName`/`data`/`skyflowId`) —
// intentionally distinct from privacyDB's `{ table, fields }` record shape.
// `skyflowId` targets an existing record for update; omit it to insert.
export interface AdditionalFieldsRecord {
  tableName: string;
  data: Record<string, any>;
  skyflowId?: string;
}

export interface AdditionalFields {
  records: AdditionalFieldsRecord[];
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

// flowDB collect options. Extends the @core marker. No `tokens` (flowDB forces
// tokens on). `upsert` uses the flowDB upsert shape (IFlowDBUpsertOptions), whose
// per-table `updateType` drives the update variant — there is no top-level
// `updateType`.
export interface ICollectOptions extends ICollectOptionsBase {
  additionalFields?: AdditionalFields;
  upsert?: Array<IFlowDBUpsertOptions>;
}
