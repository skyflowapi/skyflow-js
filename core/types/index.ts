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

export interface CollectResponse extends InsertResponse {}
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

export interface CollectElementOptions {
  required?: boolean,
  format?: string,
  translation?: Record<string, string>,
  enableCardIcon?: boolean,
  enableCopy?: boolean,
  cardMetadata?: CardMetadata,
  preserveFileName?: boolean,
  allowedFileType?: string[],
  blockEmptyFiles?: boolean,
  maxFileSize?: number,
  maxFileCount?: number,
  masking?: boolean,
  maskingChar?: string,
}

export interface CardMetadata {
  scheme?: CardType[],
}

interface CollectElementCommonProps {
  table?: string,
  column?: string,
  label?: string,
  inputStyles?: InputStyles,
  labelStyles?: LabelStyles,
  errorTextStyles?: ErrorTextStyles,
  placeholder?: string,
  altText?: string,
  validations?: IValidationRule[],
  skyflowID?: string,
}

export interface CollectElementUpdateOptions extends CollectElementCommonProps {
  cardMetadata?: CardMetadata,
}

export interface CollectElementInput extends CollectElementCommonProps {
  type: ElementType,
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

export interface RevealResponse {
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

export interface ElementState {
  isEmpty: boolean,
  isValid: boolean,
  isFocused: boolean,
  value: string | Object | Blob | undefined,
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

export interface FormattedCollectElementOptions extends CollectElementOptions {
  [key: string]: any;
}

export interface ClientMetadata {
  uuid: string,
  clientDomain: string,
  sdkVersion?: string;
  sessionId?: string;
}
