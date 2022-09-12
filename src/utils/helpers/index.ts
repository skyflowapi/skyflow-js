/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  CardType,
  COPY_UTILS, ElementType,
} from '../../core/constants';
import { detectCardType } from '../validators';

export const flattenObject = (obj, roots = [] as any, sep = '.') => Object.keys(obj).reduce((memo, prop: any) => ({ ...memo, ...(Object.prototype.toString.call(obj[prop]) === '[object Object]' ? flattenObject(obj[prop], roots.concat([prop])) : { [roots.concat([prop]).join(sep)]: obj[prop] }) }), {});

export function deletePropertyPath(obj, path) {
  if (!obj || !path) {
    return;
  }

  if (typeof path === 'string') {
    path = path.split('.');
  }

  for (let i = 0; i < path.length - 1; i += 1) {
    obj = obj[path[i]];

    if (typeof obj === 'undefined') {
      return;
    }
  }

  delete obj[path.pop()];
}

export function clearEmpties(o) {
  const keys = Object.keys(o);

  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    if (!o[k] || typeof o[k] !== 'object') {
      // eslint-disable-next-line no-continue
      continue;
    }

    clearEmpties(o[k]);
    if (Object.keys(o[k]).length === 0) {
      delete o[k];
    }
  }
}

export function formatFrameNameToId(name: string) {
  const arr = name.split(':');
  if (arr.length > 2) {
    arr.pop();
    arr.pop();
    return arr.join(':');
  }
  return '';
}

export function fillUrlWithPathAndQueryParams(url:string,
  pathParams?:object,
  queryParams?:object) {
  let filledUrl = url;
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      filledUrl = url.replace(`{${key}}`, value);
    });
  }
  if (queryParams) {
    filledUrl += '?';
    Object.entries(queryParams).forEach(([key, value]) => {
      filledUrl += `${key}=${value}&`;
    });
    filledUrl = filledUrl.substring(0, filledUrl.length - 1);
  }
  return filledUrl;
}

export function removeSpaces(inputString:string) {
  return inputString.trim().replace(/[\s]/g, '');
}

export function formatVaultURL(vaultURL) {
  if (typeof vaultURL !== 'string') return vaultURL;
  return (vaultURL?.trim().slice(-1) === '/') ? vaultURL.slice(0, -1) : vaultURL.trim();
}

export function checkIfDuplicateExists(arr) {
  return new Set(arr).size !== arr.length;
}

export function replaceIframeNameWithValues(requestXml: string, elementValuesLookup) {
  const result = requestXml.replace(/<skyflow>([\s\S]*?)<\/skyflow>/gi, (match, key) => {
    const name = key.trim();
    return elementValuesLookup[name];
  });

  return result;
}

export function lowercaseKeys(obj: {
  [key: string]: any
}): any {
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key.toLowerCase()] = obj[key];
      return acc;
    }, {});
  }
  return {};
}

export const appendZeroToOne = (value) => {
  if (value.length === 1 && Number(value) === 1) {
    return `0${value}`;
  }
  return value;
};

export const getReturnValue = (value: string | Blob, element: string, doesReturnValue: boolean) => {
  if (typeof value === 'string') {
    value = value && value.replace(/\s/g, '');
    if (doesReturnValue) {
      return value;
    } if (element === ElementType.CARD_NUMBER
      && !doesReturnValue) {
      const cardType = detectCardType(value);
      const threshold = cardType !== CardType.DEFAULT && cardType === CardType.AMEX ? 6 : 8;
      if (value.length > threshold) {
        return value.replace(new RegExp(`.(?=.{0,${value?.length - threshold - 1}}$)`, 'g'), 'X');
      }
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
export const fileValidation = (value) => {
  if (value === undefined) return true;
  if (DANGEROUS_FILE_TYPE.includes(value.type) || value.size > 3200000) return false;
  return true;
};
