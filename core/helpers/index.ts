/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral frame/element leaf helpers, shared by each package's own frame
// controller (per the loose-coupling boundary — core holds neutral helpers only,
// each package owns its tokenize()/revealData()).
import { IValidationRule, ValidationRuleType } from '@core/types';
import SkyflowError from '@core/errors';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { ALLOWED_NAME_FOR_FILE, CardType, ElementType } from '@core/constants';
import { detectCardType } from '@core/validators';

const { getType } = require('mime');

// Minimal structural view of a form element needed for value-match detection —
// avoids importing the concrete IFrameFormElement class from a package.
export interface IMatchableFormElement {
  isMatchEqual(index: number, value: any, validation: IValidationRule): boolean;
  state: { value: any };
}

export const checkForElementMatchRule = (validations: IValidationRule[]) => {
  if (!validations) return false;
  for (let i = 0; i < validations.length; i += 1) {
    if (validations[i].type === ValidationRuleType.ELEMENT_VALUE_MATCH_RULE) {
      return true;
    }
  }
  return false;
};

export const checkForValueMatch = (
  validations: IValidationRule[],
  element: IMatchableFormElement,
) => {
  if (!validations) return false;
  for (let i = 0; i < validations.length; i += 1) {
    if (validations[i].type === ValidationRuleType.ELEMENT_VALUE_MATCH_RULE) {
      if (element && !element.isMatchEqual(i, element.state.value, validations[i])) {
        return true;
      }
    }
  }
  return false;
};

// Pure expiry-date helper. Lives here (not in the package's Tier-E utils/helpers,
// which carries build-time SDK identity) so the variant-neutral validateExpiryDate
// in @core/validators — and core's internal frame layer — can reach it.
export const appendZeroToOne = (value: string) => {
  if (value.length === 1 && Number(value) === 1) {
    return {
      isAppended: true,
      value: `0${value}`,
    };
  }
  return { isAppended: false, value };
};

// Variant-neutral frame/element leaf helpers shared by both packages' collect
// element + iframe form layers. Moved here (from each package's Tier-E
// utils/helpers) so the shared `@core/internal/iframe-form` can reach them
// without relative-importing a package sibling. Each package re-binds this set
// from its own utils/helpers.
export function formatFrameNameToId(name: string) {
  const arr = name?.split(':');
  if (arr && arr.length > 2) {
    const id = `${arr[0]}:${arr[1]}:${arr[2]}`;
    return id;
  }
  return '';
}

export function removeSpaces(inputString:string) {
  return inputString.trim().replace(/[\s-]/g, '');
}

export const getReturnValue = (value: string | Blob, element: string, doesReturnValue: boolean) => {
  if (typeof value === 'string') {
    if (element === ElementType.CARD_NUMBER) {
      value = value && value.replace(/[\s-]/g, '');
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

const DANGEROUS_FILE_TYPE = ['application/zip', 'application/vnd.debian.binary-package', 'application/vnd.microsoft.portable-executable', 'application/vnd.rar'];
// Check file type and file size in KB
export const fileValidation = (value, required: Boolean = false, fileElement) => {
  if (required && (value === undefined || value === '')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_FILE_SELECTED, [], true);
  }

  if (DANGEROUS_FILE_TYPE.includes(value.type)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true);
  }

  if (Object.prototype.hasOwnProperty.call(fileElement, 'allowedFileType') && (value !== undefined && value !== '')) {
    let isValidType = false;

    if (fileElement.allowedFileType !== null && fileElement.allowedFileType !== undefined) {
      fileElement.allowedFileType.forEach((type) => {
        const allowedType = getType(type);
        // eslint-disable-next-line max-len
        if (value.type.includes(allowedType) || value.type.includes(type) || value.type.includes(type.substring(1)) || value.type.includes(type)) {
          isValidType = true;
        }
      });
      if (!isValidType) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true);
      }
    }
  }
  const sizeLimit = (Object.prototype.hasOwnProperty.call(fileElement, 'maxFileSize') && typeof fileElement.maxFileSize === 'number')
    ? fileElement.maxFileSize
    : 32_000_000;
  if (value.size > sizeLimit) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_SIZE, [], true);
  }
  if (Object.prototype.hasOwnProperty.call(fileElement, 'blockEmptyFiles') && fileElement.blockEmptyFiles) {
    if (value.size === 0) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_SIZE, [], true);
    }
  }

  return true;
};

export const vaildateFileName = (name: string) => ALLOWED_NAME_FOR_FILE.test(name);
