import { IRevealElementInput } from '../../container/external/RevealContainer';
import {
  IDetokenizeInput,
  IGetByIdInput,
  IInsertRecordInput,
  RedactionType,
} from '../../Skyflow';

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
    throw new Error('records object key value not found');
  }
  const { records } = recordObj;
  if (records.length === 0) {
    throw new Error('records object is empty');
  }
  records.forEach((record) => {
    if (!('table' in record && 'fields' in record)) {
      throw new Error('table or fields parameter cannot be passed as empty');
    }
    if (record.table === '') {
      throw new Error("Table can't be passed as empty");
    }
  });
};

export const validateDetokenizeInput = (detokenizeInput: IDetokenizeInput) => {
  if (!Object.prototype.hasOwnProperty.call(detokenizeInput, 'records')) throw new Error('Missing records property');

  const { records } = detokenizeInput;
  if (records.length === 0) throw new Error('Empty Records');
  records.forEach((record) => {
    if (Object.keys(record).length === 0) throw new Error('Record cannot be Empty Object');

    const recordToken = record.token;
    if (!recordToken) throw new Error('Missing token property');
    if (recordToken === '' || typeof recordToken !== 'string') throw new Error('Invalid Token Id');

    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new Error('Missing Redaction property');
    if (!Object.values(RedactionType).includes(recordRedaction)) throw new Error('Invalid Redaction Type');
  });
};

export const validateGetByIdInput = (getByIdInput: IGetByIdInput) => {
  if (!Object.prototype.hasOwnProperty.call(getByIdInput, 'records')) throw new Error('Missing records property');
  const { records } = getByIdInput;
  if (records.length === 0) throw new Error('Empty Records');

  records.forEach((record) => {
    if (Object.keys(record).length === 0) throw new Error('Record cannot be Empty Object');

    const recordIds = record.ids;
    if (!recordIds) throw new Error('Missing ids property');
    if (recordIds.length === 0) throw new Error('Record ids cannot be Empty');
    recordIds.forEach((skyflowId) => {
      if (typeof skyflowId !== 'string') throw new Error('Invalid Type of Records Id');
    });

    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new Error('Missing Redaction property');
    if (!Object.values(RedactionType).includes(recordRedaction)) throw new Error('Invalid Redaction Type');

    const recordTable = record.table;
    if (!Object.prototype.hasOwnProperty.call(record, 'table')) throw new Error('Missing Table Property');

    if (recordTable === '' || typeof recordTable !== 'string') throw new Error('Invalid Record Table value');
  });
};

export const validateRevealElementInput = (record: IRevealElementInput) => {
  const recordToken = record.token;
  if (!recordToken || typeof recordToken !== 'string') throw new Error(`Invalid Token Id ${recordToken}`);

  const recordRedaction = record.redaction;
  if (!Object.values(RedactionType).includes(recordRedaction)) throw new Error(`Invalid Redaction Type ${recordRedaction}`);

  if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') throw new Error('Invalid Record Label Type');

  if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') throw new Error('Invalid Record altText Type');
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
