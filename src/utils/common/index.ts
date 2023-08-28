/*
Copyright (c) 2022 Skyflow, Inc.
*/
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
  token: string;
  redaction?: RedactionType;
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

export interface IDetokenizeInput {
  records: IRevealRecord[];
}

export interface IGetRecord {
  ids?: string[];
  redaction: RedactionType;
  table: string;
  columnName?:string;
  columnValues?: string[];
}

export interface IGetInput {
  records: IGetRecord[];
}

export interface IConstructedThreeDSRecord{
  guestCheckout?: boolean;
  config: {
    vaultID: string
    acquirerDetails: {
      acquirerID?: string;
      acquirerBIN: string;
      acquirerMerchantID: string;
    };
    merchantDetails: {
      mcc: string;
      merchantName: string;
      merchantUrl: string;
      merchantCountryCode: string;
      merchantConfigurationId?: string;
    };
    threeDSRequestorName: string;
    threeDSRequestorId: string;
    threeDSServerTransId?: string;
    threeDSRequestorFinalAuthRespURL: string;
    preferredProtocolVersion?: string;
  };
  cardDetails: {
    cardNumber: string;
    cardExpiry: string;
    cardHolderName: string;
    schemeID: string;
  };
  amountDetails: {
    amount: string;
    purchaseCurrency: string;
    purchaseExponent: number;
  };
  browserDetails: {
    browserAcceptHeader: string;
    browserLanguage: string;
    browserColorDepth: string;
    browserScreenHeight: number;
    browserScreenWidth: number;
    browserTZ: number;
    browserUserAgent: string;
    browserJavascriptEnabled: boolean;
    browserJavaEnabled: boolean;
  }
}

export interface IThreeDSInput{
  config: {
    acquirerDetails: {
      acquirerID?: string;
      acquirerBIN: string;
      acquirerMerchantID: string;
    };
    merchantDetails: {
      mcc: string;
      merchantName: string;
      merchantUrl: string;
      merchantCountryCode: string;
      merchantConfigurationId?: string;
    };
    threeDSRequestorName: string;
    threeDSRequestorId: string;
    threeDSServerTransId?: string;
    threeDSRequestorFinalAuthRespURL: string;
    preferredProtocolVersion?: string;
  };
  cardDetails: {
    cardNumber: string | any;
    cardExpiry: string | any;
    cardHolderName: string | any;
    schemeID: string;
  };
  amountDetails: {
    amount: string | any;
    purchaseCurrency: string;
    purchaseExponent: number;
  };
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
  options?: IDeleteOptions;
  records: IDeleteRecord[];
}

export interface IDeleteResponseType {
  records?: Record<string, string>[];
  errors?: Record<string, any>[];
}
