/* eslint-disable max-len */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  ALLOWED_EXPIRY_DATE_FORMATS,
  ALLOWED_EXPIRY_YEAR_FORMATS,
  CardType, CARD_TYPE_REGEX,
  DEFAULT_CARD_LENGTH_RANGE,
  ElementType,
} from '../../core/constants';
import { CollectElementInput } from '../../core/external/collect/collect-container';
import { IRevealElementInput } from '../../core/external/reveal/reveal-container';
import SkyflowError from '../../libs/skyflow-error';
import { ISkyflow } from '../../skyflow';
import {
  IInsertRecordInput,
  IDetokenizeInput,
  RedactionType,
  IGetInput,
  MessageType,
  IGetByIdInput,
  IDeleteRecordInput,
  IThreeDSInput,
} from '../common';
import SKYFLOW_ERROR_CODE from '../constants';
import { appendZeroToOne } from '../helpers';
import logs from '../logs';
import { printLog } from '../logs-helper';

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

export const detectCardType = (cardNumber: string = '') => {
  const value = cardNumber.replace(/[\s-]/g, '');

  let detectedType = CardType.DEFAULT;
  Object.entries(CARD_TYPE_REGEX).forEach(([key, type]) => {
    if (type.regex.test(value)) {
      detectedType = key as CardType;
    }
  });
  return detectedType;
};

const getYearAndMonthBasedOnFormat = (cardDate, format: string) => {
  const [part1, part2] = cardDate.split('/');
  switch (format) {
    case 'MM/YY': return { month: appendZeroToOne(part1).value, year: 2000 + Number(part2) };
    case 'YY/MM': return { month: appendZeroToOne(part2).value, year: 2000 + Number(part1) };
    case 'YYYY/MM': return { month: appendZeroToOne(part2).value, year: part1 };
    // MM/YYYY
    default: return { month: appendZeroToOne(part1).value, year: part2 };
  }
};

export const validateExpiryDate = (date: string, format: string) => {
  if (date.trim().length === 0) return true;
  if (!date.includes('/')) return false;
  const { month, year } = getYearAndMonthBasedOnFormat(date, format);
  if (format.endsWith('YYYY') && year.length !== 4) { return false; }
  const expiryDate = new Date(`${year}-${month}-01`);
  const today = new Date();

  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() + 50);

  return expiryDate > today && expiryDate <= maxDate;
};

export const validateExpiryYear = (year: string, format: string) => {
  if (year.trim().length === 0) return true;
  let expiryYear = Number(year);
  if (format === 'YY') {
    expiryYear = 2000 + Number(year);
  }
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 50;

  return expiryYear >= currentYear && expiryYear <= maxYear;
};

export const validateExpiryMonth = (month: string) => {
  if (month.trim().length === 0) return true;
  const tempMonth = Number(month);
  if (tempMonth > 0 && tempMonth <= 12) {
    return true;
  }
  return false;
};

export const isValidExpiryDateFormat = (format: string): boolean => {
  if (format) {
    return ALLOWED_EXPIRY_DATE_FORMATS.includes(format);
  }
  return false;
};

export const isValidExpiryYearFormat = (format: string): boolean => {
  if (format) {
    return ALLOWED_EXPIRY_YEAR_FORMATS.includes(format);
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
  records.forEach((record: any, index: number) => {
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
    if (record.fields?.skyflowID !== undefined) {
      if (!record.fields?.skyflowID) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS, [`${index}`], true);
      }
      if (!(typeof record.fields?.skyflowID === 'string' || record.fields?.skyflowID instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS, [`${index}`], true);
      }
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
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_DETOKENIZE);
  }
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_DETOKENIZE);
  records.forEach((record: any, index) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'token'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN_IN_DETOKENIZE, [`${index}`]);
    }
    if (!record.token) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TOKEN_IN_DETOKENIZE, [`${index}`]);
    }
    if (!(typeof record.token === 'string' || record.token instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_IN_DETOKENIZE, [`${index}`]);
    }
    const recordRedaction = record.redaction;
    if (recordRedaction) {
      if (!Object.values(RedactionType).includes(recordRedaction)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_DETOKENIZE, [`${index}`]);
      }
    }
  });
};

export const validateThreeDSInput = (threeDSInput: IThreeDSInput) => {
  if (
    !(threeDSInput)
  ) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_OBJECT_IN_3DS, [], true);
  }

  if (!(threeDSInput && typeof threeDSInput === 'object')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_OBJECT_IN_3DS, [], true);
  }

  if (!threeDSInput.cardDetails) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CARD_DETAILS_IN_3DS, [], true);
  }

  if (!threeDSInput.cardDetails.cardNumber) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CARD_NUMBER_IN_3DS, [], true);
  }
  if (
    !(
      typeof threeDSInput.cardDetails.cardNumber === 'string'
      || typeof threeDSInput.cardDetails.cardNumber === 'object'
    )
  ) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CARD_NUMBER_IN_3DS, [], true);
  }

  if (!threeDSInput.cardDetails.cardHolderName) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CARDHOLDER_NAME_IN_3DS, [], true);
  }
  if (
    !(
      typeof threeDSInput.cardDetails.cardHolderName === 'string'
      || typeof threeDSInput.cardDetails.cardHolderName === 'object'
    )
  ) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CARDHOLDER_NAME_IN_3DS, [], true);
  }
  if (!threeDSInput.cardDetails.cardExpiry) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CARD_EXPIRY_IN_3DS, [], true);
  }
  if (
    !(
      typeof threeDSInput.cardDetails.cardExpiry === 'string'
      || typeof threeDSInput.cardDetails.cardExpiry === 'object'
    )
  ) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CARD_EXPIRY_IN_3DS, [], true);
  }

  if (!threeDSInput.cardDetails.schemeID) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_SCHEME_ID_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.cardDetails.schemeID === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SCHEME_ID_IN_3DS, [], true);
  }

  if (!threeDSInput.config || !threeDSInput.config.acquirerDetails || !threeDSInput.config.merchantDetails) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CONFIG_DETAILS_IN_3DS, [], true);
  }

  if (!threeDSInput.config.acquirerDetails.acquirerBIN) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ACQUIRER_BIN_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.acquirerDetails.acquirerBIN === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ACQUIRER_BIN_IN_3DS, [], true);
  }

  if (!threeDSInput.config.acquirerDetails.acquirerMerchantID) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ACQUIRER_MERCHANT_ID_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.acquirerDetails.acquirerMerchantID === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ACQUIRER_MERCHANT_ID_IN_3DS, [], true);
  }

  if (threeDSInput.config.acquirerDetails.acquirerID && !(typeof threeDSInput.config.acquirerDetails.acquirerID === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ACQUIRER_ID_IN_3DS, [], true);
  }

  if (!threeDSInput.config.merchantDetails.mcc) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MERCHANT_MCC_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.merchantDetails.mcc === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_MERCHANT_MCC_IN_3DS, [], true);
  }

  if (!threeDSInput.config.merchantDetails.merchantName) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MERCHANT_NAME_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.merchantDetails.merchantName === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_MERCHANT_NAME_IN_3DS, [], true);
  }

  if (!threeDSInput.config.merchantDetails.merchantUrl) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MERCHANT_URL_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.merchantDetails.merchantUrl === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_MERCHANT_URL_IN_3DS, [], true);
  }

  if (!threeDSInput.config.merchantDetails.merchantCountryCode) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MERCHANT_COUNTRY_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.merchantDetails.merchantCountryCode === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_MERCHANT_COUNTRY_IN_3DS, [], true);
  }

  if (!threeDSInput.config.threeDSRequestorName) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REQUESTOR_NAME_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.threeDSRequestorName === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REQUESTOR_NAME_IN_3DS, [], true);
  }

  if (!threeDSInput.config.threeDSRequestorId) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REQUESTOR_ID_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.threeDSRequestorId === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REQUESTOR_ID_IN_3DS, [], true);
  }

  if (!threeDSInput.config.threeDSServerTransId) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TRANSACTION_ID_IN_3DS, [], true);
  }

  if (!(typeof threeDSInput.config.threeDSServerTransId === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TRANSACTION_ID_IN_3DS, [], true);
  }

  if (!threeDSInput.config.threeDSRequestorFinalAuthRespURL) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REQUESTOR_URL_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.config.threeDSRequestorFinalAuthRespURL === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REQUESTOR_URL_IN_3DS, [], true);
  }

  if (threeDSInput.config.threeDSServerTransId && !(typeof threeDSInput.config.threeDSServerTransId === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REQUESTOR_TRANS_ID_IN_3DS, [], true);
  }

  if (threeDSInput.config.preferredProtocolVersion && !(typeof threeDSInput.config.preferredProtocolVersion === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_PROTOCOL_VERSION_IN_3DS, [], true);
  }

  if (!threeDSInput.amountDetails) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_AMOUNT_DETAILS_IN_3DS, [], true);
  }

  if (!threeDSInput.amountDetails.amount) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_AMOUNT_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.amountDetails.amount === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_AMOUNT_IN_3DS, [], true);
  }

  if (!threeDSInput.amountDetails.purchaseCurrency) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_PURCHASE_CURRENCY_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.amountDetails.purchaseCurrency === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_PURCHASE_CURRENCY_IN_3DS, [], true);
  }

  if (!threeDSInput.amountDetails.purchaseExponent) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_PURCHASE_EXPONENT_IN_3DS, [], true);
  }
  if (!(typeof threeDSInput.amountDetails.purchaseExponent === 'number')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_PURCHASE_EXPONENT_IN_3DS, [], true);
  }
};

export const validateGetInput = (getInput: IGetInput) => {
  if (!(getInput && Object.prototype.hasOwnProperty.call(getInput, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_GET);
  }
  const { records } = getInput;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_GET, []);
  }
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_GET);
  records.forEach((record: any, index: number) => {
    if (Object.keys(record).length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_GET);
    }
    if (record.ids?.length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_IDS_IN_GET, [`${index}`]);
    }
    if (record.ids != null && !(record.ids && Array.isArray(record.ids))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_IDS_IN_GET, [`${index}`]);
    }
    record.ids?.forEach((skyflowId) => {
      if (!skyflowId) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOWID_IN_GET, [`${index}`]);
      }
      if (!(typeof skyflowId === 'string' || skyflowId instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_TYPE_IN_GET, [`${index}`]);
      }
    });
    if (!Object.prototype.hasOwnProperty.call(record, 'table')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_GET, [`${index}`]);
    }
    if (!record.table) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_GET, [`${index}`]);
    }
    if (!(typeof record.table === 'string' || record.table instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_GET, [`${index}`]);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'redaction')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION_IN_GET, [`${index}`]);
    }
    if (!record.redaction) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_REDACTION_TYPE_IN_GET, [`${index}`]);
    }
    if (!Object.values(RedactionType).includes(record.redaction)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GET, [`${index}`]);
    }
    if ((Object.prototype.hasOwnProperty.call(record, 'ids') === true && Object.prototype.hasOwnProperty.call(record, 'columnName') === true)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.SKYFLOW_IDS_AND_COLUMN_NAME_BOTH_SPECIFIED, [`${index}`]);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'columnName')) {
      if ((Object.prototype.hasOwnProperty.call(record, 'ids') === false && Object.prototype.hasOwnProperty.call(record, 'columnValues') === false)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_IDS_OR_COLUMN_VALUES_IN_GET, [`${index}`]);
      }
    } else if (!(Object.prototype.hasOwnProperty.call(record, 'columnName') && Object.prototype.hasOwnProperty.call(record, 'columnValues'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_RECORD_COLUMN_VALUE, [`${index}`]);
    }
    if (record.columnValues?.length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORD_COLUMN_VALUES, [`${index}`]);
    }
    if (record.columnValues != null
      && !(record.columnValues && Array.isArray(record.columnValues))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COLUMN_VALUES_IN_GET, [`${index}`]);
    }
    if (record.columnName !== undefined && record.columnValues === undefined) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_RECORD_COLUMN_VALUE, [`${index}`]);
    }
    if (record.columnName === undefined && record.columnValues !== undefined) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_RECORD_COLUMN_NAME, [`${index}`]);
    }

    const columnName = record.columnName;
    if (columnName != null && typeof columnName !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORD_COLUMN_VALUE, [`${index}`]);
    }
    const columnValues = record.columnValues;
    // if (columnValues != null && !(columnValues && Array.isArray(columnValues))) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COLUMN_VALUES_TYPE, [`${index}`]);
    // }
    if (columnValues != null) {
      if (columnValues.length === 0 || columnValues === null) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORD_COLUMN_VALUES, [`${index}`]);
      }
      columnValues.forEach((eachColumnValue) => {
        if (eachColumnValue === '' || eachColumnValue === null) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_COLUMN_VALUE, [`${index}`]);
        if (typeof eachColumnValue !== 'string') throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORD_COLUMN_VALUE_TYPE, [`${index}`]);
      });
    }
  });
};

export const validateGetByIdInput = (getByIdInput: IGetByIdInput) => {
  if (!(getByIdInput && Object.prototype.hasOwnProperty.call(getByIdInput, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_GETBYID);
  }
  const { records } = getByIdInput;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_GETBYID, []);
  }
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_GETBYID);
  records.forEach((record: any, index: number) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'ids'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_IDS_IN_GETBYID, [`${index}`]);
    }
    if (!(record.ids && Array.isArray(record.ids))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_IDS_IN_GETBYID, [`${index}`]);
    }
    if (record.ids.length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_IDS_IN_GETBYID, [`${index}`]);
    }
    record.ids.forEach((skyflowId) => {
      if (!skyflowId) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOWID_IN_GETBYID, [`${index}`]);
      }
      if (!(typeof skyflowId === 'string' || skyflowId instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_TYPE_IN_GETBYID, [`${index}`]);
      }
    });
    if (!Object.prototype.hasOwnProperty.call(record, 'table')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_GETBYID, [`${index}`]);
    }
    if (!record.table) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_GETBYID, [`${index}`]);
    }
    if (!(typeof record.table === 'string' || record.table instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_GETBYID, [`${index}`]);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'redaction')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION_IN_GETBYID, [`${index}`]);
    }
    if (!record.redaction) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_REDACTION_TYPE_IN_GETBYID, [`${index}`]);
    }
    if (!Object.values(RedactionType).includes(record.redaction)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GETBYID, [`${index}`]);
    }
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const validateDeleteRecords = (recordObj: IDeleteRecordInput, options: any) => {
  if (!(recordObj && Object.prototype.hasOwnProperty.call(recordObj, 'records'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_DELETE, [], true);
  }
  const { records } = recordObj;
  if (!(records && Array.isArray(records))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_DELETE, [], true);
  }
  if (records.length === 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_IN_DELETE, [], true);
  }
  records.forEach((record: any, index: number) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'table'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_DELETE, [`${index}`], true);
    }
    if (!record.table) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_DELETE, [`${index}`], true);
    }
    if (!(typeof record.table === 'string' || record.table instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_DELETE, [`${index}`], true);
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'id')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ID_IN_DELETE, [`${index}`], true);
    }
    if (!record.id) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ID_IN_DELETE, [`${index}`], true);
    }
    if (!(typeof record.id === 'string' || record.id instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ID_IN_DELETE, [`${index}`], true);
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
    const recordRedaction = record.redaction;
    if (recordRedaction) {
      if (!Object.values(RedactionType).includes(recordRedaction)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_REVEAL);
      }
    }

    if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_LABEL_REVEAL);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALT_TEXT_REVEAL);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'format') && typeof record.format !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FORMAT_REVEAL);
    }
    if (Object.prototype.hasOwnProperty.call(record, 'format') && record.format === '') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_FORMAT_REVEAL);
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

export const validateCardNumberLengthCheck = (cardNumber: string = ''): boolean => {
  const cardType: CardType = detectCardType(cardNumber);
  const cardLength = cardNumber.replace(/[\s-]/g, '').length;
  const validLengths: number[] = CARD_TYPE_REGEX[cardType]?.cardLengthRange
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
  if (Object.prototype.hasOwnProperty.call(input, 'skyflowID') && !(typeof input.skyflowID === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_IN_COLLECT, [], true);
  }
  if (input.type === ElementType.FILE_INPUT
    && !Object.keys(input).includes('skyflowID')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_SKYFLOWID_IN_COLLECT, [], true);
  }
};

export const validateUpsertOptions = (upsertOptions) => {
  if (!(upsertOptions && Array.isArray(upsertOptions))) {
    throw new SkyflowError(
      SKYFLOW_ERROR_CODE.INVALID_UPSERT_OPTION_TYPE,
      [],
      true,
    );
  }

  if (!upsertOptions.length) {
    throw new SkyflowError(
      SKYFLOW_ERROR_CODE.EMPTY_UPSERT_OPTIONS_ARRAY,
      [],
      true,
    );
  }

  upsertOptions.forEach((upsertOption, index: number) => {
    if (!(upsertOption && typeof upsertOption === 'object')) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_UPSERT_OPTION_OBJECT_TYPE,
        [index],
        true,
      );
    }

    if (!Object.prototype.hasOwnProperty.call(upsertOption, 'table')) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_UPSERT_OPTION,
        [index],
        true,
      );
    }

    if (
      !(
        upsertOption.table
        && typeof upsertOption.table === 'string'
        && upsertOption.table.length
      )
    ) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_UPSERT_OPTION,
        [index],
        true,
      );
    }
    if (!Object.prototype.hasOwnProperty.call(upsertOption, 'column')) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_COLUMN_IN_UPSERT_OPTION,
        [index],
        true,
      );
    }

    if (
      !(
        upsertOption.column
        && typeof upsertOption.column === 'string'
        && upsertOption.column.length
      )
    ) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_COLUMN_IN_UPSERT_OPTION,
        [index],
        true,
      );
    }
  });
};

export const validateComposableContainerOptions = (options) => {
  if (!options) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_COMPOSABLE_CONTAINER_OPTIONS, [], true);
  }
  if (typeof options !== 'object') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_CONTAINER_OPTIONS, [], true);
  }

  if (!Object.prototype.hasOwnProperty.call(options, 'layout')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_COMPOSABLE_LAYOUT_KEY, [], true);
  }

  if (!options.layout) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE, [], true);
  }

  if (!Array.isArray(options.layout)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE, [], true);
  }
  if (options.layout.length === 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_COMPOSABLE_LAYOUT_ARRAY, [], true);
  }

  options.layout.forEach((row) => {
    if (typeof row !== 'number') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE, [], true);
    }
    if (row < 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.NEGATIVE_VALUES_COMPOSABLE_LAYOUT, [], true);
    }
  });
};

export const validateBooleanOptions = (option) => {
  if (typeof option !== 'boolean') { return false; }

  return true;
};

export const validateInputFormatOptions = (options) => {
  if (options) {
    if (Object.prototype.hasOwnProperty.call(options, 'format')
    && !(typeof options.format === 'string')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_FORMAT, [], true);
    }

    if (
      Object.prototype.hasOwnProperty.call(options, 'translation')
      && ((!(typeof options.translation === 'object')
      || (Object.prototype.toString.call(options.translation) !== '[object Object]')))
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_TRANSLATION, [], true);
    }
  }
};
