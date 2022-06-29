/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  CardType,
  ContentType, COPY_UTILS, ElementType, FORMAT_REGEX, FRAME_REVEAL, REPLACE_TEXT,
} from '../../core/constants';
import SkyflowElement from '../../core/external/common/SkyflowElement';
import SkyflowError from '../../libs/SkyflowError';
import { IConnectionConfig } from '../common';
import { detectCardType } from '../validators';

const qs = require('qs');

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

export function replaceIdInXml(xml: string, elementLookup: any, errors: any) {
  const elementids : any = [];
  const result = xml.replace(/<skyflow>([\s\S]*?)<\/skyflow>/gi, (match, key) => {
    const id = key.trim();
    elementids.push(id);
    const element: SkyflowElement = elementLookup[id];
    return `<skyflow>${element?.iframeName()}</skyflow>`;
  });
  if (errors.length > 2 && checkIfDuplicateExists(elementids)) {
    throw new SkyflowError(errors[2], [], true);
  }
  for (let i = 0; i < elementids.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(elementLookup, elementids[i])) {
      throw new SkyflowError(errors[0], [`${elementids[i]}`], true);
    }
    if (!elementLookup[elementids[i]].isMounted()) {
      throw new SkyflowError(errors[1], [`${elementids[i]}`], true);
    }
  }
  return result;
}

export function replaceIdInResponseXml(xml: string, elementLookup: any, errors: any) {
  const elementids : any = [];
  const result = xml.replace(/<skyflow>([\s\S]*?)<\/skyflow>/gi, (match, key) => {
    const id = key.trim();
    elementids.push(id);
    const element: SkyflowElement = elementLookup[id];
    let tempName = element?.iframeName();
    if (tempName?.startsWith(`${FRAME_REVEAL}:`)) {
      // @ts-ignore
      const recordData = element?.getRecordData();
      const regex = recordData?.formatRegex;
      const replaceText = recordData?.replaceText;
      if (regex && replaceText) {
        tempName = tempName + FORMAT_REGEX + regex + REPLACE_TEXT + replaceText;
      } else if (regex) {
        tempName = tempName + FORMAT_REGEX + regex;
      }
    }

    return `<skyflow>${tempName}</skyflow>`;
  });
  if (errors.length > 2 && checkIfDuplicateExists(elementids)) {
    throw new SkyflowError(errors[2], [], true);
  }
  for (let i = 0; i < elementids.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(elementLookup, elementids[i])) {
      throw new SkyflowError(errors[0], [`${elementids[i]}`], true);
    }
    if (!elementLookup[elementids[i]].isMounted()) {
      throw new SkyflowError(errors[1], [`${elementids[i]}`], true);
    }
  }
  return result;
}

export function getIframeNamesInSoapRequest(requestXml: string) {
  const elementNames = requestXml.match(/<skyflow>([\s\S]*?)<\/skyflow>/gi);
  return elementNames?.map((element) => element.replace('<skyflow>', '').replace('</skyflow>', ''));
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

function objectToFormData(obj: any, form?: FormData, namespace?: string) {
  const fd = form || new FormData();
  let formKey: string;

  Object.keys(obj).forEach((property) => {
    if (Object.prototype.hasOwnProperty.call(obj, property)) {
      if (namespace) {
        formKey = `${namespace}[${property}]`;
      } else {
        formKey = property;
      }

      if (typeof obj[property] === 'object') {
        objectToFormData(obj[property], fd, property);
      } else {
        fd.append(formKey, obj[property]);
      }
    }
  });

  return fd;
}

export function updateRequestBodyInConnection(config: IConnectionConfig) {
  let tempConfig = { ...config };
  if (config && config.requestHeader && config.requestBody) {
    const headerKeys = lowercaseKeys(config.requestHeader);
    if (headerKeys['content-type'] && headerKeys['content-type'].includes(ContentType.FORMURLENCODED)) {
      tempConfig = {
        ...tempConfig,
        requestBody: qs.stringify(config.requestBody),
      };
    } else if (headerKeys['content-type'] && headerKeys['content-type'].includes(ContentType.FORMDATA)) {
      const body = objectToFormData(config.requestBody);
      tempConfig = {
        ...tempConfig,
        requestBody: body,
      };
    }
  }
  return tempConfig;
}

export const appendZeroToOne = (value) => {
  if (value.length === 1 && Number(value) === 1) {
    return `0${value}`;
  }
  return value;
};

export const getReturnValue = (value: string, element: string, doesReturnValue: boolean) => {
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
