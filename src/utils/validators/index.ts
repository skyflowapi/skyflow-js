import { CardType, CARD_TYPE_REGEX, DEFAULT_CARD_LENGTH_RANGE } from '../../container/constants';
import { IRevealElementInput } from '../../container/external/RevealContainer';
import SkyflowError from '../../libs/SkyflowError';
import {
  IInsertRecordInput,
  IDetokenizeInput,
  RedactionType,
  IGetByIdInput,
  IConnectionConfig,
  RequestMethod,
} from '../common';
import SKYFLOW_ERROR_CODE from '../constants';

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

export const validateExpiryDate = (date: string) => {
  const [month, year] = date.includes('/') ? date.split('/') : date.split('-');
  const expiryDate = new Date(`${year}-${month}-01`);
  const today = new Date();

  return expiryDate > today;
};

export const validateInsertRecords = (recordObj: IInsertRecordInput) => {
  if (!('records' in recordObj)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND, [], true);
  }
  const { records } = recordObj;
  if (records.length === 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS, [], true);
  }
  records.forEach((record, index) => {
    if (!('table' in record && 'fields' in record)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_AND_FIELDS, [`${index}`], true);
    }
    if (record.table === '') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE, [`${index}`], true);
    }
  });
};

export const validateDetokenizeInput = (detokenizeInput: IDetokenizeInput) => {
  if (!Object.prototype.hasOwnProperty.call(detokenizeInput, 'records')) throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_RECORDS);

  const { records } = detokenizeInput;
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS);
  records.forEach((record) => {
    if (Object.keys(record).length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS);
    }

    const recordToken = record.token;
    if (!recordToken) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN);
    }
    if (recordToken === '' || typeof recordToken !== 'string') { throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_ID); }

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
  if (!Object.prototype.hasOwnProperty.call(getByIdInput, 'records')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_RECORDS);
  }
  const { records } = getByIdInput;
  if (records.length === 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS);
  }

  records.forEach((record) => {
    if (Object.keys(record).length === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS);
    }

    const recordIds = record.ids;
    if (!recordIds) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_IDS);
    }
    if (recordIds.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORD_IDS);
    recordIds.forEach((skyflowId) => {
      if (typeof skyflowId !== 'string') throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORD_ID_TYPE);
    });

    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION);
    if (!Object.values(RedactionType).includes(recordRedaction)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE);
    }

    const recordTable = record.table;
    if (!Object.prototype.hasOwnProperty.call(record, 'table')) { throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE); }

    if (recordTable === '' || typeof recordTable !== 'string') { throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORD_TABLE_VALUE); }
  });
};

export const validateRevealElementRecords = (records: IRevealElementInput[]) => {
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS);
  records.forEach((record) => {
    if (!Object.prototype.hasOwnProperty.call(record, 'token')) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN_KEY);
    }
    const recordToken = record.token;
    if (!recordToken || typeof recordToken !== 'string') { throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_ID); }

    // if (!Object.prototype.hasOwnProperty.call(record, 'redaction')) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION);
    // }
    // const recordRedaction = record.redaction;
    // if (!recordRedaction) throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REDACTION_VALUE);
    // if (!Object.values(RedactionType).includes(recordRedaction)) {
    //   throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE);
    // }

    if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') { throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORD_LABEL); }

    if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RECORD_ALT_TEXT);
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
  if (!Object.prototype.hasOwnProperty.call(config, 'connectionURL')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_CONNECTION_URL);
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
