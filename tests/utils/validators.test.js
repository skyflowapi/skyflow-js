import {
  validateCreditCardNumber,
  validateExpiryDate,
} from '../../src/utils/validators/index';

describe('Validation card number and Expiry Date', () => {
  test('validate card number', () => {
    const cardNumber = '378282246310005';
    expect(validateCreditCardNumber(cardNumber)).toBe(true);
  });
  test('validate card number', () => {
    const cardNumber = '4789-5673-0754-2090';
    expect(validateCreditCardNumber(cardNumber)).toBe(false);
  });

  test('validate expiry date', () => {
    const expiryDate = '12/2021';
    expect(validateExpiryDate(expiryDate)).toBe(true);
  });

  test('validate expiry date', () => {
    const expiryDate = '17/2021';
    expect(validateExpiryDate(expiryDate)).toBe(false);
  });

  test('validate expiry date', () => {
    const expiryDate = '12/2019';
    expect(validateExpiryDate(expiryDate)).toBe(false);
  });
});
