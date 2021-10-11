import { IRevealElementInput } from '../../container/external/RevealContainer';
import {
  IGatewayConfig,
  IDetokenizeInput,
  IGetByIdInput,
  IInsertRecordInput,
  RedactionType,
  RequestMethod,
} from '../../Skyflow';
import { parameterizedString } from '../logsHelper';
import logs from '../logs';

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

export const validateExpiryDate = (date: string) => {
  const [month, year] = date.includes('/') ? date.split('/') : date.split('-');
  const expiryDate = new Date(`${year}-${month}-01`);
  const today = new Date();

  return expiryDate > today;
};

export const validateInsertRecords = (recordObj: IInsertRecordInput) => {
  if (!('records' in recordObj)) {
    throw new Error(logs.errorLogs.RECORDS_KEY_NOT_FOUND);
  }
  const { records } = recordObj;
  if (records.length === 0) {
    throw new Error(logs.errorLogs.EMPTY_RECORDS);
  }
  records.forEach((record, index) => {
    if (!('table' in record && 'fields' in record)) {
      throw new Error(parameterizedString(logs.errorLogs.EMPTY_TABLE_AND_FIELDS, index));
    }
    if (record.table === '') {
      throw new Error(parameterizedString(logs.errorLogs.EMPTY_TABLE, index));
    }
  });
};

export const validateDetokenizeInput = (detokenizeInput: IDetokenizeInput) => {
  if (!Object.prototype.hasOwnProperty.call(detokenizeInput, 'records')) { throw new Error(logs.errorLogs.MISSING_RECORDS); }

  const { records } = detokenizeInput;
  if (records.length === 0) throw new Error(logs.errorLogs.EMPTY_RECORDS);
  records.forEach((record) => {
    if (Object.keys(record).length === 0) { throw new Error(logs.errorLogs.EMPTY_RECORDS); }

    const recordToken = record.token;
    if (!recordToken) throw new Error(logs.errorLogs.MISSING_TOKEN);
    if (recordToken === '' || typeof recordToken !== 'string') { throw new Error(logs.errorLogs.INVALID_TOKEN_ID); }

    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new Error(logs.errorLogs.MISSING_REDACTION);
    if (!Object.values(RedactionType).includes(recordRedaction)) {
      throw new Error(logs.errorLogs.INVALID_REDACTION_TYPE);
    }
  });
};

export const validateGetByIdInput = (getByIdInput: IGetByIdInput) => {
  if (!Object.prototype.hasOwnProperty.call(getByIdInput, 'records')) { throw new Error(logs.errorLogs.MISSING_RECORDS); }
  const { records } = getByIdInput;
  if (records.length === 0) throw new Error(logs.errorLogs.EMPTY_RECORDS);

  records.forEach((record) => {
    if (Object.keys(record).length === 0) { throw new Error(logs.errorLogs.EMPTY_RECORDS); }

    const recordIds = record.ids;
    if (!recordIds) throw new Error(logs.errorLogs.MISSING_IDS);
    if (recordIds.length === 0) throw new Error(logs.errorLogs.EMPTY_RECORD_IDS);
    recordIds.forEach((skyflowId) => {
      if (typeof skyflowId !== 'string') { throw new Error(logs.errorLogs.INVALID_RECORD_ID_TYPE); }
    });

    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new Error(logs.errorLogs.MISSING_REDACTION);
    if (!Object.values(RedactionType).includes(recordRedaction)) {
      throw new Error(logs.errorLogs.INVALID_REDACTION_TYPE);
    }

    const recordTable = record.table;
    if (!Object.prototype.hasOwnProperty.call(record, 'table')) {
      throw new Error(logs.errorLogs.MISSING_TABLE);
    }

    if (recordTable === '' || typeof recordTable !== 'string') {
      throw new Error(logs.errorLogs.INVALID_RECORD_TABLE_VALUE);
    }
  });
};

export const validateRevealElementRecords = (records: IRevealElementInput[]) => {
  if (records.length === 0) throw new Error(logs.errorLogs.EMPTY_RECORDS);
  records.forEach((record) => {
    if (!Object.prototype.hasOwnProperty.call(record, 'token')) {
      throw new Error(logs.errorLogs.MISSING_TOKEN_KEY);
    }
    const recordToken = record.token;
    if (!recordToken || typeof recordToken !== 'string') throw new Error(parameterizedString(logs.errorLogs.INVALID_TOKEN_ID_WITH_ID, recordToken));
    if (!Object.prototype.hasOwnProperty.call(record, 'redaction')) {
      throw new Error(logs.errorLogs.MISSING_REDACTION);
    }
    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new Error(logs.errorLogs.MISSING_REDACTION_VALUE);
    if (!Object.values(RedactionType).includes(recordRedaction)) {
      throw new Error(logs.errorLogs.INVALID_REDACTION_TYPE);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') throw new Error(logs.errorLogs.INVALID_RECORD_LABEL);

    if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') throw new Error(logs.errorLogs.INVALID_RECORD_ALT_TEXT);
  });
};

export const isValidURL = (url: string) => {
  if (url.substring(0, 5).toLowerCase() !== 'https') {
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

export const validateGatewayConfig = (config: IGatewayConfig) => {
  if (!Object.prototype.hasOwnProperty.call(config, 'gatewayURL')) {
    throw new Error(logs.errorLogs.MISSING_GATEWAY_URL);
  }
  if (typeof config.gatewayURL !== 'string') {
    throw new Error(logs.errorLogs.INVALID_GATEWAY_URL_TYPE);
  }
  if (!isValidURL(config.gatewayURL)) {
    throw new Error(logs.errorLogs.INVALID_GATEWAY_URL);
  }

  if (!Object.prototype.hasOwnProperty.call(config, 'methodName')) {
    throw new Error(logs.errorLogs.MISSING_METHODNAME_KEY);
  }
  if (!Object.values(RequestMethod).includes(config.methodName)) {
    throw new Error(logs.errorLogs.INVALID_METHODNAME_VALUE);
  }
};
