/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { CardType, ElementType,COPY_UTILS, CARD_NUMBER_MASK, DEFAULT_CARD_NUMBER_SEPERATOR, CARD_NUMBER_HYPEN_SEPERATOR } from '../../src/core/constants';
import SKYFLOW_ERROR_CODE from '../../src/utils/constants';
import {
  replaceIdInResponseXml,
  appendZeroToOne,
  getReturnValue,
  copyToClipboard,
  handleCopyIconClick,
  fileValidation,
  styleToString,
  appendMonthFourDigitYears,
  appendMonthTwoDigitYears,
  addSeperatorToCardNumberMask,
  constructMaskTranslation,
  formatRevealElementOptions
} from '../../src/utils/helpers/index';
import {
  parameterizedString
} from '../../src/utils/logs-helper';
const xml = '<response><Skyflow>123</Skyflow></response><response2><Skyflow>456</Skyflow></response2>'
import {
  detectCardType
} from '../../src/utils/validators/index';
import successIcon from '../../assets/path.svg'


describe('bin data for for all card number except AMEX element type on CHANGE event', () => {
  test("in PROD return bin data only for card number element", () => {
    expect(detectCardType("4111 1111 1111 1111")).toBe(CardType.VISA)
    expect(getReturnValue("4111 1111 1111 1111", ElementType.CARD_NUMBER, false)).toBe("41111111XXXXXXXX")
    expect(getReturnValue("4111 1111 ", ElementType.CARD_NUMBER, false)).toBe("41111111")
    expect(detectCardType("5105 1051 0510 5100")).toBe(CardType.MASTERCARD)
    expect(getReturnValue("5105 1051 0510 5100", ElementType.CARD_NUMBER, false)).toBe("51051051XXXXXXXX")
    expect(detectCardType("5066 9911 1111 1118")).toBe(CardType.DEFAULT)
    expect(getReturnValue("5066 9911 1111 1118", ElementType.CARD_NUMBER, false)).toBe("50669911XXXXXXXX")
    expect(getReturnValue("123", ElementType.CVV, false)).toBe(undefined)
    expect(getReturnValue("name", ElementType.CARDHOLDER_NAME, false)).toBe(undefined)
    expect(getReturnValue("02", ElementType.EXPIRATION_MONTH, false)).toBe(undefined)
    expect(getReturnValue("2025", ElementType.EXPIRATION_YEAR, false)).toBe(undefined)
    expect(getReturnValue("1234", ElementType.PIN, false)).toBe(undefined)
  })
  test("in DEV return data for all elements", () => {
    expect(getReturnValue("4111 1111 1111 1111", ElementType.CARD_NUMBER, true)).toBe("4111111111111111")
    expect(getReturnValue("123", ElementType.CVV, true)).toBe("123")
    expect(getReturnValue("1234", ElementType.PIN, true)).toBe("1234")
    expect(getReturnValue("name", ElementType.CARDHOLDER_NAME, true)).toBe("name")
    expect(getReturnValue("02", ElementType.EXPIRATION_MONTH, true)).toBe("02")
    expect(getReturnValue("2025", ElementType.EXPIRATION_YEAR, true)).toBe("2025")
  })
})

describe('bin data for for AMEX card number element type on CHANGE event', () => {
  test("in PROD return bin data only for card number element", () => {
    expect(detectCardType("3782 822463 10005")).toBe(CardType.AMEX)
    expect(getReturnValue("3782 822463 10005", ElementType.CARD_NUMBER, false)).toBe("378282XXXXXXXXX")
    expect(getReturnValue("3782 822", ElementType.CARD_NUMBER, false)).toBe("378282X")
    expect(getReturnValue("123", ElementType.CVV, false)).toBe(undefined)
    expect(getReturnValue("name", ElementType.CARDHOLDER_NAME, false)).toBe(undefined)
    expect(getReturnValue("02", ElementType.EXPIRATION_MONTH, false)).toBe(undefined)
    expect(getReturnValue("2025", ElementType.EXPIRATION_YEAR, false)).toBe(undefined)
    expect(getReturnValue("1234", ElementType.PIN, false)).toBe(undefined)
  })
  test("in DEV return data for all elements", () => {
    expect(getReturnValue("3782 822463 10005", ElementType.CARD_NUMBER, true)).toBe("378282246310005")
    expect(getReturnValue("123", ElementType.CVV, true)).toBe("123")
    expect(getReturnValue("1234", ElementType.PIN, true)).toBe("1234")
    expect(getReturnValue("name", ElementType.CARDHOLDER_NAME, true)).toBe("name")
    expect(getReturnValue("02", ElementType.EXPIRATION_MONTH, true)).toBe("02")
    expect(getReturnValue("2025", ElementType.EXPIRATION_YEAR, true)).toBe("2025")
  })
})

describe('test copy feature', () => {
  jest.useFakeTimers();
  test('test handleCopyIcon click function', () => {
    const writeTextMock = jest.fn();
    const navigatorSpy = jest.spyOn(global, 'navigator', 'get');
    navigatorSpy.mockImplementation(() => {
      return {
        clipboard: {
          writeText: writeTextMock,
        },
      };
    });
    copyToClipboard('123');
    expect(writeTextMock).toHaveBeenCalledWith('123');

    const img = document.createElement('img')

    handleCopyIconClick('test', img)
    expect(writeTextMock).toHaveBeenCalledWith('test');
    expect(img.title).toEqual(COPY_UTILS.copied)

    jest.runAllTimers();

    expect(img.title).toEqual(COPY_UTILS.toCopy)

  })
})

describe('test file validation', () => {
  test('invalid file type', () => {
    const invalidFiles = [
      {
        lastModified: '',
        lastModifiedDate: '',
        name: "sample.zip",
        size: 48848,
        type: "application/zip",
        webkitRelativePath: ""
      },
      {
        lastModified: '',
        lastModifiedDate: '',
        name: "sample.deb",
        size: 48848,
        type: "application/vnd.debian.binary-package",
        webkitRelativePath: ""
      }
    ]

    invalidFiles.forEach(invalidFile => {
      try {
        fileValidation(invalidFile)
      } catch(err) {
        expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE.description)
      }      
    })
  })

  test('valid file type', () => {
    const file = {
      lastModified: '',
      lastModifiedDate: '',
      name: "sample.jpg",
      size: 48848,
      type: "image/jpeg",
      webkitRelativePath: ""
    }
    expect(fileValidation(file)).toBe(true);
  })
  test('invalid file size', () => {
    const file = {
      lastModified: '',
      lastModifiedDate: '',
      name: "sample.pdf",
      size: 74570648,
      type: "application/pdf",
      webkitRelativePath: ""
    }
    try {
      fileValidation(file);
    } catch(err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_FILE_SIZE.description)
    }
  })
  test('no file selected', () => {
    const file = {}
      const isValid = fileValidation(file);
      expect(isValid).toBe(true);
  })

  test('no file selected for required file input', () => {
    const file = {}
    try {
      fileValidation(file, true);
    } catch(err) {
      expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.NO_FILE_SELECTED.description)
    }
  })
})

describe('test JSX style object conversion function',()=>{
  test('valid JSX style test 1', () => {
    const test = {
      cursor: "pointer",
      border: "1px solid red",
      backgroundColor:"black",
    }
    const style = "cursor:pointer;border:1px solid red;background-color:black;"
    expect(styleToString(test)).toBe(style);
  })
  test('valid JSX style test 2', () => {
    const test = {
      marginTop: "10px",
      paddingLeft: "10px",
      backgroundColor:"black",
    }
    const style = "margin-top:10px;padding-left:10px;background-color:black;"
    expect(styleToString(test)).toBe(style);
  })
})


describe('test appendMonthFourDigitYears function',()=>{
    test('test for appended zero for month',()=>{
      expect(appendMonthFourDigitYears('2032/1')).toEqual({isAppended:true,value:'2032/01'});
    });
    test('test for non append for month',()=>{
      expect(appendMonthFourDigitYears('2032/09')).toEqual({isAppended:false,value:'2032/09'});
  });
});

describe('test appendMonthTwoDigitYears function',()=>{
  
  test('test for appended zero for month',()=>{
      expect(appendMonthTwoDigitYears('32/1')).toEqual({isAppended:true,value:'32/01'});
  });

  test('test for non append for month',()=>{
    expect(appendMonthTwoDigitYears('32/09')).toEqual({isAppended:false,value:'32/09'});
  });

});

describe('test addSeperatorToCardNumberMask function',()=>{
  
  test('should return default visa mask with spaces if cardSeperator is not provided',()=>{
      expect(addSeperatorToCardNumberMask(CARD_NUMBER_MASK.VISA)).toEqual(CARD_NUMBER_MASK.VISA);
  });
  
  test('should return default visa mask with spaces if cardSeperator is space',()=>{
    expect(addSeperatorToCardNumberMask(CARD_NUMBER_MASK.VISA,DEFAULT_CARD_NUMBER_SEPERATOR)).toEqual(CARD_NUMBER_MASK.VISA);
  });

  test('should return mask with hypen if cardSeperator is hypen',()=>{
    expect(addSeperatorToCardNumberMask(CARD_NUMBER_MASK.VISA,CARD_NUMBER_HYPEN_SEPERATOR)).toEqual(['XXXX-XXXX-XXXX-XXXX',CARD_NUMBER_MASK.VISA[1]]);
  });

  test('should return default amex mask with hypen if cardSeperator is space',()=>{
    expect(addSeperatorToCardNumberMask(CARD_NUMBER_MASK.AMEX,DEFAULT_CARD_NUMBER_SEPERATOR)).toEqual(['XXXX XXXXXX XXXXX',CARD_NUMBER_MASK.AMEX[1]]);
  });

  test('should return amex mask with hypen if cardSeperator is hypen',()=>{
    expect(addSeperatorToCardNumberMask(CARD_NUMBER_MASK.AMEX,CARD_NUMBER_HYPEN_SEPERATOR)).toEqual(['XXXX-XXXXXX-XXXXX',CARD_NUMBER_MASK.AMEX[1]]);
  });

});


describe('test constructMaskTranslation function', () => {
  test('should return empty translation object if no mask is provided', () => {
    expect(constructMaskTranslation()).toEqual({});
    expect(constructMaskTranslation(undefined)).toEqual({});
    expect(constructMaskTranslation(null)).toEqual({});
  });

  test('should return valid translation object if valid mask is provided', () => {
    expect(constructMaskTranslation(['XXXX', null, { X: '[0-9]' }])).toEqual( { X: { pattern: '[0-9]' } });
    expect(constructMaskTranslation(['XXYX', null, { X: '[0-9]', Y: '[A-Z]' }])).toEqual({ X: { pattern: '[0-9]' }, Y: { pattern: '[A-Z]' } } );
  });
});


describe('test formatRevealElementOptions function', () => {
  test('should return empty object if no options are provided', () => {
    expect(formatRevealElementOptions(null)).toEqual({});
    expect(formatRevealElementOptions(undefined)).toEqual({});
    expect(formatRevealElementOptions({})).toEqual({});
  });

  test('should throw error if passed enableCopy option is invalid type', (done) => {
    try {
      formatRevealElementOptions({ enableCopy: '123' })
      done('should throw error');
    } catch (err) {
      expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS.description,'enableCopy'))
      done()
    }
  });

  test('should not throw error if passed enableCopy option is boolean value type', (done) => {
    try {
      formatRevealElementOptions({ enableCopy: true })
      done();
    } catch (err) {
      done(err)
    }
  });

  test('should return mask in options if both format and translation are provided',()=>{
    expect(formatRevealElementOptions({format:'YY-YY',translation:{Y:'[A-Z]'}})).toEqual({mask:['YY-YY',null,{Y:'[A-Z]'}]});
  });

  test('should return mask with default translation if only format is provided',()=>{
    expect(formatRevealElementOptions({format:'XX-XX'})).toEqual({mask:['XX-XX',null,{X:'[0-9]'}]});
  });

  test('should return not return mask if only translation is provided, format is missing',()=>{
    expect(formatRevealElementOptions({translation:{X:'[0-9]'}})).toEqual({});
  });

  test('should return not return mask if format and translation are provided',()=>{
    expect(formatRevealElementOptions({enableCopy:true})).toEqual({enableCopy:true});
  });

});