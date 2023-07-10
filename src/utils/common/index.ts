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
 * Supported Envs.
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

/** Wrapper for parameters required by insert record input. */
export interface IInsertRecordInput {
  /** An array of insert records */
  records: IInsertRecord[];
}

/** Wrapper for parameters required by insert record. */
export interface IInsertRecord {
  /** Table name */
  table: string;
  /** Fields to be inserted */
  fields: Record<string, any>;
  /** Optional, skyflowID of the record, required for update */
  skyflowID?: string;
}

/** Wrapper for parameters required by reveal record. */
export interface IRevealRecord {
  /** Required, token of the data being revealed */
  token: string;
  /** Optional, Redaction Type to be applied to data, RedactionType.PLAIN_TEXT will be applied if not provided */
  redaction?: RedactionType;
}

/** Wrapper for parameters required by insert response. */
export interface IInsertResponse {
  /** An array of insert response records */
  records: IInsertResponseReocrds[];
}

/** Wrapper for parameters required by insert response record. */
export interface IInsertResponseReocrds {
  /** The table this data belongs to */
  table: string;
  /** Optional, fields that are inserted */
  fields?: Record<string, any>;
  /** Optional, skyflowID of the inserted record */
  skyflowID?: string;
}

/** Wrapper for parameters required by reveal response. */
export interface IRevealResponseType {
  /** Optional, array of records that are revealed, if any */
  records?: Record<string, string>[];
  /** Optional, array of errors, if any */
  errors?: Record<string, any>[];
}

/** Wrapper for parameters required by detokenize input. */
export interface IDetokenizeInput {
  /** An array of reveal records */
  records: IRevealRecord[];
}

/** Wrapper for parameters required to get records. */
export interface IGetRecord {
  /** Optional, skyflow ids of the records to fetch */
  ids?: string[];
  /** Redaction for the fetched records */
  redaction: RedactionType;
  /** The table this data belongs to */
  table: string;
  /** Optional, Name of a unique column */
  columnName?:string;
  /** Optional, values of unique columns of records to fetch */
  columnValues?: string[];
}

/** Wrapper for parameters required to get input. */
export interface IGetInput {
  /** An array of get records */
  records: IGetRecord[];
}

/** Wrapper for parameters required by skyflow id record. */
export interface ISkyflowIdRecord {
  /** Array of skyflow ids of the records to fetch */
  ids: string[];
  /** Redaction for the fetched records */
  redaction: RedactionType;
  /** The table this data belongs to */
  table: string;
}

/** Wrapper for parameters required by get by id input. */
export interface IGetByIdInput {
  /** An array of skyflow id records */
  records: ISkyflowIdRecord[];
}

/** Wrapper for parameters required by context. */
export interface Context{
  /** log level to be applied. */
  logLevel:LogLevel
  /** Type of environment */
  env:Env
}

/** Wrapper for parameters required by validation rule. */
export interface IValidationRule {
  /** Type of skyflow validation rule */
  type: ValidationRuleType;
  /** Any additional parameters supported by validation rule */
  params: any;
}

/** Wrapper for parameters required by upsert option. */
export interface IUpsertOption {
  /** The table this data belongs to */
  table : string;
  /** Unique column name */
  column: string;
}

/** Wrapper for parameters required by insert options. */
export interface IInsertOptions{
  /** Optional, indicates whether tokens for the collected data should be returned */
  tokens?: boolean;
  /** Optional, will upsert data if provided, otherwise insert will be performed */
  upsert?: IUpsertOption[];
}

/** Wrapper for parameters required by delete record. */
export interface IDeleteRecord {
  /** Skyflow id of the record to delete */
  id: String;
  /** The table this data belongs to */
  table: String;
}

/** Wrapper for parameters required by delete options. */
export interface IDeleteOptions {}

/** Wrapper for parameters required by delete record input */
export interface IDeleteRecordInput {
  /** Optional, additional configuration options for delete record input */
  options?: IDeleteOptions;
  /** Array of records to be deleted */
  records: IDeleteRecord[];
}

/** Wrapper for parameters required by delete response type. */
export interface IDeleteResponseType {
  /** Array of deleted records, if any */
  records?: Record<string, string>[];
  /** Array of errors, if any */
  errors?: Record<string, any>[];
}
