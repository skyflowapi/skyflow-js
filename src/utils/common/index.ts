/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * This is the doc comment for Utils Module
 * @module Utils
 */

/**
 * This is documentation for RedactionType enumeration.
 */
export enum RedactionType {
  DEFAULT = 'DEFAULT',
  PLAIN_TEXT = 'PLAIN_TEXT',
  MASKED = 'MASKED',
  REDACTED = 'REDACTED',
}

/**
 * This is documentation for RequestMethod enumeration.
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * This is documentation for EventName enumeration.
 */
export enum EventName {
  CHANGE = 'CHANGE',
  READY = 'READY',
  FOCUS = 'FOCUS',
  BLUR = 'BLUR',
  SUBMIT = 'SUBMIT',
}

/**
 * This is documentation for LogLevel enumeration.
 */
export enum LogLevel{
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
}

/**
 * This is documentation for Env enumeration.
 */
export enum Env{
  DEV = 'DEV',
  PROD = 'PROD',
}

/**
 * This is documentation for MessageType enumeration.
 */
export enum MessageType{
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * This is documentation for ValidationRuleType enumeration.
 */
export enum ValidationRuleType {
  REGEX_MATCH_RULE = 'REGEX_MATCH_RULE',
  LENGTH_MATCH_RULE = 'LENGTH_MATCH_RULE',
  ELEMENT_VALUE_MATCH_RULE = 'ELEMENT_VALUE_MATCH_RULE',
}

/** This is documentation for interface IInsertRecordInput. */
export interface IInsertRecordInput {
  /** This is the description for records property */
  records: IInsertRecord[];
}

/** This is documentation for interface IInsertRecord. */
export interface IInsertRecord {
  /** This is the description for table property */
  table: string;
  /** This is the description for fields property */
  fields: Record<string, any>;
  /** This is the description for skyflowID property */
  skyflowID?: string;
}

/** This is documentation for interface IRevealRecord. */
export interface IRevealRecord {
  /** This is the description for token property */
  token: string;
  /** This is the description for redaction property */
  redaction?: RedactionType;
}

/** This is documentation for interface IInsertResponse. */
export interface IInsertResponse {
  /** This is the description for records property */
  records: IInsertResponseReocrds[];
}

/** This is documentation for interface IInsertResponseReocrds. */
export interface IInsertResponseReocrds {
  /** This is the description for table property */
  table: string;
  /** This is the description for fields property */
  fields?: Record<string, any>;
  /** This is the description for skyflowID property */
  skyflowID?: string;
}

/** This is documentation for interface IRevealResponseType. */
export interface IRevealResponseType {
  /** This is the description for records property */
  records?: Record<string, string>[];
  /** This is the description for errors property */
  errors?: Record<string, any>[];
}

/** This is documentation for interface IDetokenizeInput. */
export interface IDetokenizeInput {
  /** This is the description for records property */
  records: IRevealRecord[];
}

/** This is documentation for interface IGetRecord. */
export interface IGetRecord {
  /** This is the description for ids property */
  ids?: string[];
  /** This is the description for redaction property */
  redaction: RedactionType;
  /** This is the description for table property */
  table: string;
  /** This is the description for columnName property */
  columnName?:string;
  /** This is the description for columnValues property */
  columnValues?: string[];
}

/** This is documentation for interface IGetInput. */
export interface IGetInput {
  /** This is the description for records property */
  records: IGetRecord[];
}

/** This is documentation for interface ISkyflowIdRecord. */
export interface ISkyflowIdRecord {
  /** This is the description for ids property */
  ids: string[];
  /** This is the description for redaction property */
  redaction: RedactionType;
  /** This is the description for table property */
  table: string;
}

/** This is documentation for interface IGetByIdInput. */
export interface IGetByIdInput {
  /** This is the description for records property */
  records: ISkyflowIdRecord[];
}

/** This is documentation for interface Context. */
export interface Context{
  /** This is the description for logLevel property */
  logLevel:LogLevel
  /** This is the description for env property */
  env:Env
}

/** This is documentation for interface IValidationRule. */
export interface IValidationRule {
  /** This is the description for type property */
  type: ValidationRuleType;
  /** This is the description for params property */
  params: any;
}

/** This is documentation for interface IUpsertOption. */
export interface IUpsertOption {
  /** This is the description for table property */
  table : string;
  /** This is the description for column property */
  column: string;
}

/** This is documentation for interface IInsertOptions. */
export interface IInsertOptions{
  /** This is the description for tokens property */
  tokens?: boolean;
  /** This is the description for upsert property */
  upsert?: IUpsertOption[];
}

/** This is documentation for interface IDeleteRecord. */
export interface IDeleteRecord {
  /** This is the description for id property */
  id: String;
  /** This is the description for table property */
  table: String;
}

/** This is documentation for interface IDeleteOptions. */
export interface IDeleteOptions {}

/** This is documentation for interface IDeleteRecordInput. */
export interface IDeleteRecordInput {
  /** This is the description for options property */
  options?: IDeleteOptions;
  /** This is the description for records property */
  records: IDeleteRecord[];
}

/** This is documentation for interface IDeleteResponseType. */
export interface IDeleteResponseType {
  /** This is the description for records property */
  records?: Record<string, string>[];
  /** This is the description for errors property */
  errors?: Record<string, any>[];
}
