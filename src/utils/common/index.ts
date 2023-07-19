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
 * Supported envs.
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
  /** An array of insert records */
  records: IInsertRecord[];
}

/** Wraps the parameters required for inserting a record. */
export interface IInsertRecord {
  /** Data belongs to the table. */
  table: string;
  /** Fields need to be inserted. */
  fields: Record<string, any>;
  /** Record requires the SkyflowID for update. */
  skyflowID?: string;
}

/** Wraps the parameters required by the Reveal record. */
export interface IRevealRecord {
  /** The token of the revealed data. */
  token: string;
  /** Redaction type applies to the data, and if not provided, the RedactionType.PLAIN_TEXT will be applied. */
  redaction?: RedactionType;
}

/** Wraps the parameters required for an insert response. */
export interface IInsertResponse {
  /** An array of insert response records. */
  records: IInsertResponseReocrds[];
}

/** Wraps the parameters required for an insert response record. */
export interface IInsertResponseReocrds {
  /** Data belongs to the table. */
  table: string;
  /** Inserted fields. */
  fields?: Record<string, any>;
  /** Inserted record's SkyflowID. */
  skyflowID?: string;
}

/** Wraps the parameters required by the reveal response. */
export interface IRevealResponseType {
  /** Array of records reveals if there are any. */
  records?: Record<string, string>[];
  /** Array of errors, if there are any. */
  errors?: Record<string, any>[];
}

/** Wraps the parameters required for detokenizing input. */
export interface IDetokenizeInput {
  /** Array of reveal records */
  records: IRevealRecord[];
}

/** Wrapper for the parameters required to retrieve records. */
export interface IGetRecord {
  /** Skyflow IDs of the records. */
  ids?: string[];
  /** Fetched records undergo redaction. */
  redaction: RedactionType;
  /** Data belongs to the table. */
  table: string;
  /** Name of the unique column. */
  columnName?:string;
  /** Values of the unique columns of records. */
  columnValues?: string[];
}

/** Wrapper for the parameters that are required to retrieve input. */
export interface IGetInput {
  /** Array contains get records. */
  records: IGetRecord[];
}

/** Wrapper for the parameters required by Skyflow ID record. */
export interface ISkyflowIdRecord {
  /** An array of skyflow ids of the records to fetch. */
  ids: string[];
  /** Fetched records are redacted. */
  redaction: RedactionType;
  /** Data belongs to the table. */
  table: string;
}

/** Wrapper for the parameters that are required by the getbyid input. */
export interface IGetByIdInput {
  /** An array of skyflow id records. */
  records: ISkyflowIdRecord[];
}

/** Wrapper for parameters required by context. */
export interface Context{
  /** Log level to be applied. */
  logLevel:LogLevel
  /** Type of environment. */
  env:Env
}

/** Wrapper for parameters required by validation rule. */
export interface IValidationRule {
  /** Type of skyflow validation rule. */
  type: ValidationRuleType;
  /** Any additional parameters supported by validation rule. */
  params: any;
}

/** Wrapper for parameters required by upsert option. */
export interface IUpsertOption {
  /** Data belongs to the table. */
  table : string;
  /** Name of the unique column. */
  column: string;
}

/** Wrapper for parameters required by insert options. */
export interface IInsertOptions{
  /** Indicates whether tokens for the collected data should be returned. */
  tokens?: boolean;
  /** Will upsert data if provided, otherwise insert will be performed. */
  upsert?: IUpsertOption[];
}

/** Wrapper for parameters required by delete record. */
export interface IDeleteRecord {
  /** Skyflow id of the record. */
  id: String;
  /** Data belongs to the table. */
  table: String;
}

/** Wrapper for parameters required by delete options. */
export interface IDeleteOptions {}

/** Wrapper for parameters required by delete record input. */
export interface IDeleteRecordInput {
  /** Additional configuration options for delete record input. */
  options?: IDeleteOptions;
  /** Array of records to be deleted. */
  records: IDeleteRecord[];
}

/** Wrapper for parameters required by delete response type. */
export interface IDeleteResponseType {
  /** Array of deleted records, if any. */
  records?: Record<string, string>[];
  /** Array of errors, if any. */
  errors?: Record<string, any>[];
}
