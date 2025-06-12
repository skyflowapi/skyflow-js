import { IUpsertOptions } from '../../core-utils/collect';
import { CardType, ElementType } from '../../core/constants';

/*
Copyright (c) 2022 Skyflow, Inc.
*/
declare global {
  interface Window {
    CoralogixRum: any;
  }
}

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

export interface IRevealRecord {
  token?: string;
  redaction?: RedactionType;
  column?: string;
  skyflowID?: string;
  table?: string;
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

export interface CollectResponse extends InsertResponse {}
export interface DetokenizeResponse extends IRevealResponseType {}

export interface InsertResponseRecords {
  fields: Record<string, any>,
  table: string,
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

export interface ContainerOptions {
  layout: number[],
  styles?: InputStyles, // check implementation below
  errorTextStyles?: ErrorTextStyles, // check implementation below
}

export interface ErrorTextStyles {
  base?: Record<string, string>,
  global?: Record<string, string>,
}

export interface LabelStyles extends ErrorTextStyles {
  focus?: Record<string, string>,
  requiredAsterisk?: Record<string, string>,
}

export interface InputStyles extends ErrorTextStyles {
  focus?: Record<string, string>,
  complete?: Record<string, string>,
  empty?: Record<string, string>,
  invalid?: Record<string, string>,
  cardIcon?: Record<string, string>,
  copyIcon?: Record<string, string>,
}

export interface CollectElementOptions {
  required: boolean,
  format?: string,
  translation?: Record<string, string>,
  enableCardIcon?: boolean,
  enableCopy?: boolean,
  cardMetadata?: CardMetadata,
  preserveFileName?: boolean,
  allowedFileType?: string[],
  blockEmptyFiles?: boolean,
  masking?: boolean,
  maskingChar?: string,
}

export interface CardMetadata {
  scheme: CardType[],
}

export interface CollectElementInput {
  table?: string,
  column?: string,
  label?: string,
  inputStyles?: InputStyles,
  labelStyles?: LabelStyles,
  errorTextStyles?: ErrorTextStyles,
  placeholder?: string,
  type: ElementType,
  altText?: string,
  validations?: IValidationRule[],
  skyflowID?: string,
}

export interface ICollectOptions {
  tokens?: boolean,
  additionalFields?: IInsertRecordInput,
  upsert?: Array<IUpsertOptions>,
}

export interface UploadFilesResponse {
  fileUploadResponse: [{ skyflow_id: string }],
  errorResponse: [{ error: ErrorRecord }],
}

export interface RevealResponse {
  success?: {
    token: string,
    valueType: string,
  },
  errors?: {
    error: ErrorRecord,
    token: string,
  }
}
