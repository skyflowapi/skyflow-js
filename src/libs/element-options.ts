/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  ALLOWED_EXPIRY_DATE_FORMATS,
  ALLOWED_EXPIRY_YEAR_FORMATS,
  CARDNUMBER_INPUT_FORMAT,
  CARD_NUMBER_HYPEN_SEPERATOR,
  DEFAULT_CARD_NUMBER_SEPERATOR,
  DEFAULT_EXPIRATION_DATE_FORMAT,
  DEFAULT_EXPIRATION_YEAR_FORMAT,
  DEFAULT_INPUT_FORMAT_TRANSLATION,
  ELEMENTS,
  INPUT_FORMATTING_NOT_SUPPORTED_ELEMENT_TYPES,
  INPUT_STYLES,
} from '../core/constants';
import CollectElement from '../core/external/collect/collect-element';
import ComposableElement from '../core/external/collect/compose-collect-element';
import {
  IValidationRule, MessageType, ValidationRuleType,
} from '../utils/common';
import SKYFLOW_ERROR_CODE from '../utils/constants';
import logs from '../utils/logs';
import { parameterizedString, printLog } from '../utils/logs-helper';
import {
  isValidExpiryDateFormat, isValidExpiryYearFormat, isValidRegExp, validateBooleanOptions,
  validateInputFormatOptions,
} from '../utils/validators';
import SkyflowError from './skyflow-error';
import { buildStylesFromClassesAndStyles } from './styles';

export function validateElementOptions(
  elementType: string,
  oldOptions: any,
  newOptions: any = {},
) {
  if (elementType !== 'group' && !Object.prototype.hasOwnProperty.call(ELEMENTS, elementType)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_TYPE, [], true);
  }

  if (Object.prototype.hasOwnProperty.call(oldOptions, 'validations')) {
    if (!Array.isArray(oldOptions.validations)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATIONS_TYPE, [], true);
    } else {
      oldOptions.validations.forEach((validationRule: IValidationRule, index) => {
        if (!Object.prototype.hasOwnProperty.call(validationRule, 'type')) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_TYPE, [`${index}`], true);
        }
        if (!Object.values(ValidationRuleType).includes(validationRule.type)) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_TYPE, [`${index}`], true);
        }
        if (!Object.prototype.hasOwnProperty.call(validationRule, 'params')) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_PARAMS, [`${index}`], true);
        }
        if (
          typeof validationRule.params !== 'object'
          || Array.isArray(validationRule.params)
          || validationRule.params === null) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_PARAMS, [`${index}`], true);
        }
        if (validationRule.type === ValidationRuleType.REGEX_MATCH_RULE) {
          if (!Object.prototype.hasOwnProperty.call(validationRule.params, 'regex')) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REGEX_IN_REGEX_MATCH_RULE, [`${index}`], true);
          }
        } else if (validationRule.type === ValidationRuleType.LENGTH_MATCH_RULE) {
          if (!Object.prototype.hasOwnProperty.call(validationRule.params, 'min')
          && !Object.prototype.hasOwnProperty.call(validationRule.params, 'max')) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE, [`${index}`], true);
          }
        }
      });
    }
  }

  if (Object.prototype.hasOwnProperty.call(newOptions, 'name') && newOptions.name !== oldOptions.name) {
    throw new Error("Name attribute can't be updated");
  }

  newOptions = { ...oldOptions, ...newOptions };

  if (newOptions.mask || newOptions.replacePattern) {
    const { type } = ELEMENTS[elementType].attributes;
    if (type !== 'text' || type !== 'textarea' || type !== 'email') {
      delete newOptions.mask;
      delete newOptions.replacePattern;
    }
  }

  if (!newOptions.mask === undefined && !Array.isArray(newOptions.mask)) {
    throw new Error('mask option has to be array or undefined');
  }

  // todo: replacer should be a char in mask[1]
  if (Array.isArray(newOptions.mask)) {
    const array = newOptions.mask;
    if (
      typeof array[0] !== 'string'
      // (array[1] ? typeof array[1] !== "string" : false) ||
      || (array[1] ? typeof array[1] !== 'object' : false)
    ) {
      throw new Error('mask array values has to be string');
    }
  }

  if (Array.isArray(newOptions.replacePattern)) {
    const array = newOptions.replacePattern;
    if (
      typeof array[0] !== 'string'
      // (array[1] ? typeof array[1] !== "string" : false) ||
      || (array[1] ? typeof array[1] !== 'string' : false)
    ) {
      throw new Error('replacePatterns array values has to be string');
    }
  }

  if (
    (elementType === ELEMENTS.radio.name
      || elementType === ELEMENTS.checkbox.name)
    && !newOptions.value
  ) {
    throw new Error('Elements radio and checkbox requires value attribute');
  }

  // todo: validate the objects in the newOptions array
  if (
    elementType === ELEMENTS.dropdown.name
    && !(
      newOptions.options
      && Array.isArray(newOptions.options)
      && newOptions.options.length !== 0
    )
  ) {
    throw new Error(
      'Element dropdown requires options attribute with an array of objects containing value and text attributes',
    );
  }
}

export function validateAndSetupGroupOptions(
  oldGroup: any,
  newGroup: any = {},
  setup = true,
) {
  newGroup = { ...oldGroup, ...newGroup };
  newGroup.rows.forEach((row, rowIndex) => {
    const newRow = row;
    const oldRow = oldGroup.rows[rowIndex];
    newGroup.rows[rowIndex] = { ...oldRow, ...newRow };
    newRow.elements.forEach((element, elementIndex) => {
      const oldElement = oldRow.elements[elementIndex];
      const newElement = element;
      if (
        newElement.elementType
        && oldElement.elementType !== newElement.elementType
        && oldElement.elementName
        && oldElement.elementName !== newElement.elementName
      ) {
        throw new Error(parameterizedString(
          logs.errorLogs.CANNOT_CHANGE_ELEMENT,
        ));
      }
      validateElementOptions(oldElement.elementType, oldElement, newElement);
      newRow.elements[elementIndex] = {
        ...oldElement,
        ...newElement,
        elementName: oldElement.elementName,
      };

      const classes = newElement.classes || {};
      const styles = newElement.styles || {};
      styles.base = { ...INPUT_STYLES, ...styles.base };
      // setup && buildStylesFromClassesAndStyles(classes, styles);

      newElement.classes = classes;
      newElement.styles = styles;

      const labelClasses = newElement?.labelStyles?.classes || {};
      const labelStyles = newElement?.labelStyles?.styles || {};

      if (setup) {
        buildStylesFromClassesAndStyles(labelClasses, labelStyles);
      }

      newElement.labelStyles = { labelClasses };
      newElement.labelStyles.styles = labelStyles;
    });
  });
  return newGroup;
}

export const getElements = (group: any) => {
  const { rows } = group;
  const elements: string[] = [];
  rows.forEach((row) => {
    row.elements.forEach((element) => {
      elements.push(element);
    });
  });

  return elements;
};

export const getValueAndItsUnit = (
  string = '',
  defaultValue: string = '0',
  defaultUnit: string = 'px',
) => {
  const index = string.search(/[^0-9]/gi);
  if (index === 0) {
    return [defaultValue, defaultUnit];
  }
  if (index === -1) {
    if (string.length === 0) {
      return [defaultValue, defaultUnit];
    }
    return [string, defaultUnit];
  }
  return [string.slice(0, index), string.slice(index)];
};

export const formatValidations = (validations?: IValidationRule[]):
IValidationRule[] | undefined => {
  if (!validations || !Array.isArray(validations) || validations.length === 0) {
    return validations;
  }

  return validations.map((validationRule: IValidationRule, index: number) => {
    if (!validationRule) return validationRule;

    switch (validationRule.type) {
      case ValidationRuleType.ELEMENT_VALUE_MATCH_RULE: {
        const { params } = validationRule;
        if (!params || !Object.prototype.hasOwnProperty.call(params, 'element')) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ELEMENT_IN_ELEMENT_MATCH_RULE, [`${index}`], true);
        }

        const { element } = params;
        if (!element || !(element instanceof CollectElement || ComposableElement)) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_IN_ELEMENT_MATCH_RULE, [`${index}`], true);
        }

        return {
          ...validationRule,
          params: {
            ...params,
            elementID: element.getID(),
            element: element.iframeName(),
          },
        };
      }

      case ValidationRuleType.REGEX_MATCH_RULE: {
        const { params } = validationRule;
        const { regex } = params || {};

        if (regex && !isValidRegExp(regex)) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REGEX_IN_REGEX_MATCH_RULE, [`${index}`], true);
        }

        if (regex && isValidRegExp(regex)) {
          return {
            ...validationRule,
            params: {
              ...params,
              regex: regex.toString(),
            },
          };
        }
        break;
      }

      default:
        return validationRule;
    }

    return validationRule;
  });
};

export const formatOptions = (elementType, options, logLevel) => {
  let formattedOptions = {
    required: false,
    ...options,
  };

  if (Object.prototype.hasOwnProperty.call(formattedOptions, 'format')
  || Object.prototype.hasOwnProperty.call(formattedOptions, 'translation')) {
    if (INPUT_FORMATTING_NOT_SUPPORTED_ELEMENT_TYPES.includes(elementType)) {
      printLog(
        parameterizedString(logs.warnLogs.INPUT_FORMATTING_NOT_SUPPROTED, elementType),
        MessageType.WARN, logLevel,
      );
      delete formattedOptions?.format;
      delete formattedOptions?.translation;
    } else if (elementType === ELEMENTS.INPUT_FIELD.name) {
      validateInputFormatOptions(options);
      formattedOptions = {
        ...formattedOptions,
        mask: [
          formattedOptions.format,
          (formattedOptions.translation
            ? formattedOptions.translation
            : DEFAULT_INPUT_FORMAT_TRANSLATION),
        ],
      };
      delete formattedOptions?.format;
      delete formattedOptions?.translation;
    }
  }
  switch (elementType) {
    case ELEMENTS.CARD_NUMBER.name: {
      if (!Object.prototype.hasOwnProperty.call(formattedOptions, 'enableCardIcon')) {
        formattedOptions = { ...formattedOptions, enableCardIcon: true };
      }
      let cardSeperator = DEFAULT_CARD_NUMBER_SEPERATOR;

      if (formattedOptions?.format === CARDNUMBER_INPUT_FORMAT.DASH_FORMAT) {
        cardSeperator = CARD_NUMBER_HYPEN_SEPERATOR;
      }
      formattedOptions = { ...formattedOptions, cardSeperator };
      delete formattedOptions?.format;
      delete formattedOptions?.translation;

      if (Object.prototype.hasOwnProperty.call(formattedOptions, 'cardMetadata')) {
        if (!(typeof formattedOptions.cardMetadata === 'object')
          || (Object.prototype.toString.call(formattedOptions.cardMetadata) !== '[object Object]')
        ) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_OPTION_CARD_METADATA, [], true);
        }

        if (Object.prototype.hasOwnProperty.call(formattedOptions.cardMetadata, 'scheme')) {
          if (!(typeof formattedOptions.cardMetadata.scheme === 'object')
              || (Object.prototype.toString.call(formattedOptions.cardMetadata.scheme) !== '[object Array]')) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_OPTION_CARD_SCHEME, [], true);
          }
        }
      }

      break;
    }
    case ELEMENTS.EXPIRATION_DATE.name: {
      let isvalidFormat = false;
      if (formattedOptions.format) {
        isvalidFormat = isValidExpiryDateFormat(formattedOptions.format.toUpperCase());
        if (!isvalidFormat) {
          printLog(parameterizedString(logs.warnLogs.INVALID_EXPIRATION_DATE_FORMAT,
            ALLOWED_EXPIRY_DATE_FORMATS.toString()), MessageType.WARN, logLevel);
        }
      }
      formattedOptions = {
        ...formattedOptions,
        format: isvalidFormat ? formattedOptions.format.toUpperCase()
          : DEFAULT_EXPIRATION_DATE_FORMAT,
      };
      delete formattedOptions?.translation;
      break;
    }
    case ELEMENTS.EXPIRATION_YEAR.name: {
      let isvalidFormat = false;
      if (formattedOptions.format) {
        isvalidFormat = isValidExpiryYearFormat(formattedOptions.format.toUpperCase());
        if (!isvalidFormat) {
          printLog(parameterizedString(logs.warnLogs.INVALID_EXPIRATION_YEAR_FORMAT,
            ALLOWED_EXPIRY_YEAR_FORMATS.toString()), MessageType.WARN, logLevel);
        }
      }
      formattedOptions = {
        ...formattedOptions,
        format: isvalidFormat ? formattedOptions.format.toUpperCase()
          : DEFAULT_EXPIRATION_YEAR_FORMAT,
      };
      delete formattedOptions?.translation;
      break;
    }

    case ELEMENTS.FILE_INPUT.name: {
      if (!Object.prototype.hasOwnProperty.call(formattedOptions, 'preserveFileName')) {
        formattedOptions = { ...formattedOptions, preserveFileName: true };
      }
      break;
    }

    default: break;
  }

  if (Object.prototype.hasOwnProperty.call(formattedOptions, 'enableCardIcon') && !validateBooleanOptions(formattedOptions.enableCardIcon)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['enableCardIcon'], true);
  }
  if (Object.prototype.hasOwnProperty.call(formattedOptions, 'enableCopy') && !validateBooleanOptions(formattedOptions.enableCopy)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['enableCopy'], true);
  }
  if (Object.prototype.hasOwnProperty.call(formattedOptions, 'required') && !validateBooleanOptions(formattedOptions.required)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['required'], true);
  }
  if (Object.prototype.hasOwnProperty.call(formattedOptions, 'preserveFileName') && !validateBooleanOptions(formattedOptions.preserveFileName)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['preserveFileName'], true);
  }
  if (elementType === ELEMENTS.FILE_INPUT.name) {
    if (options.allowedFileType) {
      if (!Array.isArray(options.allowedFileType)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALLOWED_OPTIONS, [], true);
      }
      if (options.allowedFileType.length <= 0) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ALLOWED_OPTIONS_ARRAY, [], true);
      }
      if (!options.allowedFileType.every((item) => typeof item === 'string')) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALLOWED_FILETYPE_ARRAY, [], true);
      }
    }
    if (Object.prototype.hasOwnProperty.call(options, 'allowedFileType')) {
      formattedOptions = { ...formattedOptions, allowedFileType: options.allowedFileType };
    }
  }

  if (Object.prototype.hasOwnProperty.call(options, 'masking')) {
    if (!validateBooleanOptions(options.masking)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['masking'], true);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'maskingChar') && typeof options.maskingChar === 'string' && options.maskingChar.length > 1) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_MASKING_CHARACTER, [], true);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'maskingChar') && typeof options.maskingChar === 'string') {
      formattedOptions = {
        ...formattedOptions,
        masking: options.masking,
        maskingChar: options.maskingChar,
      };
    } else {
      formattedOptions = { ...formattedOptions, masking: options.masking, maskingChar: '*' };
    }
  }

  return formattedOptions;
};
