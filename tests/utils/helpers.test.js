/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { CardType, ElementType,COPY_UTILS } from '../../src/core/constants';
import SKYFLOW_ERROR_CODE from '../../src/utils/constants';
import {
  replaceIdInResponseXml,
  appendZeroToOne,
  getReturnValue,
  copyToClipboard,
  handleCopyIconClick,
  fileValidation,
  styleToString
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
    const zipFile = {
      lastModified: '',
      lastModifiedDate: '',
      name: "sample.zip",
      size: 48848,
      type: "application/zip",
      webkitRelativePath: ""
    }
    const debFile = {
      lastModified: '',
      lastModifiedDate: '',
      name: "sample.deb",
      size: 48848,
      type: "application/vnd.debian.binary-package",
      webkitRelativePath: ""
    }
    expect(fileValidation(zipFile)).toBe(false);
    expect(fileValidation(debFile)).toBe(false);

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
    expect(fileValidation(file)).toBe(false);
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