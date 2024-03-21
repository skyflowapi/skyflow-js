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
  formatRevealElementOptions,
  getDeviceType,
  getBrowserInfo,
  getOSDetails,
  getSdkVersionName,
  getMetaObject,
  checkAndSetForCustomUrl,
  domReady,
  vaildateFileName,
  generateUploadFileName
  getVaultBeffeURL,
  generateUploadFileName
} from '../../src/utils/helpers/index';
import {
  parameterizedString
} from '../../src/utils/logs-helper';
const xml = '<response><Skyflow>123</Skyflow></response><response2><Skyflow>456</Skyflow></response2>'
import {
  detectCardType
} from '../../src/utils/validators/index';
import successIcon from '../../assets/path.svg'
import { isValidURL } from '../../src/utils/validators/index';

const mockUUID = '1234'

jest.mock('../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUUID)),
}));

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

describe('test file name validation', () => {

  test('invalid file name', () => {
    const invalidFileName = [      {
      lastModified: '',
      lastModifiedDate: '',
      name: "sample .zip",
      size: 48848,
      type: "application/zip",
      webkitRelativePath: ""
    },{
      lastModified: '',
      lastModifiedDate: '',
      name: "sample%.deb",
      size: 48848,
      type: "application/vnd.debian.binary-package",
      webkitRelativePath: ""
    }
  ]
    invalidFileName.forEach(invalidFile => {
      try {
        vaildateFileName(invalidFile)
      } catch(err) {
        expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_FILE_NAME.description)
      }      
    })
  })
  test('valid file name', () => {
    const file = {
      lastModified: '',
      lastModifiedDate: '',
      name: "sample.jpg",
      size: 48848,
      type: "image/jpeg",
      webkitRelativePath: ""
    }
    expect(vaildateFileName(file.name)).toBe(true);
  })
  
  });

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

  test('should return not return mask if only translation is provided, format is missing', () => {
    expect(formatRevealElementOptions({ translation: { X: '[0-9]' } })).toEqual({});
  });

  test('should return not return mask if format and translation are provided', () => {
    expect(formatRevealElementOptions({ enableCopy: true })).toEqual({ enableCopy: true });
  });

});

describe('getMetaObject', () => {
 
  it('should return metaObject  with sdk name skyflow react js', () => {
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const navigator = {
      'userAgent': userAgent
    };
    const sdkDetails = {
      'sdkName': 'skyflow-js',
      'sdkVersion': '1.28@beta'
    };
    const metaData = {
      'sdkVersion': 'skyflow-react-js'
    };
    const deviceType = getMetaObject(sdkDetails, metaData, navigator);
    expect(deviceType).toStrictEqual(
      {
           "sdk_client_device_model": "mobile",
           "sdk_name_version": "skyflow-react-js",
           "sdk_os_version": "iOS 14.5",
           "sdk_runtime_details": " ",
         }
    );
  });

  it('should return metaObject with sdk name skyflow js', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';
    const navigator = {
      'userAgent': userAgent
    };
    const sdkDetails = {
      'name': 'skyflow-js',
      'version': '1.28@beta'
    };
    const metaData = {
      'sdkVersion': ''
    };
    const deviceType = getMetaObject(sdkDetails, metaData, navigator);
    expect(deviceType).toStrictEqual({
      "sdk_client_device_model": "desktop",
      "sdk_name_version": "skyflow-js@1.28@beta",
      "sdk_os_version": "Windows 10.0",
      "sdk_runtime_details": "Google Chrome 90.0.4430.212",
    });
  });

  it('should return metaObject with sdk name skyflow js and other detalis as null', () => {
    const navigator = {
      'userAgent': ''
    };
    const sdkDetails = {
      'name': 'skyflow-js',
      'version': '1.28@beta'
    };
    const metaData = {
      'sdkVersion': ''
    };
    const deviceType = getMetaObject(sdkDetails, metaData, navigator);
    expect(deviceType).toStrictEqual({
      "sdk_client_device_model": "desktop",
      "sdk_name_version": "skyflow-js@1.28@beta",
      "sdk_os_version": " ",
      "sdk_runtime_details": " ",
    });
  });
});

describe('getDeviceType', () => {
  it('should return "mobile" for mobile user agents', () => {
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const deviceType = getDeviceType(userAgent);
    expect(deviceType).toBe('mobile');
  });

  it('should return "tablet" for tablet user agents', () => {
    const userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
    const deviceType = getDeviceType(userAgent);
    expect(deviceType).toBe('tablet');
  });

  it('should return "desktop" for desktop user agents', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';
    const deviceType = getDeviceType(userAgent);
    expect(deviceType).toBe('desktop');
  });

  it('should return desktop for user agents that do not contain device information', () => {
    const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const deviceType = getDeviceType(userAgent);
    expect(deviceType).toBe('desktop');
  });
});

describe('getBrowserInfo', () => {
  it('should correctly identify Internet Explorer', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko');
    expect(result).toEqual({ browserName: 'Internet Explorer', browserVersion: '11.0' });
  });

  it('should correctly identify Internet Explorer and version as null', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/ ; AS;) like Gecko');
    expect(result).toEqual({ browserName: 'Internet Explorer', browserVersion: '' });
  });

  it('should correctly identify Microsoft Edge', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299');
    expect(result).toEqual({ browserName: 'Microsoft Edge', browserVersion: '16.16299' });
  });

  it('should correctly identify Microsoft Edge and version as null', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge');
    expect(result).toEqual({ browserName: 'Microsoft Edge', browserVersion: '' });
  });

  it('should correctly identify Google Chrome', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
    expect(result).toEqual({ browserName: 'Google Chrome', browserVersion: '58.0.3029.110' });
  });

  it('should correctly identify Google Chrome and version as null', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome');
    expect(result).toEqual({ browserName: 'Google Chrome', browserVersion: '' });
  });

  it('should correctly identify Mozilla Firefox', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:54.0) Gecko/20100101 Firefox/54.0');
    expect(result).toEqual({ browserName: 'Mozilla Firefox', browserVersion: '54.0' });
  });

  it('should correctly identify Mozilla Firefox and version as null', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:54.0) Gecko/20100101 Firefox');
    expect(result).toEqual({ browserName: 'Mozilla Firefox', browserVersion: '' });
  });

  it('should correctly identify Apple Safari and version as null', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.3.5 (KHTML, like Gecko) Version Safari');
    expect(result).toEqual({ browserName: 'Apple Safari', browserVersion: '' });
  });

  it('should correctly identify Apple Safari', () => {
    const result = getBrowserInfo('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0.3 Safari/604.3.5');
    expect(result).toEqual({ browserName: 'Apple Safari', browserVersion: '11.0.3' });
  });

  it('should return an empty object if the user agent string is not recognized', () => {
    const result = getBrowserInfo('Unknown User Agent');
    expect(result).toEqual({ browserName: '', browserVersion: '' });
  });
});

describe('getSdkVersionName', () => {
  it('should correctly identify js sdk name when we pass metadata version as empty string', () => {
    const sdkData = {
      sdkName: 'skyflow-js',
      sdkVersion: '1.29@beta',
    };
    const result = getSdkVersionName('', sdkData);
    expect(result).toEqual('skyflow-js@1.29@beta');
  });

  it('should correctly identify react sdk name when we pass metadata version as skyflow-react-js', () => {
    const sdkData = {
      sdkName: 'skyflow-js',
      sdkVersion: '1.29@beta',
    };
    const result = getSdkVersionName('skyflow-react-js', sdkData);
    expect(result).toEqual('skyflow-react-js');
  });
});
describe('getOSDetails', () => {
  it('should correctly parse Windows user agent string', () => {
    const userAgentString = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('Windows');
    expect(osDetails.version).toEqual('10.0');
  });

  it('should parse Windows user agent string and version as null', () => {
    const userAgentString = 'Mozilla/5.0 (Windows NT ; Win64; x64) AppleWebKit/ (KHTML, like Gecko) Chrome/ Safari/';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('Windows');
    expect(osDetails.version).toEqual(null);
  });

  it('should correctly parse Mac OS X user agent string', () => {
    const userAgentString = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('Mac OS X');
    expect(osDetails.version).toEqual('10.15.7');
  });

  it('should correctly parse Mac OS X user agent string and version as null', () => {
    const userAgentString = 'Mozilla/5.0 (Macintosh; Intel Mac OS X ) AppleWebKit/ (KHTML, like Gecko) Chrome/ Safari/';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('Mac OS X');
    expect(osDetails.version).toEqual(null);
  });

  it('should correctly parse Linux user agent string', () => {
    const userAgentString = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('Linux');
    expect(osDetails.version).toEqual(null);
  });

  it('should correctly parse Android user agent string', () => {
    const userAgentString = 'Mozilla/5.0 (Linux; Android 11; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.62 Mobile Safari/537.36';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('Android');
    expect(osDetails.version).toEqual(null);
  });

  it('should correctly parse iOS user agent string', () => {
    const userAgentString = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('iOS');
    expect(osDetails.version).toEqual('15.0');
  });

  it('should correctly parse iOS user agent string and version as null', () => {
    const userAgentString = 'Mozilla/5.0 (iPhone; CPU iPhone OS like Mac OS X) AppleWebKit/ (KHTML, like Gecko) Version/ Mobile/ Safari/';
    const osDetails = getOSDetails(userAgentString);
    expect(osDetails.os).toEqual('iOS');
    expect(osDetails.version).toEqual(null);
  });
});
describe('checkAndSetForCustomUrl', () => {
  it('should correctly parse url string and set IFRAME_SECURE origin and site', () => {
    const config = {
      getBearerToken: () => { },
      options: {
        customElementsURL: 'https://js.skyflow.com'
      },
    };
    checkAndSetForCustomUrl(config);
    const isValid = isValidURL(config.options.customElementsURL);
    expect(isValid).toEqual(true);
  });

  it('should not parse url string and set IFRAME_SECURE origin and site', () => {
    const config = {
      getBearerToken: () => { },
      options: {
        customElementsURL: 'wrong_url'
      },
    };
    checkAndSetForCustomUrl(config);
    const isValid = isValidURL(config.options.customElementsURL);
    expect(isValid).toEqual(false);
  });
});


describe('test domReady function', () => {
  let pagestate="loading";
  Object.defineProperty(document, "readyState", {
    get() { return pagestate; }
  });
  jest.useFakeTimers();

  test('should not call function right away if readyState is loading', () => {
    const testSpyFunction = jest.fn();
    pagestate="loading";
    domReady(testSpyFunction);
    jest.runAllTimers();
    expect(testSpyFunction).not.toBeCalled()
  })
  
  test('should call function directly if readyState is not loading', () => {
    const testSpyFunction = jest.fn();
    pagestate="complete";
    domReady(testSpyFunction);
    jest.runAllTimers();
    expect(testSpyFunction).toBeCalled()
  })

  test('should call multiple functions in sequence when page is loading',()=>{
    const testSpyFunction1 = jest.fn();
    const testSpyFunction2 = jest.fn();
    domReady(testSpyFunction1);
    domReady(testSpyFunction2);
    pagestate="loading";
    expect(testSpyFunction1).not.toBeCalled()
    expect(testSpyFunction2).not.toBeCalled()
    pagestate='complete'
    window.document.dispatchEvent(new Event("DOMContentLoaded", {
      bubbles: true,
      cancelable: true
    }));
    jest.runAllTimers();
    expect(testSpyFunction1).toBeCalled()
    expect(testSpyFunction2).toBeCalled()
  })
})


describe('test generateUploadFileName function',()=>{
  it('should return file name with uuid and extension',()=>{
      expect(generateUploadFileName('test_file.png')).toEqual(`${mockUUID}.png`);
  });

  it('should return file name with  uuid and extension even with multiple in the file name',()=>{
    expect(generateUploadFileName('test.file.pdf')).toEqual(`${mockUUID}.pdf`);
  });

  it('should return file name with uuid for undefined file name',()=>{
    expect(generateUploadFileName(undefined)).toEqual(`${mockUUID}`);
    expect(generateUploadFileName(null)).toEqual(`${mockUUID}`);
  });




});

describe('test vault beffe url helper', () => {
  test("test with vault string in vault url", () => {
    expect(getVaultBeffeURL("test.vault.com")).toBe("test.vault-beffe.com")
  })
  test("test without vault string in vault url", () => {
    expect(getVaultBeffeURL("test.com")).toBe("test.com")
  })
})

describe('test generateUploadFileName function',()=>{
  it('should return file name with uuid and extension',()=>{
      expect(generateUploadFileName('test_file.png')).toEqual(`${mockUUID}.png`);
  });

  it('should return file name with  uuid and extension even with multiple in the file name',()=>{
    expect(generateUploadFileName('test.file.pdf')).toEqual(`${mockUUID}.pdf`);
  });

  it('should return file name with uuid for undefined file name',()=>{
    expect(generateUploadFileName(undefined)).toEqual(`${mockUUID}`);
    expect(generateUploadFileName(null)).toEqual(`${mockUUID}`);
  });




});

