/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral frame/element leaf helpers, shared by each package's own frame
// controller (per the loose-coupling boundary — core holds neutral helpers only,
// each package owns its tokenize()/revealData()).
import {
  ContainerType, IValidationRule, ValidationRuleType, IRevealElementOptions,
} from '@core/types';
import SkyflowError from '@core/errors';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import {
  ALLOWED_NAME_FOR_FILE, CardType, ElementType, COPY_UTILS,
  DEFAULT_INPUT_FORMAT_TRANSLATION,
} from '@core/constants';
import { detectCardType, validateBooleanOptions } from '@core/validators';

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

// Trim a trailing slash off the configured vault URL (Skyflow.init URL
// normalization). Variant-neutral — moved here from each package's Tier-E
// utils/helpers so both SDKs share one definition; each re-binds it locally.
export function formatVaultURL(vaultURL?: string) {
  if (typeof vaultURL !== 'string') return vaultURL;
  return (vaultURL?.trim().slice(-1) === '/') ? vaultURL.slice(0, -1) : vaultURL.trim();
}

// Resolve a frame name to the container kind it belongs to. Variant-neutral —
// keyed off the frame-name prefix conventions shared by both packages.
export const getContainerType = (frameName:string):ContainerType => {
  const frameNameParts = frameName.split(':');
  if (frameNameParts[0] === 'reveal-composable') {
    return ContainerType.COMPOSE_REVEAL;
  }
  return (frameNameParts[1] === 'group')
    ? ContainerType.COMPOSABLE
    : ContainerType.COLLECT;
};

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

// Variant-neutral element DOM / masking helpers shared by both packages' collect
// element + internal frame layers. Moved here (from each package's Tier-E
// utils/helpers) so the shared `@core/internal` FrameElement barrel can reach
// them without relative-importing a package sibling. Each package re-binds this
// set from its own utils/helpers.
export const appendMonthFourDigitYears = (value: string) => {
  if (value.length === 6 && Number(value.charAt(5)) === 1) {
    return { isAppended: true, value: `${value.substring(0, 5)}0${value.charAt(5)}` };
  }
  return { isAppended: false, value };
};

export const appendMonthTwoDigitYears = (value: string) => {
  const lastChar = (value.length > 0 && value.charAt(value.length - 1)) || '';
  if (value.length === 4 && Number(lastChar) === 1) {
    return { isAppended: true, value: `${value.substring(0, 3)}0${lastChar}` };
  }
  return { isAppended: false, value };
};

const fns : Function[] = [];
export function domReady(fn) {
  (() => {
    let listener;
    const doc = typeof document === 'object' ? document : undefined;
    const domContentLoaded = 'DOMContentLoaded';
    let loaded = doc && (/^loaded|^i|^c/).test(doc.readyState);
    if (!loaded && doc) {
      doc.addEventListener(domContentLoaded, listener = () => {
        doc.removeEventListener(domContentLoaded, listener);
        loaded = true;
        listener = fns.shift();
        while (listener) {
          listener();
          listener = fns.shift();
        }
      });
    }
    return (fun): void => {
      if (loaded) {
        setTimeout(fun, 0);
      } else {
        fns.push(fun);
      }
    };
  })()(fn);
}
export const getMaskedOutput = (
  input: string,
  format: string,
  translation: any,
  maskingChar: string = '',
) => {
  if (!input) {
    return { formattedOutput: '', maskedOutput: '' };
  }
  const inputArray = Array.from(input);
  const formatArray = Array.from(format);
  let formattedOutput = '';
  let maskedOutput = '';
  let j = 0;

  for (let i = 0; i < inputArray.length; i += 1) {
    if (j < i) { j = i; }
    const character = inputArray[i];
    if (j < formatArray.length) {
      let formatChar = formatArray[j];
      if (!translation[formatChar] || character === formatChar) {
        formattedOutput += formatChar;
        maskedOutput += formatChar;
        j += 1;
      }
      formatChar = formatArray[j];
      if (translation[formatChar]) {
        const translationPattern = translation[formatChar].pattern;
        const regex = new RegExp(translationPattern);
        const characterString = character.toString();
        if (regex.test(characterString)) {
          formattedOutput += characterString;
          // Append the maskingChar or the original character if no maskingChar provided
          // eslint-disable-next-line no-unneeded-ternary
          maskedOutput += maskingChar ? maskingChar : '*';
          j += 1;
        }
      }
    } else {
      break;
    }
  }

  return {
    formattedOutput,
    maskedOutput,
  };
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

export const styleToString = (style) => Object.keys(style).reduce((acc, key) => (
  `${acc + key.split(/(?=[A-Z])/).join('-').toLowerCase()}:${style[key]};`
), '');

export const addSeperatorToCardNumberMask = (
  cardNumberMask: any,
  seperator?: string,
) => {
  if (seperator) {
    return [cardNumberMask[0].replace(/[\s]/g, seperator), cardNumberMask[1]];
  }
  return cardNumberMask;
};

// Variant-neutral frame-name / token / reveal-option helpers. Moved here (from
// each package's utils/helpers) so the shared @core reveal-frame base can reach
// them under the core ⇏ packages boundary. Each package re-binds them locally as
// `const x = coreHelpers.x` so existing importers and jest.spyOn(helpers, …) are
// unchanged.
export const getValueFromName = (name: string, index: number) => {
  const names = name.split(':');
  const value = names.length > index ? names[index] : '';
  return value;
};

export const getAtobValue = (encodedValue: string) => {
  try {
    const decodedValue = atob(encodedValue);
    return decodedValue;
  } catch (err) {
    return '';
  }
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
        ...((revealElementMask.length === 3) ? { mask: revealElementMask } : {}),
      };
      delete revealOptions?.format;
      delete revealOptions?.translation;
    }
  }
  return revealOptions;
};
