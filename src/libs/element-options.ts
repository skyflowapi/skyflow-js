import {
  ALLOWED_EXPIRY_DATE_FORMATS,
  ALLOWED_EXPIRY_YEAR_FORMATS,
  DEFAULT_EXPIRATION_DATE_FORMAT,
  DEFAULT_EXPIRATION_YEAR_FORMAT,
  ELEMENTS,
  INPUT_STYLES,
} from '../core/constants';
import { CollectElementInput } from '../core/external/collect/CollectContainer';
import CollectElement from '../core/external/collect/CollectElement';
import {
  IValidationRule, MessageType, ValidationRuleType,
} from '../utils/common';
import SKYFLOW_ERROR_CODE from '../utils/constants';
import logs from '../utils/logs';
import { parameterizedString, printLog } from '../utils/logsHelper';
import { isValidExpiryDateFormat, isValidExpiryYearFormat, isValidRegExp } from '../utils/validators';
import SkyflowError from './SkyflowError';
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
        throw new Error(logs.errorLogs.CANNOT_CHANGE_ELEMENT);
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

export const formatValidations = (input: CollectElementInput) => {
  const validations = input.validations;
  if (validations && Array.isArray(validations) && validations.length > 0) {
    validations.forEach((validationRule: IValidationRule, index:number) => {
      if (validationRule && validationRule.type === ValidationRuleType.ELEMENT_VALUE_MATCH_RULE) {
        if (validationRule.params && !Object.prototype.hasOwnProperty.call(validationRule.params, 'element')) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ELEMENT_IN_ELEMENT_MATCH_RULE, [`${index}`], true);
        }
        if (validationRule.params
          && (validationRule.params.element == null
            || !(validationRule.params.element instanceof CollectElement))) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_IN_ELEMENT_MATCH_RULE, [`${index}`], true);
        }
        if (validationRule.params
          && validationRule.params.element
          && (validationRule.params.element instanceof CollectElement)) {
          // if (!validationRule.params.element.isMounted()) {
          //   throw new SkyflowError(
          //     SKYFLOW_ERROR_CODE.ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE, [`${index}`], true,
          //   );
          // }
          validationRule.params.element = validationRule.params.element.iframeName();
        }
      } else if (validationRule && validationRule.type === ValidationRuleType.REGEX_MATCH_RULE) {
        if (validationRule.params
          && validationRule.params.regex
          && !isValidRegExp(validationRule.params.regex)) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REGEX_IN_REGEX_MATCH_RULE, [`${index}`], true);
        }
        if (validationRule.params
          && validationRule.params.regex
          && isValidRegExp(validationRule.params.regex)) {
          validationRule.params.regex = validationRule.params.regex.toString();
        }
      }
    });
  }

  return validations;
};

export const formatOptions = (elementType, options, logLevel) => {
  let formattedOptions = {
    required: false,
    ...options,
  };
  if (elementType === ELEMENTS.CARD_NUMBER.name) {
    if (!Object.prototype.hasOwnProperty.call(formattedOptions, 'enableCardIcon')) {
      formattedOptions = { ...options, enableCardIcon: true };
    }
  } else if (elementType === ELEMENTS.EXPIRATION_DATE.name) {
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
  } else if (elementType === ELEMENTS.EXPIRATION_YEAR.name) {
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
  }

  return formattedOptions;
};
