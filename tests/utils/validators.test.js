import { CardType } from '../../src/core/constants';
import {
  detectCardType,
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
    const currentDate = new Date();
    const expiryDate = `01/${currentDate.getFullYear()+1}`;
    expect(validateExpiryDate(expiryDate,"MM/YYYY")).toBe(true);
  });

  test('validate expiry date', () => {
    const expiryDate = '17/2021';
    expect(validateExpiryDate(expiryDate,"MM/YYYY")).toBe(false);
  });

  test('validate expiry date', () => {
    const expiryDate = '12/2019';
    expect(validateExpiryDate(expiryDate,"MM/YYYY")).toBe(false);
  });
});
describe('Detect Card Type',()=>{
  test("Default type for Empty String",()=>{
    expect(detectCardType("")).toBe(CardType.DEFAULT);
  });
  test("Default type for invalid String",()=>{
    expect(detectCardType("not_a_card_number")).toBe(CardType.DEFAULT);
  });
  test("Detects Visa Card Type",()=>{
    expect(detectCardType("4111")).toBe(CardType.VISA);
  });
  test("Detects Master Card Type",()=>{
    expect(detectCardType("5105105105105100")).toBe(CardType.MASTERCARD);
  });
  test("Detects Amex Card Type",()=>{
    expect(detectCardType("378282246310005")).toBe(CardType.AMEX);
  });
  test("Detects Dinners Club Type",()=>{
    expect(detectCardType("30569309025904")).toBe(CardType.DINERS_CLUB);
  });
  test("Detects Discover Card Type",()=>{
    expect(detectCardType("6011111111111117")).toBe(CardType.DISCOVER);
  });
  test("Detects JCB Card Type",()=>{
    expect(detectCardType("3530111333300000")).toBe(CardType.JCB);
  });
  test("Detects Hipper Card Type",()=>{
    expect(detectCardType("6062828888666688")).toBe(CardType.HIPERCARD);
  });
  test("Detects Mastero Card Type",()=>{
    expect(detectCardType("6759649826438453")).toBe(CardType.MAESTRO);
  });
  test("Detects Union Pay Card Type",()=>{
    expect(detectCardType("6221260062379699")).toBe(CardType.UNIONPAY);
  });
});