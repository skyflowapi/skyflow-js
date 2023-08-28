/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { SdkInfo } from '../../client';
import {
  CardType,
  COPY_UTILS,
  DEFAULT_INPUT_FORMAT_TRANSLATION,
  ElementType,
  FRAME_ELEMENT,
} from '../../core/constants';
import { IRevealElementOptions } from '../../core/external/reveal/reveal-container';
import SkyflowError from '../../libs/skyflow-error';
import { ContainerType, ISkyflow } from '../../skyflow';
import SKYFLOW_ERROR_CODE from '../constants';
import { detectCardType, isValidURL, validateBooleanOptions } from '../validators';
import properties from '../../properties';
import { getCollectElementValue } from '../bus-events';
import CollectElement from '../../core/external/collect/collect-element';
import { getElementName } from '../logs-helper';

const set = require('set-value');

export const flattenObject = (obj, roots = [] as any, sep = '.') => Object.keys(obj).reduce((memo, prop: any) => ({ ...memo, ...(Object.prototype.toString.call(obj[prop]) === '[object Object]' ? flattenObject(obj[prop], roots.concat([prop])) : { [roots.concat([prop]).join(sep)]: obj[prop] }) }), {});

export function formatFrameNameToId(name: string) {
  const arr = name.split(':');
  if (arr.length > 2) {
    arr.pop();
    arr.pop();
    return arr.join(':');
  }
  return '';
}

export function removeSpaces(inputString:string) {
  return inputString.trim().replace(/[\s-]/g, '');
}

export function formatVaultURL(vaultURL) {
  if (typeof vaultURL !== 'string') return vaultURL;
  return (vaultURL?.trim().slice(-1) === '/') ? vaultURL.slice(0, -1) : vaultURL.trim();
}

export function checkIfDuplicateExists(arr) {
  return new Set(arr).size !== arr.length;
}

export const appendZeroToOne = (value) => {
  if (value.length === 1 && Number(value) === 1) {
    return {
      isAppended: true,
      value: `0${value}`,
    };
  }
  return { isAppended: false, value };
};

export const appendMonthFourDigitYears = (value) => {
  if (value.length === 6 && Number(value.charAt(5)) === 1) {
    return { isAppended: true, value: `${value.substring(0, 5)}0${value.charAt(5)}` };
  }
  return { isAppended: false, value };
};

export const appendMonthTwoDigitYears = (value) => {
  const lastChar = (value.length > 0 && value.charAt(value.length - 1)) || '';
  if (value.length === 4 && Number(lastChar) === 1) {
    return { isAppended: true, value: `${value.substring(0, 3)}0${lastChar}` };
  }
  return { isAppended: false, value };
};

export const getReturnValue = (value: string | Blob, element: string, doesReturnValue: boolean) => {
  if (typeof value === 'string') {
    if (element === ElementType.CARD_NUMBER) {
      value = value && value.replace(/\s/g, '');
      if (!doesReturnValue) {
        const cardType = detectCardType(value);
        const threshold = cardType !== CardType.DEFAULT && cardType === CardType.AMEX ? 6 : 8;
        if (value.length > threshold) {
          return value.replace(new RegExp(`.(?=.{0,${value?.length - threshold - 1}}$)`, 'g'), 'X');
        }
        return value;
      }
      return value;
    } if (doesReturnValue) {
      return value;
    }
  } else {
    return value;
  }
  return undefined;
};

export const copyToClipboard = (text:string) => {
  navigator.clipboard
    .writeText(text);
};

export const handleCopyIconClick = (textToCopy: string, domCopy: any) => {
  copyToClipboard(textToCopy);
  if (domCopy) {
    domCopy.src = COPY_UTILS.successIcon;
    domCopy.title = COPY_UTILS.copied;
    setTimeout(() => {
      if (domCopy) {
        domCopy.src = COPY_UTILS.copyIcon;
        domCopy.title = COPY_UTILS.toCopy;
      }
    }, 1500);
  }
};

const DANGEROUS_FILE_TYPE = ['application/zip', 'application/vnd.debian.binary-package', 'application/vnd.microsoft.portable-executable', 'application/vnd.rar'];
// Check file type and file size in KB
export const fileValidation = (value, required: Boolean = false) => {
  if (required && (value === undefined || value === '')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_FILE_SELECTED, [], true);
  }

  if (DANGEROUS_FILE_TYPE.includes(value.type)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true);
  }

  if (value.size > 32000000) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_SIZE, [], true);
  }

  return true;
};

export const styleToString = (style) => Object.keys(style).reduce((acc, key) => (
  `${acc + key.split(/(?=[A-Z])/).join('-').toLowerCase()}:${style[key]};`
), '');

export const getContainerType = (frameName:string):ContainerType => {
  const frameNameParts = frameName.split(':');
  return (frameNameParts[1] === 'group')
    ? ContainerType.COMPOSABLE
    : ContainerType.COLLECT;
};

export const addSeperatorToCardNumberMask = (
  cardNumberMask: any,
  seperator?: string,
) => {
  if (seperator) {
    return [cardNumberMask[0].replace(/[\s]/g, seperator), cardNumberMask[1]];
  }
  return cardNumberMask;
};

export const constructMaskTranslation = (mask) => {
  const translation = {};
  if (mask) {
    Object.keys(mask[2]).forEach((key) => {
      translation[key] = { pattern: mask[2][key] };
    });
  }
  return translation;
};

export const formatRevealElementOptions = (options:IRevealElementOptions) => {
  let revealOptions:any = {};
  if (options) {
    revealOptions = { ...options };
    if (Object.prototype.hasOwnProperty.call(revealOptions, 'enableCopy') && !validateBooleanOptions(revealOptions.enableCopy)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['enableCopy'], true);
    }
    if (Object.prototype.hasOwnProperty.call(revealOptions, 'format')
    || Object.prototype.hasOwnProperty.call(revealOptions, 'translation')) {
      const revealElementMask:any[] = [];
      if (revealOptions.format) {
        revealElementMask.push(revealOptions.format);
      }

      revealElementMask.push(null); // for replacer

      if (revealOptions.translation) {
        revealElementMask.push(revealOptions.translation);
      } else if (revealOptions.format) {
        revealElementMask.push(DEFAULT_INPUT_FORMAT_TRANSLATION);
      }
      revealOptions = {
        ...revealOptions,
        ...(revealElementMask.length === 3 ? { mask: revealElementMask } : {}),
      };
      delete revealOptions?.format;
      delete revealOptions?.translation;
    }
  }
  return revealOptions;
};
interface OSInfo {
  os: string | null;
  version: string | null;
}
interface BrowserInfo {
  browserName: string;
  browserVersion: string;
}
export function getSdkVersionName(metaDataVersion: string, sdkData: SdkInfo): string {
  if (metaDataVersion !== '') {
    return `${metaDataVersion}`;
  }
  return `${sdkData.sdkName}@${sdkData.sdkVersion}`;
}
export function getOSDetails(userAgentString: string): OSInfo {
  let os: string | null = null;
  let version: string | null = null;

  if (/Windows/.test(userAgentString)) {
    os = 'Windows';
    version = /Windows NT (\d+\.\d+)/.exec(userAgentString)?.[1] ?? null;
  } else if (/Android/.test(userAgentString)) {
    os = 'Android';
    version = /Android (\d+\.\d+)/.exec(userAgentString)?.[1] ?? null;
  } else if (/iOS/.test(userAgentString) || /iPhone/.test(userAgentString)) {
    os = 'iOS';
    version = /OS (\d+[._]\d+[._]?\d*)/.exec(userAgentString)?.[1]?.replace(/_/g, '.') ?? null;
  } else if (/Mac OS X/.test(userAgentString)) {
    os = 'Mac OS X';
    version = /Mac OS X (\d+([._]\d+)*)/.exec(userAgentString)?.[1]?.replace(/_/g, '.') ?? null;
  } else if (/Linux/.test(userAgentString)) {
    os = 'Linux';
    version = /Linux( \w+)*?\/([\w.]+)/.exec(userAgentString)?.[2] ?? null;
  }

  return { os, version };
}

export function getBrowserInfo(userAgentString: string): BrowserInfo {
  let browserName = '';
  let browserVersion = '';

  if (userAgentString.indexOf('MSIE') !== -1 || userAgentString.indexOf('Trident/') !== -1) {
    browserName = 'Internet Explorer';
    const match = userAgentString.match(/(MSIE|rv:)\s?([\d.]+)/);
    if (match) {
      browserVersion = match[2];
    }
  } else if (userAgentString.indexOf('Edge') !== -1) {
    browserName = 'Microsoft Edge';
    const match = userAgentString.match(/Edge\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgentString.indexOf('Chrome') !== -1) {
    browserName = 'Google Chrome';
    const match = userAgentString.match(/Chrome\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgentString.indexOf('Firefox') !== -1) {
    browserName = 'Mozilla Firefox';
    const match = userAgentString.match(/Firefox\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgentString.indexOf('Safari') !== -1) {
    browserName = 'Apple Safari';
    const match = userAgentString.match(/Version\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  }

  return { browserName, browserVersion };
}

export function getDeviceType(userAgent: string): string | undefined {
  const mobileRegex = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/;
  const tabletRegex = /(ipad|tablet)/gi;

  if (tabletRegex.test(userAgent)) {
    return 'tablet';
  }
  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

export function getMetaObject(sdkDetails: any, metaData: any, navigator: any) {
  const sdkData: SdkInfo = {
    sdkName: sdkDetails.name,
    sdkVersion: sdkDetails.version,
  };
  const SDKversion = getSdkVersionName(metaData.sdkVersion, sdkData);
  const osDetail = getOSDetails(navigator.userAgent);
  const browserDetails = getBrowserInfo(navigator.userAgent);
  const deviceDetails = getDeviceType(navigator.userAgent);
  const metaObject = {
    sdk_name_version: SDKversion,
    sdk_client_device_model: deviceDetails,
    sdk_os_version: navigator.platform ?? `${osDetail.os ?? ''} ${osDetail.version ?? ''}`,
    sdk_runtime_details: `${browserDetails.browserName ?? ''} ${browserDetails.browserVersion ?? ''}`,
  };
  return metaObject;
}

export function checkAndSetForCustomUrl(config: ISkyflow) {
  if (
    config?.options?.customElementsURL
    && isValidURL(config?.options?.customElementsURL)
  ) {
    const urlString = config?.options?.customElementsURL;
    const url = new URL(urlString);
    const protocol = url.protocol;
    const domain = url.hostname;
    const fullDomain = `${protocol}//${domain}`;
    properties.IFRAME_SECURE_ORGIN = fullDomain;
    properties.IFRAME_SECURE_SITE = config?.options?.customElementsURL;
  }
}

export function threeDSConfigParser(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof CollectElement) {
      if (!value.isMounted()) {
        throw new SkyflowError(
          SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED_INVOKE_3DS,
          [getElementName(formatFrameNameToId(value.iframeName()))],
        );
      }
      data[key] = value.iframeName();
    } else if (value instanceof Object) {
      threeDSConfigParser(value);
    }
  });
}

export function construct3DSRequest(data: any) {
  const collectElements = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const isCollectElement = value.startsWith(`${FRAME_ELEMENT}:`);
      if (isCollectElement) {
        collectElements[key] = value;
      }
    }
  });

  const promiseList: any = [];

  Object.entries(collectElements).forEach(([key, value]) => {
    promiseList.push(getCollectElementValue(key, value));
  });

  return Promise.all(promiseList)
    .then((res) => {
      res.forEach((element: any) => {
        set(data, element.key, element.value);
      });
      return data;
    })
    .catch((err) => {
      throw err;
    });
}

export function encodePayload(payload) {
  return encodeURIComponent(payload);
}

// Function to redirect with a POST request
export function redirectWithPost(url, payload) {
  const encodedPayload = encodePayload(payload);

  // Create a dynamic form
  const form = document.createElement('form');
  form.setAttribute('action', url);
  form.setAttribute('method', 'POST');

  // Create a hidden input field to hold the encoded payload
  const payloadField = document.createElement('input');
  payloadField.setAttribute('type', 'hidden');
  payloadField.setAttribute('name', 'creq');
  payloadField.setAttribute('value', encodedPayload);

  // Add the payload field to the form
  form.appendChild(payloadField);

  // Append the form to the document body
  document.body.appendChild(form);

  // Submit the form
  form.submit();
}

export function getIframeNameUsingId(id) {
  const afterFirstIndex = id.substring(1);
  const element = document.getElementById(afterFirstIndex);
  return element?.querySelector('iframe')?.getAttribute('name');
}
