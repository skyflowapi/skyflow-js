/* eslint-disable max-len */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral, pure validators (card / Luhn / expiry-format / URL / regex).
// No SkyflowError, helpers, logs-helper or container/skyflow input types — those
// package-specific "shape" validators stay in src/utils/validators, which
// re-exports these. Shared by privacyDB now and flowDB later.
import {
  ALLOWED_EXPIRY_DATE_FORMATS,
  ALLOWED_EXPIRY_YEAR_FORMATS,
  CardType, CARD_TYPE_REGEX,
  DEFAULT_CARD_LENGTH_RANGE,
} from '@core/constants';

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

export const validateBooleanOptions = (option) => {
  if (typeof option !== 'boolean') { return false; }

  return true;
};
