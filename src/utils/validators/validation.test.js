import {validateCreditCardNumber,validateExpiryDate} from "./index";

describe("Validation card number and Expiry Date", () => {
  test("validate card number", () => {
    var cardNumber = "378282246310005";
    expect(validateCreditCardNumber(cardNumber)).toBe(true);
  });
  test("validate card number", () => {
    var cardNumber = "4789-5673-0754-2090";
    expect(validateCreditCardNumber(cardNumber)).toBe(false);
  });
  
  test("validate expiry date", () => {
    var expiryDate = "12/2021";
    expect(validateExpiryDate(expiryDate)).toBe(true);
  });

  test("validate expiry date", () => {
    var expiryDate = "17/2021";
    expect(validateExpiryDate(expiryDate)).toBe(false);
  });

  test("validate expiry date", () => {
    var expiryDate = "12/2019";
    expect(validateExpiryDate(expiryDate)).toBe(false);
  });
  
});
