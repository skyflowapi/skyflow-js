/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { CardType } from '../../src/core/constants';
import SKYFLOW_ERROR_CODE from '../../src/utils/constants';
import {
  detectCardType,
  isValidRegExp,
  validateCreditCardNumber,
  validateExpiryDate,
  validateConnectionConfig,
  isValidExpiryDateFormat,
  validateSoapConnectionConfig,
  validateInsertRecords,
  validateAdditionalFieldsInCollect,
  validateDetokenizeInput,
  validateGetByIdInput,
  validateInitConfig,
  validateInitConfigInConnections,
  validateCollectElementInput,
  validateRevealOptions,
  validateRevealElementRecords,
  isValidExpiryYearFormat,
  validateCardNumberLengthCheck
} from '../../src/utils/validators/index';
import { parameterizedString } from '../../src/utils/logs-helper';


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
    const expiryDate = `01/${currentDate.getFullYear() + 1}`;
    expect(validateExpiryDate(expiryDate, "MM/YYYY")).toBe(true);
  });

  test('validate expiry date, MM/YYYY', () => {
    const expiryDate = '17/2021';
    expect(validateExpiryDate(expiryDate, "MM/YYYY")).toBe(false);
  });

  test('validate expiry date, YYYY/MM', () => {
    const expiryDate = '2019/01';
    expect(validateExpiryDate(expiryDate, "YYYY/MM")).toBe(false);
  });

  test('validate expiry date, YY/MM', () => {
    const expiryDate = '19/01';
    expect(validateExpiryDate(expiryDate, "YY/MM")).toBe(false);
  });

  test('validate expiry date, MM/YY', () => {
    const expiryDate = '01/19';
    expect(validateExpiryDate(expiryDate, "MM/YY")).toBe(false);
  });

  test('empty expirydateformat', () => {
    expect(isValidExpiryDateFormat(null)).toBe(false);
  })

  test('invalid expirydateformat ', () => {
    expect(isValidExpiryDateFormat("M/Y")).toBe(false);
  })

  test('valid expirydateformat ', () => {
    expect(isValidExpiryDateFormat("MM/YY")).toBe(true);
  })
});
describe('Detect Card Type', () => {
  test("Default type for Empty String", () => {
    expect(detectCardType("")).toBe(CardType.DEFAULT);
  });
  test("Default type for invalid String", () => {
    expect(detectCardType("not_a_card_number")).toBe(CardType.DEFAULT);
  });
  test("Detects Visa Card Type", () => {
    expect(detectCardType("4111")).toBe(CardType.VISA);
  });
  test("Detects Master Card Type", () => {
    expect(detectCardType("5105105105105100")).toBe(CardType.MASTERCARD);
  });
  test("Detects Amex Card Type", () => {
    expect(detectCardType("378282246310005")).toBe(CardType.AMEX);
  });
  test("Detects Dinners Club Type", () => {
    expect(detectCardType("30569309025904")).toBe(CardType.DINERS_CLUB);
  });
  test("Detects Discover Card Type", () => {
    expect(detectCardType("6011111111111117")).toBe(CardType.DISCOVER);
  });
  test("Detects JCB Card Type", () => {
    expect(detectCardType("3530111333300000")).toBe(CardType.JCB);
  });
  test("Detects Hipper Card Type", () => {
    expect(detectCardType("6062828888666688")).toBe(CardType.HIPERCARD);
  });
  test("Detects Mastero Card Type", () => {
    expect(detectCardType("6759649826438453")).toBe(CardType.MAESTRO);
  });
  test("Detects Union Pay Card Type", () => {
    expect(detectCardType("6221260062379699")).toBe(CardType.UNIONPAY);
  });
  test("Detects Unknown Pay Card Type", () => {
    expect(detectCardType("5066991111111118")).toBe(CardType.DEFAULT);
  });
  test("Detects Unknown Pay Card Type", () => {
    expect(detectCardType("5067215824168408")).toBe(CardType.DEFAULT);
  });
});

describe('insert records validation', () => {
  test('invalid records type', () => {
    try {
      validateInsertRecords({ records: {} })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_INSERT.description);
    }
  })

  test('invalid table type', () => {
    try {
      validateInsertRecords({ records: [{ table: [] }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_INSERT.description, 0))
    }
  })

  test('empty fields', () => {
    try {
      validateInsertRecords({ records: [{ table: 'abc', fields: null }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_FIELDS_IN_INSERT.description, 0))
    }
  })

  test('invalid fields', () => {
    try {
      validateInsertRecords({ records: [{ table: 'abc', fields: 'invalid' }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_FIELDS_IN_INSERT.description, 0))
    }
  })

  test('invalid options', () => {
    try {
      validateInsertRecords({ records: [{ table: 'abc', fields: {} }] }, { tokens: '123' })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_INSERT.description)
    }
  })
})

describe('insert additional records validation', () => {
  test('records not found', () => {
    try {
      validateAdditionalFieldsInCollect()
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS.description)
    }
  })

  test('invalid records type', () => {
    try {
      validateAdditionalFieldsInCollect({ records: {} })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_ADDITIONAL_FIELDS.description)
    }
  })

  test('empty records', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [] })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_IN_ADDITIONAL_FIELDS.description)
    }
  })

  test('missing table', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{}] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_ADDITIONAL_FIELDS.description, 0))
    }
  })

  test('empty table', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: null }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_ADDITIONAL_FIELDS.description, 0))
    }
  })

  test('invalid table type', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: {} }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_ADDITIONAL_FIELDS.description, 0))
    }
  })

  test('missing fields', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: 'abc' }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_FIELDS_IN_ADDITIONAL_FIELDS.description, 0))
    }
  })

  test('empty fields', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: 'abc', fields: null }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_FIELDS_IN_ADDITIONAL_FIELDS.description, 0))
    }
  })

  test('invalid fields', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: 'abc', fields: [] }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_FIELDS_IN_ADDITIONAL_FIELDS.description, 0))
    }
  })
})

describe('detokenize input validation', () => {
  test('records not found', () => {
    try {
      validateDetokenizeInput()
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_DETOKENIZE.description)
    }
  })

  test('invalid records type', () => {
    try {
      validateDetokenizeInput({ records: {} })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_DETOKENIZE.description)
    }
  })

  test('empty records', () => {
    try {
      validateDetokenizeInput({ records: [] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_DETOKENIZE.description)
    }
  })

  test('invalid tokens', () => {
    try {
      validateDetokenizeInput({ records: [{ token: {} }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TOKEN_IN_DETOKENIZE.description, 0))
    }
  })
})


describe('getById input validation', () => {

  test('invalid records type', () => {
    try {
      validateGetByIdInput({ records: {} })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_GETBYID.description)
    }
  })


  test('invalid ids', () => {
    try {
      validateGetByIdInput({ records: [{ ids: {} }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_IDS_IN_GETBYID.description, 0))
    }
  })

  test('empty ids', () => {
    try {
      validateGetByIdInput({ records: [{ ids: [] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_IDS_IN_GETBYID.description, 0))
    }
  })

  test('empty id', () => {
    try {
      validateGetByIdInput({ records: [{ ids: [null] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOWID_IN_GETBYID.description, 0))
    }
  })

  test('invalid id', () => {
    try {
      validateGetByIdInput({ records: [{ ids: [{}] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_TYPE_IN_GETBYID.description, 0))
    }
  })

  test('missing table', () => {
    try {
      validateGetByIdInput({ records: [{ ids: ['123'] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_GETBYID.description, 0))
    }
  })

  test('empty table', () => {
    try {
      validateGetByIdInput({ records: [{ ids: ['123'], table: null }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_GETBYID.description, 0))
    }
  })

  test('invalid table', () => {
    try {
      validateGetByIdInput({ records: [{ ids: ['123'], table: {} }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_GETBYID.description, 0))
    }
  })

  test('missing redaction', () => {
    try {
      validateGetByIdInput({ records: [{ ids: ['123'], table: 'test' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_REDACTION_IN_GETBYID.description, 0))
    }
  })

  test('empty redaction', () => {
    try {
      validateGetByIdInput({ records: [{ ids: ['123'], table: 'test', redaction: null }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_REDACTION_TYPE_IN_GETBYID.description, 0))
    }
  })

  test('invalid redaction', () => {
    try {
      validateGetByIdInput({ records: [{ ids: ['123'], table: 'test', redaction: 'test' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GETBYID.description, 0))
    }
  })
})

describe('skyflow init validation', () => {

  test('missing vaultID', () => {
    try {
      validateInitConfig({})
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.VAULTID_IS_REQUIRED.description)
    }
  })

  test('empty vaultID', () => {
    try {
      validateInitConfig({ vaultID: null })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_VAULTID_IN_INIT.description)
    }
  })

  test('missing vaultURL', () => {
    try {
      validateInitConfig({ vaultID: '123' })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.VAULTURL_IS_REQUIRED.description)
    }
  })

  test('invalid vaultURL', () => {
    try {
      validateInitConfig({ vaultID: '123', vaultURL: 'url' })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_VAULTURL_IN_INIT.description)
    }
  })

  test('missing getBearerToken', () => {
    try {
      validateInitConfig({ vaultID: '123', vaultURL: 'https://abc.com' })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.GET_BEARER_TOKEN_IS_REQUIRED.description)
    }
  })
})


describe("validate collect element input", () => {
  test("missing type", () => {
    try {
      validateCollectElementInput({})
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_ELEMENT_TYPE.description)
    }
  })

  test("empty type", () => {
    try {
      validateCollectElementInput({ type: null })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_TYPE.description)
    }
  })
})

describe("validate reveal element input", () => {
  test("missing token", () => {
    try {
      validateRevealElementRecords([{}])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_TOKEN_KEY_REVEAL.description)
    }
  })

  test("invalid token type", () => {
    try {
      validateRevealElementRecords([{ token: {} }])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_TOKEN_ID_REVEAL.description)
    }
  })

  test("invalid label type", () => {
    try {
      validateRevealElementRecords([{ token: '123', label: {} }])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_LABEL_REVEAL.description)
    }
  })

  test("invalid altText type", () => {
    try {
      validateRevealElementRecords([{ token: '123', altText: {} }])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_ALT_TEXT_REVEAL.description)
    }
  })

})


describe("validate regex", () => {
  test("invalid regex", () => {
    const str = "(?("
    expect(isValidRegExp(str)).toBeFalsy()
  })
})

const initConfig = {
  vaultID: 'testId',
  vaultURL: 'https://test.com',
  getBearerToken: jest.fn()
}





describe("validate expiration year formats", () => {
  test("isValidExpiryYearFormat", () => {
    expect(isValidExpiryYearFormat()).toBeFalsy()
  })
})

describe("validate card number length check", () => {
  test("isValidCardNumber", () => {
    expect(validateCardNumberLengthCheck('5105105105105100')).toBeTruthy();
    expect(validateCardNumberLengthCheck('510510')).toBeFalsy();
  })
})