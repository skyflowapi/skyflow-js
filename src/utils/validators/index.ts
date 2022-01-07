import {
  ALLOWED_EXPIRY_DATE_FORMATS, CardType, CARD_TYPE_REGEX, DEFAULT_CARD_LENGTH_RANGE,
} from '../../core/constants';
import { CollectElementInput } from '../../core/external/collect/CollectContainer';
import { IRevealElementInput } from '../../core/external/reveal/RevealContainer';
import SkyflowError from '../../libs/SkyflowError';
import { ISkyflow } from '../../Skyflow';
import {
  IInsertRecordInput,
  IDetokenizeInput,
  RedactionType,
  IGetByIdInput,
  IConnectionConfig,
  RequestMethod,
  MessageType,
  ISoapConnectionConfig,
} from '../common';
import SKYFLOW_ERROR_CODE from '../constants';
import logs from '../logs';
import { printLog } from '../logsHelper';

const xmljs = require('xml-js');

export const validateCreditCardNumber = (cardNumber: string) => {
  const value = cardNumber.replace(/[\s-]/g, '');
  let sum = 0;
  let shouldDouble = false;

  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(value.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

export const detectCardType = (cardNumber: string) => {
  const value = cardNumber.replace(/[\s-]/g, '');
  let detectedType = CardType.DEFAULT;
  Object.entries(CARD_TYPE_REGEX).forEach(([key, type]) => {
    if (type.regex.test(value)) {
      detectedType = key as CardType;
    }
  });
  return detectedType;
};

const getYearAndMonthBasedOnFormat = (cardDate, format:string) => {
  const [part1, part2] = cardDate.split('/');
  switch (format) {
    case 'MM/YY': return { month: part1, year: 2000 + Number(part2) };
    case 'YY/MM': return { month: part2, year: 2000 + Number(part1) };
    case 'YYYY/MM': return { month: part2, year: part1 };
    // MM/YYYY
    default: return { month: part1, year: part2 };
  }
};

export const validateExpiryDate = (date: string, format:string) => {
  if (date.trim().length === 0) return true;
  if (!date.includes('/')) return false;
  const { month, year } = getYearAndMonthBasedOnFormat(date, format);
  const expiryDate = new Date(`${year}-${month}-01`);
  const today = new Date();

  return expiryDate > today;
};

export const isValidExpiryDateFormat = (format:string):boolean => {
  if (format) {
    return ALLOWED_EXPIRY_DATE_FORMATS.includes(format);
  }
  return false;
};

export const validateInsertRecords = (recordObj: IInsertRecordInput, options: any) => {
  if (!(recordObj && Object.prototype.hasOwnProperty.call(recordObj, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND, [], true);
  }
  const { records } = recordObj;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_INSERT, [], true);
  }
  if (records.length === 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_IN_INSERT, [], true);
  }
  records.forEach((record:any, index: number) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'table'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_INSERT, [`${index}`], true);
    }
    if (!record.table) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_INSERT, [`${index}`], true);
    }
    if (!(typeof record.table === 'string' || record.table instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_INSERT, [`${index}`], true);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'fields')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_FIELDS_IN_INSERT, [`${index}`], true);
    }
    if (!record.fields) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_FIELDS_IN_INSERT, [`${index}`], true);
    }
    if (!(typeof record.fields === 'object' && !Array.isArray(record.fields))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FIELDS_IN_INSERT, [`${index}`], true);
    }
  });

  if (options && options.tokens && typeof options.tokens !== 'boolean') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_INSERT, [], true);
  }
};

export const validateAdditionalFieldsInCollect = (recordObj: IInsertRecordInput) => {
  if (!(recordObj && Object.prototype.hasOwnProperty.call(recordObj, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS, [], true);
  }
  const { records } = recordObj;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_ADDITIONAL_FIELDS, [], true);
  }
  if (records.length === 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_IN_ADDITIONAL_FIELDS, [], true);
  }
  records.forEach((record: any, index: number) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'table'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (!record.table) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (!(typeof record.table === 'string' || record.table instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'fields')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_FIELDS_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (!record.fields) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_FIELDS_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (!(typeof record.fields === 'object' && !Array.isArray(record.fields))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FIELDS_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
  });
};

export const validateDetokenizeInput = (detokenizeInput: IDetokenizeInput) => {
  if (!(detokenizeInput && Object.prototype.hasOwnProperty.call(detokenizeInput, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_DETOKENIZE);
  }
  const { records } = detokenizeInput;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_DETOKENIZE, [], true);
  }
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_DETOKENIZE);
  records.forEach((record: any, index) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'token'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN_IN_DETOKENIZE, [`${index}`], true);
    }
    if (!record.token) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TOKEN_IN_DETOKENIZE, [`${index}`], true);
    }
    if (!(typeof record.token === 'string' || record.token instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_IN_DETOKENIZE, [`${index}`], true);
    }
    // const recordRedaction = record.redaction;
    // if (!recordRedaction) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION);
    // }
    // if (!Object.values(RedactionType).includes(recordRedaction)) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE);
    // }
  });
};

export const validateGetByIdInput = (getByIdInput: IGetByIdInput) => {
  if (!(getByIdInput && Object.prototype.hasOwnProperty.call(getByIdInput, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_GETBYID);
  }
  const { records } = getByIdInput;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_GETBYID, [], true);
  }
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_GETBYID);
  records.forEach((record: any, index: number) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'ids'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_IDS_IN_GETBYID, [`${index}`], true);
    }
    if (!(record.ids && Array.isArray(record.ids))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_IDS_IN_GETBYID, [`${index}`], true);
    }
    if (record.ids.length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_IDS_IN_GETBYID, [`${index}`], true);
    }
    record.ids.forEach((skyflowId) => {
      if (!skyflowId) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOWID_IN_GETBYID, [`${index}`], true);
      }
      if (!(typeof skyflowId === 'string' || skyflowId instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_TYPE_IN_GETBYID, [`${index}`], true);
      }
    });
    if (!Object.prototype.hasOwnProperty.call(record, 'table')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_GETBYID, [`${index}`], true);
    }
    if (!record.table) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_GETBYID, [`${index}`], true);
    }
    if (!(typeof record.table === 'string' || record.table instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_GETBYID, [`${index}`], true);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'redaction')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION_IN_GETBYID, [`${index}`], true);
    }
    if (!record.redaction) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_REDACTION_TYPE_IN_GETBYID, [`${index}`], true);
    }
    if (!Object.values(RedactionType).includes(record.redaction)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GETBYID);
    }
  });
};

export const validateRevealElementRecords = (records: IRevealElementInput[]) => {
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_REVEAL);
  records.forEach((record: any) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'token'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN_KEY_REVEAL);
    }
    if (!record.token) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TOKEN_ID_REVEAL);
    }
    if (!(typeof record.token === 'string' || record.token instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_ID_REVEAL);
    }
    // if (!Object.prototype.hasOwnProperty.call(record, 'redaction')) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION);
    // }
    // const recordRedaction = record.redaction;
    // if (!recordRedaction) throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION_VALUE);
    // if (!Object.values(RedactionType).includes(recordRedaction)) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE);
    // }

    if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_LABEL_REVEAL);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALT_TEXT_REVEAL);
    }
  });
};

export const isValidURL = (url: string) => {
  if (!url || url.substring(0, 5).toLowerCase() !== 'https') {
    return false;
  }
  try {
    const tempUrl = new URL(url);
    if (tempUrl) return true;
  } catch (err) {
    return false;
  }

  return true;
};

export const isValidRegExp = (input) => {
  let isValid = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reg = new RegExp(input);
  } catch (err) {
    isValid = false;
  }

  return isValid;
};

export const validateConnectionConfig = (config: IConnectionConfig) => {
  if (!config) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CONNECTION_CONFIG);
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'connectionURL')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CONNECTION_URL);
  }
  if (!config.connectionURL) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_CONNECTION_URL);
  }
  if (typeof config.connectionURL !== 'string') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONNECTION_URL_TYPE);
  }
  if (!isValidURL(config.connectionURL)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONNECTION_URL);
  }

  if (!Object.prototype.hasOwnProperty.call(config, 'methodName')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_METHODNAME_KEY);
  }
  if (!Object.values(RequestMethod).includes(config.methodName)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_METHODNAME_VALUE);
  }
};

export const validateCardNumberLengthCheck = (cardNumber:string):boolean => {
  const cardType:CardType = detectCardType(cardNumber);
  const cardLength = cardNumber.replace(/[\s-]/g, '').length;
  const validLengths:number[] = CARD_TYPE_REGEX[cardType]?.cardLengthRange
                                || DEFAULT_CARD_LENGTH_RANGE;
  return validLengths.includes(cardLength);
};

export const validateInitConfig = (initConfig: ISkyflow) => {
  if (!Object.prototype.hasOwnProperty.call(initConfig, 'vaultID')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.VAULTID_IS_REQUIRED, [], true);
  }
  if (!initConfig.vaultID) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_VAULTID_IN_INIT, [], true);
  }
  if (!Object.prototype.hasOwnProperty.call(initConfig, 'vaultURL')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.VAULTURL_IS_REQUIRED, [], true);
  }
  if (!initConfig.vaultURL) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_VAULTURL_IN_INIT, [], true);
  }
  if (initConfig.vaultURL && !isValidURL(initConfig.vaultURL)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VAULTURL_IN_INIT, [], true);
  }
  if (!Object.prototype.hasOwnProperty.call(initConfig, 'getBearerToken')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.GET_BEARER_TOKEN_IS_REQUIRED, [], true);
  }
};

export const validateCollectElementInput = (input: CollectElementInput, logLevel) => {
  if (!Object.prototype.hasOwnProperty.call(input, 'type')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ELEMENT_TYPE, [], true);
  }
  if (!input.type) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_TYPE, [], true);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'altText')) {
    printLog(logs.warnLogs.COLLECT_ALT_TEXT_DEPERECATED, MessageType.WARN, logLevel);
  }
};

export const isValidXml = (xml: string) => {
  try {
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    xmljs.xml2js(xml, options);
  } catch (err) {
    return false;
  }
  return true;
};

export const validateSoapConnectionConfig = (config: ISoapConnectionConfig) => {
  if (!config) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_SOAP_CONNECTION_CONFIG, [], true);
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'connectionURL')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_SOAP_CONNECTION_URL, [], true);
  }
  if (!config.connectionURL) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SOAP_CONNECTION_URL, [], true);
  }
  if (typeof config.connectionURL !== 'string') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SOAP_CONNECTION_URL_TYPE, [], true);
  }
  if (!isValidURL(config.connectionURL)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SOAP_CONNECTION_URL, [], true);
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'requestXML')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_SOAP_REQUEST_XML, [], true);
  }
  if (!config.requestXML) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SOAP_REQUEST_XML, [], true);
  }
  if (!(typeof config.requestXML === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SOAP_REQUEST_XML_TYPE, [], true);
  }
  if (!isValidXml(config.requestXML)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SOAP_REQUEST_XML, [], true);
  }
  if (config.responseXML && !(typeof config.responseXML === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SOAP_RESPONSE_XML_TYPE, [], true);
  }
  if (config.responseXML && !isValidXml(config.responseXML)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SOAP_RESPONSE_XML, [], true);
  }
  if (config.httpHeaders && !(typeof config.httpHeaders === 'object' && !Array.isArray(config.httpHeaders))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_HTTP_HEADERS_TYPE, [], true);
  }
};
