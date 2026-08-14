/*
Copyright (c) 2025 Skyflow, Inc.
*/
import { CardType, ElementType } from '@core/constants';
import EventEmitter from '@core/event-emitter';

declare global {
  interface Window {
    CoralogixRum: any;
  }
}

// export type ErrorKey = typeof ERROR_TYPE[keyof typeof ERROR_TYPE];

export enum ErrorType {
  BAD_REQUEST = '400',
  UNAUTHORIZED = '401',
  FORBIDDEN = '403',
  NOT_FOUND = '404',
  TOO_MANY_REQUESTS = '429',
  INTERNAL_SERVER_ERROR = '500',
  BAD_GATEWAY = '502',
  SERVICE_UNAVAILABLE = '503',
  CONNECTION = 'CONNECTION',
  TIMEOUT = 'TIMEOUT',
  ABORT = 'ABORT',
  NETWORK_GENERIC = 'NETWORK_GENERIC',
  OFFLINE = 'OFFLINE',
}

export type ErrorMessages = {
  [key in ErrorType]: string;
};

export enum RedactionType {
  DEFAULT = 'DEFAULT',
  PLAIN_TEXT = 'PLAIN_TEXT',
  MASKED = 'MASKED',
  REDACTED = 'REDACTED',
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum EventName {
  CHANGE = 'CHANGE',
  READY = 'READY',
  FOCUS = 'FOCUS',
  BLUR = 'BLUR',
  SUBMIT = 'SUBMIT',
}

export enum LogLevel{
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
}

export enum Env{
  DEV = 'DEV',
  PROD = 'PROD',
}

export enum MessageType{
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum ValidationRuleType {
  REGEX_MATCH_RULE = 'REGEX_MATCH_RULE',
  LENGTH_MATCH_RULE = 'LENGTH_MATCH_RULE',
  ELEMENT_VALUE_MATCH_RULE = 'ELEMENT_VALUE_MATCH_RULE',
}

export interface IInsertRecordInput {
  records: IInsertRecord[];
}

export interface IInsertRecord {
  table: string;
  fields: Record<string, any>;
  skyflowID?: string;
}

export interface IUpdateRequest {
  table: string;
  fields: Record<string, unknown>;
  skyflowID: string;
}

export interface IUpdateOptions {
  tokens?: boolean;
}

export interface IRevealRecord {
  token?: string;
  redaction?: RedactionType;
  column?: string;
  skyflowID?: string;
  table?: string;
}

export interface IRevealRecordComposable {
  token?: string;
  redaction?: RedactionType;
  column?: string;
  skyflowID?: string;
  table?: string;
  iframeName?: string;
}

export interface IInsertResponse {
  records: IInsertResponseReocrds[];
}
export interface IInsertResponseReocrds {
  table: string;
  fields?: Record<string, any>;
  skyflowID?: string;
}
export interface IRevealResponseType {
  records?: Record<string, string>[];
  errors?: Record<string, any>[];
}
export interface IRenderResponseType {
  fields?: Record<string, any>
  errors?: Record<string, any>
  fileMetadata?: Record<string, any>
}

export interface IDetokenizeInput {
  records: IRevealRecord[];
}

export interface IGetRecord {
  ids?: string[];
  redaction?: RedactionType;
  table: string;
  columnName?:string;
  columnValues?: string[];
}

export interface IGetInput {
  records: IGetRecord[];
}

export interface IGetOptions {
  tokens?: boolean;
}

export interface ISkyflowIdRecord {
  ids: string[];
  redaction: RedactionType;
  table: string;
}

export interface IGetByIdInput {
  records: ISkyflowIdRecord[];
}

export interface Context{
  logLevel:LogLevel
  env:Env
}

export interface IValidationRule {
  type: ValidationRuleType;
  params: any;
}

export interface IUpsertOption {
  table : string;
  column: string;
}

export interface IInsertOptions{
  tokens?: boolean;
  upsert?: IUpsertOption[];
}

export interface IDeleteRecord {
  id: String;
  table: String;
}

export interface IDeleteOptions {}

export interface IDeleteRecordInput {
  // options?: IDeleteOptions;
  records: IDeleteRecord[];
}

export interface IDeleteResponseType {
  records?: Record<string, string>[];
  errors?: Record<string, any>[];
}

export interface MeticsObjectType {
  element_id: string,
  element_type: string[],
  div_id: string,
  container_id: string,
  container_name: string,
  session_id: string,
  vault_id: string,
  vault_url: string,
  events: string[],
  created_at: number,
  region: string,
  mount_start_time?: number,
  mount_end_time?: number,
  error?: string,
  latency?: number,
  status: 'SUCCESS' | 'INITIALIZED' | 'PARTIAL_RENDER' | 'FAILED' | string,
  sdk_name_version: string,
  sdk_client_device_model: string | undefined,
  sdk_client_os_details: string,
  sdk_runtime_details: string
}

export interface SharedMeticsObjectType {
  records: MeticsObjectType[];
}

export interface InsertResponse {
  records?: InsertResponseRecords[],
  errors?: ErrorRecord[],
}

export interface UpdateResponseType {
  skyflowID: string;
  [key: string]: unknown;
}

export interface UpdateResponse {
  updatedField: UpdateResponseType
}

// Variant-neutral collect-response marker; both packages' CollectResponse extend
// it. The @core collect path never reads a field off the response (it resolves
// the raw bus payload), so this asserts no structure.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICollectResponseBase {}
export interface CollectResponse extends ICollectResponseBase, InsertResponse {}
export interface DetokenizeRecord extends IRevealRecord {}
export interface DetokenizeResponse extends IRevealResponseType {}

export interface InsertResponseRecords {
  fields: Record<string, any>,
  table: string,
  skyflow_id?: string,
}

export interface ErrorRecord {
  code: number,
  description: string,
}

export interface GetByIdResponse {
  records?: GetByIdResponseRecord[],
  errors?: ErrorRecord[],
}

export interface GetByIdResponseRecord {
  fields: Record<string, any>,
  table: string,
}

export interface GetResponse {
  records?: GetResponseRecord[],
  errors?: ErrorRecord[],
}

export interface GetResponseRecord {
  fields: Record<string, any>,
  table: string,
}

export interface DeleteResponse {
  records?: DeleteResponseRecord[],
  errors?: DeleteErrorRecords[],
}
export interface DeleteResponseRecord {
  skyflow_id: string,
  deleted: boolean,
}

export interface DeleteErrorRecords {
  id: string,
  error: ErrorRecord,
}

export type Style = string | { [key: string]: Style };

export interface ContainerOptions {
  layout: number[],
  styles?: InputStyles, // check implementation below
  errorTextStyles?: ErrorTextStyles, // check implementation below
}

export interface ErrorTextStyles {
  base?: Record<string, Style>,
  global?: Record<string, Style>,
}

export interface LabelStyles extends ErrorTextStyles {
  focus?: Record<string, Style>,
  requiredAsterisk?: Record<string, Style>,
}

export interface InputStyles extends ErrorTextStyles {
  focus?: Record<string, Style>,
  complete?: Record<string, Style>,
  empty?: Record<string, Style>,
  invalid?: Record<string, Style>,
  cardIcon?: Record<string, Style>,
  copyIcon?: Record<string, Style>,
}

// Variant-neutral collect-element options: the fields common to both packages
// (required/format/translation, card options read by the shared `formatOptions`,
// copy, masking). The privacyDB-only file options (`allowedFileType`,
// `maxFileSize`, `maxFileCount`, `blockEmptyFiles`, `preserveFileName`) live on
// each package's own `CollectElementOptions extends ICollectElementOptionsBase`
// (flowDB has no file API). @core references this base everywhere it handles
// options; `create()` is per-package and takes the package type.
export interface ICollectElementOptionsBase {
  required?: boolean,
  format?: string,
  translation?: Record<string, string>,
  enableCardIcon?: boolean,
  enableCopy?: boolean,
  cardMetadata?: CardMetadata,
  masking?: boolean,
  maskingChar?: string,
}

export interface CardMetadata {
  scheme?: CardType[],
}

// Variant-neutral shared props for a collect element's create/update input.
// Deliberately omits the identity keys that diverge by package — privacyDB
// `table`/`skyflowID` vs flowDB `tableName`/`skyflowId` — which each package's own
// `CollectElementInput`/`CollectElementUpdateOptions` add on top. `column` is the
// shared column key. Note: `type` is NOT here (update options carry no `type`).
export interface ICollectElementInputBase {
  column?: string,
  label?: string,
  inputStyles?: InputStyles,
  labelStyles?: LabelStyles,
  errorTextStyles?: ErrorTextStyles,
  placeholder?: string,
  altText?: string,
  validations?: IValidationRule[],
}

// Variant-neutral update-options base: shared input props + cardMetadata, NO identity
// keys (privacyDB `table`/`skyflowID` vs flowDB `tableName`/`skyflowId` diverge — each
// package's own `CollectElementUpdateOptions extends ICollectElementUpdateOptionsBase`
// adds them). `CollectElement` is generic over this so `update()` is typed to the
// package's naming; the active keys are still normalized at runtime via
// collectVariant.normalizeUpdateOptions.
export interface ICollectElementUpdateOptionsBase extends ICollectElementInputBase {
  cardMetadata?: CardMetadata,
}

// Core-level, identity-neutral create input: base + `type`. Used for the abstract
// create() signature and the internal ElementGroupItem. Each package defines its
// own public CollectElementInput (base + type + its own identity keys) that is
// structurally assignable to this.
export interface CollectElementInput extends ICollectElementInputBase {
  type: ElementType,
}

// ---- Behavioral contracts --------------------------------------------------
// The interfaces above are data-shape DTOs; the ones below are behavioral
// contracts for the container/element hierarchy. They exist so `@core` can name
// a contract that BOTH packages implement — and so BaseSkyflow's generics can
// bind to a contract instead of a concrete class — without `@core` importing any
// `packages/*` symbol. They are internal: not re-exported from index-node, so the
// published consumer surface is unchanged.

// The shared element surface. `SkyflowElement` (hence CollectElement /
// RevealElement) implements it; used to type the cross-container element
// registry that was previously `any[]`. NOTE: the composable element classes
// (ComposableElement / ComposableRevealElement) are standalone and do NOT
// implement this — the composable container contracts below therefore omit
// `create`.
export interface ISkyflowElement {
  mount(domElementSelector: HTMLElement | string): void;
  unmount(): void;
  setError(clientErrorText: string): void;
  resetError(): void;
  setErrorOverride(customErrorText: string): void;
  iframeName(): string;
  getID(): string;
}

// Variant-neutral collect-options marker. Asserts no structure: `tokens`,
// `additionalFields` and `upsert` are all package-divergent (privacyDB carries
// `tokens` + IInsertRecordInput / IUpsertOptions; flowDB drops `tokens` and uses
// IInsertRecordInputType / IFlowDBUpsertOptions), so each package's own
// `ICollectOptions extends ICollectOptionsBase` owns the full shape. The @core
// collect path reads these fields only through the `validateCollectOptions`
// seam via a local structural cast, never through this bound.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICollectOptionsBase {}

// Collect-side key normalization the shared @core/external/collect layer needs
// from a package, injected via the abstract `collectVariant` protected field on
// the collect containers (each package binds its own value). The two variants
// disagree on input key naming: flowDB accepts the client-facing
// `skyflowId`/`tableName` and remaps them onto the internal `skyflowID`/`table`
// the SET_VALUE handler consumes and carries the id as `skyflowId`; privacyDB
// uses the internal `skyflowID` directly (a no-op normalize).
export interface VariantCollectAdapter {
  /**
   * Normalize a `CollectElement.update()` options object in place to the internal
   * key names. privacyDB is a no-op; flowDB maps `skyflowId`->`skyflowID` and
   * `tableName`->`table`.
   */
  normalizeUpdateOptions(options: Record<string, any>): void;

  /**
   * The key carrying the skyflow id on a stored element options object, used by
   * container validation (privacyDB `skyflowID` vs flowDB `skyflowId`).
   */
  readonly skyflowIdKey: string;
}

// Container contracts. Generic so each package's own option/response/element
// types flow through. `create`'s element is typed to the shared ISkyflowElement
// surface. BaseSkyflow only ever constructs and returns these, so the contracts
// are documentary + a bound; they are not called through.
export interface ICollectContainer<
  TOptions extends ICollectOptionsBase = ICollectOptionsBase,
  TResponse extends ICollectResponseBase = ICollectResponseBase,
> {
  create(input: ICollectElementInputBase, options?: ICollectElementOptionsBase): ISkyflowElement;
  collect(options?: TOptions): Promise<TResponse>;
  setError(errors: Partial<Record<ErrorType, string>>): void;
  uploadFiles?(options?: TOptions): Promise<UploadFilesResponse>;
}

export interface IRevealContainer<
  TInput = any,
  TRevealOptions = any,
  TResponse extends IRevealResponseBase = RevealResponse,
  TElement = ISkyflowElement,
> {
  create(record: TInput, options?: IRevealElementOptions): TElement;
  reveal(options?: TRevealOptions): Promise<TResponse>;
  setError(errors: Partial<Record<ErrorType, string>>): void;
}

export interface IComposableCollectContainer<
  TResponse extends ICollectResponseBase = ICollectResponseBase,
> {
  collect(options?: ICollectOptionsBase): Promise<TResponse>;
  on(eventName: string, handler: Function): void;
  mount(domElement: HTMLElement | string): void;
  unmount(): void;
  setError(errors: Partial<Record<ErrorType, string>>): void;
}

export interface IComposableRevealContainer<
  TRevealOptions = any,
  TResponse extends IRevealResponseBase = RevealResponse,
> {
  reveal(options?: TRevealOptions): Promise<TResponse>;
  mount(domElement: HTMLElement | string): void;
  unmount(): void;
  setError(errors: Partial<Record<ErrorType, string>>): void;
}

export interface MetaData {
  [key: string]: any,
}
export interface EventConfig{
  authToken: string,
  vaultURL: string,
  vaultID: string,
}

export interface UploadFilesResponse {
  fileUploadResponse?: Record<string, any>,
  errorResponse?: Record<string, any>,
}

// Variant-neutral reveal-response marker; both packages' RevealResponse extend it
// (privacyDB `{ success?, errors? }` below, flowDB `{ records }` in internal-types).
// Mirrors ICollectResponseBase — lets RevealContainer be generic over the response.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IRevealResponseBase {}

export interface RevealResponse extends IRevealResponseBase {
  success?: Array<{
    token: string,
    valueType: string,
  }>,
  errors?: Array<{
    error: ErrorRecord,
    token: string,
  }>
}

export interface RenderFileResponse {
  success?: {
    skyflow_id: string,
    column: string,
  },
  errors?: {
    skyflowId: string,
    error: ErrorRecord,
    column: string,
  },
}

// Variant-neutral element-state base. `value` is omitted here because it diverges:
// privacyDB includes `Blob` (file elements), flowDB does not (no file API). Each
// package's own `ElementState extends IElementStateBase` declares `value` with its
// own type. `selectedCardScheme` is common (cards are supported by both).
export interface IElementStateBase {
  isEmpty: boolean,
  isValid: boolean,
  isFocused: boolean,
  isRequired: boolean,
  selectedCardScheme?: string,
}

// Container / config / reveal-option types — variant-neutral. Relocated here so
// shared code depends on them downward instead of importing up into skyflow.ts
// / reveal-container.ts (which now re-export these under the same public names).
export enum ContainerType {
  COLLECT = 'COLLECT',
  REVEAL = 'REVEAL',
  COMPOSABLE = 'COMPOSABLE',
  COMPOSE_REVEAL = 'COMPOSABLE_REVEAL',
}

export interface SkyflowConfigOptions {
  logLevel?: LogLevel;
  env?: Env;
  trackingKey?: string;
  trackMetrics?: boolean;
  customElementsURL?: string;
}

export interface ISkyflow {
  vaultID?: string;
  vaultURL?: string;
  getBearerToken: () => Promise<string>;
  options?: SkyflowConfigOptions;
}

export interface IRevealElementOptions {
  enableCopy?: boolean;
  format?: string;
  translation?:Record<string, string>
}

// Internal element/frame types — variant-neutral. Relocated from
// core/internal/internal-types (which re-exports them and keeps the
// privacyDB-coupled internal types that reference container classes / client).
export interface ElementInfo {
  frameId: string;
  elementId: string;
}

export interface ContainerProps {
  containerId: string;
  isMounted: boolean;
  type: string;
}

export interface RevealContainerProps {
  containerId: string;
  isMounted: boolean;
  eventEmitter: EventEmitter;
  type: string;
}

export interface InternalState {
  metaData: any;
  isEmpty: boolean,
  isValid: boolean,
  isFocused: boolean,
  isRequired: boolean,
  name: string;
  elementType: ElementType;
  isComplete: boolean;
  value: string | Blob | undefined;
  selectedCardScheme: string;
}

export interface BatchInsertRequestBody {
  method: string;
  quorum?: boolean;
  tableName: string;
  fields?: Record<string, any>;
  upsert?: string;
  ID?: string;
  tokenization?: boolean;
  [key: string]: any;
}

// Internal plumbing only: the privacyDB file options the SHARED formatter/pipeline
// physically processes (for FILE_INPUT / MULTI_FILE_INPUT elements). It is NOT a
// public contract — each package's public `CollectElementOptions` is
// `ICollectElementOptionsBase` plus its own additions (privacyDB adds these file
// fields; flowDB adds none). Kept here so `@core`'s `formatOptions` can stay typed
// without importing a package symbol; the file branch never runs for flowDB.
export interface IFileCollectElementOptions {
  preserveFileName?: boolean,
  allowedFileType?: string[],
  blockEmptyFiles?: boolean,
  maxFileSize?: number,
  maxFileCount?: number,
}

export interface FormattedCollectElementOptions
  extends ICollectElementOptionsBase, IFileCollectElementOptions {
  [key: string]: any;
}

export interface ClientMetadata {
  uuid: string,
  clientDomain: string,
  sdkVersion?: string;
  sessionId?: string;
}

// Variant-neutral base for the per-package `Metadata` object threaded through
// the shared element/frame layer (the lifted `@core/external/common/iframe` and
// `@core/external/collect/collect-element` reference this, not a package type).
// The two container-typed fields are `any` here because each package narrows
// them to its own container classes; every package `Metadata` is structurally
// assignable to this base, so callers keep passing their precise type.
export interface ICoreMetadata extends ClientMetadata {
  clientJSON: any;
  containerType: ContainerType;
  skyflowContainer: any;
  getSkyflowBearerToken: () => Promise<string>;
}
