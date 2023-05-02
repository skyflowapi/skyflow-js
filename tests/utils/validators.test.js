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
  isValidExpiryDateFormat,
  validateInsertRecords,
  validateAdditionalFieldsInCollect,
  validateDetokenizeInput,
  validateGetInput,
  validateInitConfig,
  validateCollectElementInput,
  validateRevealElementRecords,
  isValidExpiryYearFormat,
  validateCardNumberLengthCheck,
  validateUpsertOptions,
  validateGetByIdInput,
  validateComposableContainerOptions,
  validateDeleteRecords,
  validateInputFormatOptions
} from '../../src/utils/validators/index';
import { parameterizedString } from '../../src/utils/logs-helper';
import { RedactionType } from '../../src/utils/common';


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
  test('empty skyflow id', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: 'abc', fields: { 'columnName' : 'value',  skyflowID: ''} }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS.description, 0,true ))
    }
  })
  test('invalid skyflow id', () => {
    try {
      validateAdditionalFieldsInCollect({ records: [{ table: 'abc', fields: { 'columnName' : 'value', skyflowID: []} }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS.description, 0, true))
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

  test('invalid redaction type', () => {
    try {
      validateDetokenizeInput({ records: [{ token: '13213', redaction: 'invalid' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_DETOKENIZE.description, 0))
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


describe('get input validation', () => {

  test('invalid records type', () => {
    try {
      validateGetInput({ records: {} })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_GET.description)
    }
  })


  test('invalid ids', () => {
    try {
      validateGetInput({ records: [{ ids: {} }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_IDS_IN_GET.description, 0))
    }
  })

  test('empty ids', () => {
    try {
      validateGetInput({ records: [{ ids: [] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_IDS_IN_GET.description, 0))
    }
  })

  test('empty id', () => {
    try {
      validateGetInput({ records: [{ ids: [null] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOWID_IN_GET.description, 0))
    }
  })

  test('invalid id', () => {
    try {
      validateGetInput({ records: [{ ids: [{}] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_TYPE_IN_GET.description, 0))
    }
  })

  test('missing table', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'] }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_GET.description, 0))
    }
  })

  test('empty table', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'], table: null }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_GET.description, 0))
    }
  })

  test('invalid table', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'], table: {} }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_GET.description, 0))
    }
  })

  test('missing redaction', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'], table: 'test' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_REDACTION_IN_GET.description, 0))
    }
  })

  test('empty redaction', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'], table: 'test', redaction: null }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_REDACTION_TYPE_IN_GET.description, 0))
    }
  })

  test('invalid redaction', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'], table: 'test', redaction: 'test' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GET.description, 0))
    }
  })
})

describe('get input validation for fetching unique column values',() => {
  test('invalid column values', () => {
    try {
      validateGetInput({ records: [{ table: 'table', columnValues: {}, redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_COLUMN_VALUES_IN_GET.description, 0))
    }
  })
  test('empty column values', () => {
    try {
      validateGetInput({ records: [{ table: 'table', columnValues: null, redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName'}] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_RECORD_COLUMN_VALUES.description, 0))
    }
  })

  test('empty column value', () => {
    try {
      validateGetInput({ records: [{ table: 'table', columnValues: [null], redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_COLUMN_VALUE.description, 0))
    }
  })

  test('invalid column value', () => {
    try {
      validateGetInput({ records: [{ table: 'table', columnValues: [{}], redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_RECORD_COLUMN_VALUE_TYPE.description, 0))
    }
  })

  test('missing table', () => {
    try {
      validateGetInput({ records: [{columnValues: ['123'], redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_GET.description, 0))
    }
  })

  test('empty table', () => {
    try {
      validateGetInput({ records: [{ columnValues: ['123'], table: null, redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_GET.description, 0))
    }
  })

  test('invalid table', () => {
    try {
      validateGetInput({ records: [{ columnValues: ['123'], table: {}, redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_GET.description, 0))
    }
  })

  test('missing redaction', () => {
    try {
      validateGetInput({ records: [{ columnValues: ['123'], table: 'test', columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_REDACTION_IN_GET.description, 0))
    }
  })

  test('empty redaction', () => {
    try {
      validateGetInput({ records: [{ columnValues: ['123'], table: 'test', redaction: null, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_REDACTION_TYPE_IN_GET.description, 0))
    }
  })

  test('invalid redaction', () => {
    try {
      validateGetInput({ records: [{ columnValues: ['123'], table: 'test', redaction: 'test', columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GET.description, 0))
    }
  })
  // test('invalid redaction', () => {
  //   try {
  //     validateGetInput({ records: [{ columnValues: ['123'], table: 'test', redaction: 'test', columnName: 'columnName' }] })
  //   } catch (err) {
  //     expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_IN_GET.description, 0))
  //   }
  // })
  test('invalid column values error', () => {
    try {
      validateGetInput({ records: [{ columnValues: {}, columnName:'cloumn', table: 'test', redaction: RedactionType.PLAIN_TEXT }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_COLUMN_VALUES_IN_GET.description, 0))
    }
  })
  test('empty column values error', () => {
    try {
      validateGetInput({ records: [{ columnValues: [], columnName:'cloumn', table: 'test', redaction: RedactionType.PLAIN_TEXT }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_RECORD_COLUMN_VALUES.description, 0))
    }
  })
  test('missing ids or columnValues in get', () => {
    try {
      validateGetInput({ records: [{ table: 'test', redaction: RedactionType.PLAIN_TEXT }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_IDS_OR_COLUMN_VALUES_IN_GET.description, 0))
    }
  })
  test('missing columnValues key in get', () => {
    try {
      validateGetInput({ records: [{ table: 'test', redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName', columnValues: undefined }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_RECORD_COLUMN_VALUE.description, 0))
    }
  })
  test('ids and columnName both specified in get', () => {
    try {
      validateGetInput({ records: [{ ids: ['123'], table: 'test', redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.SKYFLOW_IDS_AND_COLUMN_NAME_BOTH_SPECIFIED.description, 0))
    }
  })
  test('column values is missing', () => {
    try {
      validateGetInput({ records: [{ table: 'test', redaction: RedactionType.PLAIN_TEXT, columnName: 'columnName' }] })
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_RECORD_COLUMN_VALUE.description, 0))
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
  test('empty vaultURL', () => {
    try {
      validateInitConfig({ vaultID: '123', vaultURL: null })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_VAULTURL_IN_INIT.description)
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
test("invalid skyflow id", () => {
  try {
    validateCollectElementInput({type: 'CARD_NUMBER', skyflowID: undefined })
  } catch (err) {
    expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_IN_COLLECT.description)
  }
})
test("invalid skyflow id", () => {
  try {
    validateCollectElementInput({type: 'FILE_INPUT', skyflowID: undefined, altText: 'text' })
  } catch (err) {
    expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_IN_COLLECT.description)
  }
})
test("missing skyflow id for file type element", () => {
  try {
    validateCollectElementInput({type: 'FILE_INPUT' })
  } catch (err) {
    expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_SKYFLOWID_IN_COLLECT.description)
  }
})

describe("validate reveal element input", () => {
  test("missing token", () => {
    try {
      validateRevealElementRecords([{}])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_TOKEN_KEY_REVEAL.description)
    }
  })

  test("empty token type", () => {
    try {
      validateRevealElementRecords([{ token: null }])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_TOKEN_ID_REVEAL.description)
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

  test("invalid redaction type", () => {
    try {
      validateRevealElementRecords([{ token: '123', redaction: 'invalid' }])
    } catch (err) {
      expect(err?.errors[0]?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_REVEAL.description)
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

describe("validate upsert options in collect", () => {
  test('invalid upsert options type', () => {
    try {
      validateUpsertOptions({})
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_UPSERT_OPTION_TYPE.description)
    }
  })
  test('empty upsert array', () => {
    try {
      validateUpsertOptions([])
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_UPSERT_OPTIONS_ARRAY.description)
    }
  })
  test('invalid upsert object type', () => {
    try {
      validateUpsertOptions([undefined])
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_UPSERT_OPTION_OBJECT_TYPE.description, 0))
    }
  })
  test('missing table key', () => {
    try {
      validateUpsertOptions([{
        column: 'column'
      }])
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_UPSERT_OPTION.description, 0))
    }
  })
  test('missing column key', () => {
    try {
      validateUpsertOptions([{
        table: 'table'
      }])
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_COLUMN_IN_UPSERT_OPTION.description, 0))
    }
  })
  test('invalid table key type', () => {
    try {
      validateUpsertOptions([{
        table: true,
        column: 'column'
      }])
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_UPSERT_OPTION.description, 0))
    }
  })
  test('invalid column key type', () => {
    try {
      validateUpsertOptions([{
        table: 'table',
        column: true
      }])
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_COLUMN_IN_UPSERT_OPTION.description, 0))
    }
  })

})

describe('test validateComposableContainerOptions',()=>{
  test('missing options',()=>{
    try{
      validateComposableContainerOptions();
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_COMPOSABLE_CONTAINER_OPTIONS.description);
    }

    try{
      validateComposableContainerOptions(undefined);
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_COMPOSABLE_CONTAINER_OPTIONS.description);
    }

    try{
      validateComposableContainerOptions(null);
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_COMPOSABLE_CONTAINER_OPTIONS.description);
    }
  });

  test('invalid options type',()=>{
    try{
      validateComposableContainerOptions(true);
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_CONTAINER_OPTIONS.description);
    }

    try{
      validateComposableContainerOptions(123);
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_CONTAINER_OPTIONS.description);
    }
  });

  test('missing layout option',()=>{
    try{
      validateComposableContainerOptions({});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.MISSING_COMPOSABLE_LAYOUT_KEY.description);
    }
  });

  test('invalid layout value',()=>{
    try{
      validateComposableContainerOptions({layout:undefined});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE.description);
    }

    try{
      validateComposableContainerOptions({layout:null});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE.description);
    }
  });

  test('invalid layout value',()=>{
    try{
      validateComposableContainerOptions({layout:'invalid'});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE.description);
    }

    try{
      validateComposableContainerOptions({layout:true});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE.description);
    }
  });

  test('empty layout array',()=>{
    try{
      validateComposableContainerOptions({layout:[]});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_COMPOSABLE_LAYOUT_ARRAY.description);
    }
  });

  test('invalid value in layout array',()=>{
    try{
      validateComposableContainerOptions({layout:[1,'122']});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COMPOSABLE_LAYOUT_TYPE.description);
    }
  });

  test('negative number in layout array',()=>{
    try{
      validateComposableContainerOptions({layout:[2,-1]});
    }catch(err){
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.NEGATIVE_VALUES_COMPOSABLE_LAYOUT.description);
    }
  });

})

describe('delete input records validation', () => {
  test('missing records', () => {
    try {
      validateDeleteRecords({ recordss: {} })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_DELETE.description);
    }
  });

  test('invalid records', () => {
    try {
      validateDeleteRecords({ records: {} })
    } catch (err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_RECORDS_IN_DELETE.description);
    }
  });
  
  test('empty records', () => {
    try {
      validateDeleteRecords({ records: [] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_IN_DELETE.description, 0));
    }
  });
  
  test('missing table key', () => {
    try {
      validateDeleteRecords({ records: [{}] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_DELETE.description, 0));
    }
  });
  
  test('invalid table key value', () => {
    try {
      validateDeleteRecords({ records: [{ table: [] }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_DELETE.description, 0));
    }
  });

  test('empty table key value', () => {
    try {
      validateDeleteRecords({ records: [{ table: '' }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_TABLE_IN_DELETE.description, 0));
    }
  });
  
  test('missing skyflow id', () => {
    try {
      validateDeleteRecords({ records: [{ table: 'table',  }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.MISSING_ID_IN_DELETE.description, 0));
    }
  });

  test('invalid skyflow id key value', () => {
    try {
      validateDeleteRecords({ records: [{ table: 'table', id: 123 }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_ID_IN_DELETE.description, 0));
    }
  });

  test('empty skyflow id key', () => {
    try {
      validateDeleteRecords({ records: [{ table: 'table', id: '' }] })
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.EMPTY_ID_IN_DELETE.description, 0));
    }
  });

})

describe('test validateInputFormatOptions', () => {
  
  test("should not throw error if options are undefined", (done) => {
    try {
      const options = undefined;
      validateInputFormatOptions(null)
      done();
    } catch (err) {
      done(err);
    }
  });

  test("should throw error if the format value is other than string type - undefined", (done) => {
    try {
      const options = { format: undefined }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_FORMAT.description);
      done();
    }
  });

  test("should throw error if the format value is other than string type - null", (done) => {
    try {
      const options = { format: null }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_FORMAT.description);
      done();
    }
  });

  test("should throw error if the format value is other than string type - Number", (done) => {
    try {
      const options = { format: 1233 }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_FORMAT.description);
      done();
    }
  });




  test('should throw error if the translation value is other than object type', (done) => {
    try {
      const options = { translation: undefined }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_TRANSLATION.description);
      done();
    }
  });


  test('should throw error if the translation value is other than object type - undefined', (done) => {
    try {
      const options = { translation: undefined }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_TRANSLATION.description);
      done();
    }
  });


  test('should throw error if the translation value is other than object type - null', (done) => {
    try {
      const options = { translation: null }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_TRANSLATION.description);
      done();
    }
  });

  test('should throw error if the translation value is other than object type - array', (done) => {
    try {
      const options = { translation: [] }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_TRANSLATION.description);
      done();
    }
  });

  test('should throw error if the translation value is other than object type - number', (done) => {
    try {
      const options = { translation: 12334 }
      validateInputFormatOptions(options)
      done('should throw error');
    } catch (err) {
      expect(err.error.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_TRANSLATION.description);
      done();
    }
  });



});
