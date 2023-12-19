/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * @module Utils
 */

/**
 * Supported redaction types.
 */
export enum RedactionType {
  DEFAULT = 'DEFAULT',
  PLAIN_TEXT = 'PLAIN_TEXT',
  MASKED = 'MASKED',
  REDACTED = 'REDACTED',
}

/**
 * Supported request methods.
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Supported event names.
 */
export enum EventName {
  CHANGE = 'CHANGE',
  READY = 'READY',
  FOCUS = 'FOCUS',
  BLUR = 'BLUR',
  SUBMIT = 'SUBMIT',
}

/**
 * Supported log levels.
 */
export enum LogLevel{
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
}

/**
 * Supported environments.
 */
export enum Env{
  DEV = 'DEV',
  PROD = 'PROD',
}

/**
 * Supported message types.
 */
export enum MessageType{
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Supported validation rule types.
 */
export enum ValidationRuleType {
  REGEX_MATCH_RULE = 'REGEX_MATCH_RULE',
  LENGTH_MATCH_RULE = 'LENGTH_MATCH_RULE',
  ELEMENT_VALUE_MATCH_RULE = 'ELEMENT_VALUE_MATCH_RULE',
}

/** Wraps the parameters required for the insert record input. */
export interface IInsertRecordInput {
  /** An array of insert records. */
  records: IInsertRecord[];
}

/** Wraps the parameters required for inserting a record. */
export interface IInsertRecord {
  /** Table that the data belongs to. */
  table: string;
  /** Fields to insert data into. */
  fields: Record<string, any>;
  /** ID for the record to update. */
  skyflowID?: string;
}

/** Wraps the parameters required by the Reveal record. */
export interface IRevealRecord {
  /** Token of the revealed data. */
  token?: string;
  /** Redaction type applied to the data. Defaults to `RedactionType.PLAIN_TEXT`. */
  redaction?: RedactionType;
  /** Column name to retrieve value of */
  column?: string;
  /** SkyflowID of record to reveal its value. */
  skyflowID?: string;
  /** Table name to retrieve value from */
  table?: string;
}

/** Wraps the parameters required for an insert response. */
export interface IInsertResponse {
  /** Response records. */
  records: IInsertResponseReocrds[];
}

/** Wraps the parameters required for an insert response record. */
export interface IInsertResponseReocrds {
  /** Table that the data belongs to. */
  table: string;
  /** Fields that data was inserted into. */
  fields?: Record<string, any>;
  /** ID of the record. */
  skyflowID?: string;
}

/** Wraps the parameters required by the reveal response. */
export interface IRevealResponseType {
  /** Records revealed, if any. */
  records?: Record<string, string>[];
  /** Errors, if any. */
  errors?: Record<string, any>[];
}

/** Wraps the parameters required by the file render response. */
export interface IRenderResponseType {
  /** Files rendered, if any. */
  fields?: Record<string, any>
  /** Errors, if any. */
  errors?: Record<string, any>
}

/** Wraps the parameters required for detokenizing input. */
export interface IDetokenizeInput {
  /** Revealed records. */
  records: IRevealRecord[];
}

/** Wrapper for the parameters required to retrieve records. */
export interface IGetRecord {
  /** IDs of the records. */
  ids?: string[];
  /** Type of redaction applied. */
  redaction?: RedactionType;
  /** Table the data belongs to. */
  table: string;
  /** Column the data belongs to. */
  columnName?:string;
  /** Values of the records. */
  columnValues?: string[];
}

/** Wrapper for the parameters that are required to retrieve input. */
export interface IGetInput {
  /** Records to retrieve. */
  records: IGetRecord[];
}

/** Wrapper for parameters required by get options. */
export interface IGetOptions {
  /** If `true`, returns tokens for the retrieved data. Defaults to `false`. */
  tokens?: boolean;
}

/** Wrapper for the parameters required by Skyflow ID record. */
export interface ISkyflowIdRecord {
  /** Skyflow IDs of the records to get. */
  ids: string[];
  /** Type of redaction for values. */
  redaction: RedactionType;
  /** Table that the data belongs to. */
  table: string;
}

/** Wrapper for the parameters that are required by the getbyid input. */
export interface IGetByIdInput {
  /** Records to get. */
  records: ISkyflowIdRecord[];
}

/** Wrapper for parameters required by context. */
export interface Context{
  /** Log level to apply. */
  logLevel:LogLevel
  /** Type of environment. */
  env:Env
}

/** Wrapper for parameters required by validation rule. */
export interface IValidationRule {
  /** Type of validation rule. */
  type: ValidationRuleType;
  /** Additional validation rule parameters. */
  params: any;
}

/** Wrapper for parameters required by upsert option. */
export interface IUpsertOption {
  /** Table that the data belongs to. */
  table : string;
  /** Name of the unique column. */
  column: string;
}

/** Wrapper for parameters required by insert options. */
export interface IInsertOptions{
  /** If `true`, returns tokens for the collected data. Defaults to `false`. */
  tokens?: boolean;
  /** If specified, upserts data. If not specified, inserts data. */
  upsert?: IUpsertOption[];
}

/** Wrapper for parameters required by delete record. */
export interface IDeleteRecord {
  /** Skyflow ID of the record. */
  id: String;
  /** Table that the data belongs to. */
  table: String;
}

/** Wrapper for parameters required by delete options. */
export interface IDeleteOptions {}

/** Wrapper for parameters required by delete record input. */
export interface IDeleteRecordInput {
  /** Options for deleting records. */
  options?: IDeleteOptions;
  /** Records to delete. */
  records: IDeleteRecord[];
}

/** Wrapper for parameters required by delete response type. */
export interface IDeleteResponseType {
  /** Deleted records, if any. */
  records?: Record<string, string>[];
  /** Errors, if any. */
  errors?: Record<string, any>[];
}
