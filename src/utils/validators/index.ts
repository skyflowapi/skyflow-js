/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  ALLOWED_EXPIRY_DATE_FORMATS,
  ALLOWED_EXPIRY_YEAR_FORMATS,
  CardType, CARD_TYPE_REGEX,
  DEFAULT_CARD_LENGTH_RANGE,
} from '../../core/constants';
import { CollectElementInput } from '../../core/external/collect/collect-container';
import { IRevealElementInput } from '../../core/external/reveal/reveal-container';
import SkyflowError from '../../libs/skyflow-error';
import { ISkyflow } from '../../skyflow';
import {
  IInsertRecordInput,
  IDetokenizeInput,
  RedactionType,
  IGetByIdInput,
  MessageType,
} from '../common';
import SKYFLOW_ERROR_CODE from '../constants';
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

  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() + 50);

  return expiryDate > today && expiryDate <= maxDate;
};

export const validateExpiryYear = (year: string, format:string) => {
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

export const isValidExpiryDateFormat = (format:string):boolean => {
  if (format) {
    return ALLOWED_EXPIRY_DATE_FORMATS.includes(format);
  }
  return false;
};

export const isValidExpiryYearFormat = (format:string):boolean => {
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
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_GET);
  }
  const { records } = getByIdInput;
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

export const validateCardNumberLengthCheck = (cardNumber:string = ''):boolean => {
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
