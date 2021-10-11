import { ELEMENTS, INPUT_STYLES } from '../container/constants';
import SKYFLOW_ERROR_CODE from '../utils/constants';
import logs from '../utils/logs';
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

  // if (!oldOptions.table) {
  //   throw new Error("Provide a valid table name");
  // }

  // if (!oldOptions.column) {
  //   throw new Error("Provide a valid element name");
  // }

  if (Object.prototype.hasOwnProperty.call(newOptions, 'name') && newOptions.name !== oldOptions.name) {
    throw new Error("Name attribute can't be updated");
  }

  if (
    oldOptions.sensitive === true
    && Object.prototype.hasOwnProperty.call(newOptions, 'sensitive')
    && newOptions.sensitive !== oldOptions.sensitive
  ) throw new Error("Sensitive attribute can't be updated");

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
