/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  CardType,
  COPY_UTILS, ElementType,
} from '../../core/constants';
import SkyflowError from '../../libs/skyflow-error';
import { ContainerType } from '../../skyflow';
import SKYFLOW_ERROR_CODE from '../constants';
import { detectCardType } from '../validators';

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
  return inputString.trim().replace(/[\s]/g, '');
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
