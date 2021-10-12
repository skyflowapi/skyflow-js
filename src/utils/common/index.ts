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
}

export enum LogLevel{
  DEMO = 'DEMO',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  PROD = 'PROD',
}

export enum MessageType{
  INFO = 'INFO',
  ERROR = 'ERROR',
}

export interface IInsertRecordInput {
  records: IInsertRecord[];
}

export interface IInsertRecord {
  table: string;
  fields: Record<string, any>;
}

export interface IRevealRecord {
  token: string;
  redaction: RedactionType;
}

export interface IRevealResponseType {
  records?: Record<string, string>[];
  errors?: Record<string, any>[];
}

export interface IDetokenizeInput {
  records: IRevealRecord[];
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
}

export interface IGatewayConfig {
  gatewayURL: string;
  methodName: RequestMethod;
  pathParams?: any;
  queryParams?: any;
  requestBody?: any;
  requestHeader?: any;
  responseBody?: any;
}
