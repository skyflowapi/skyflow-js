import { ELEMENTS, INPUT_STYLES } from "../elements/constants";
import { buildStylesFromClassesAndStyles } from "./styles";

export function validateAndSetupGroupOptions(
  oldGroup: any,
  newGroup: any = {}
) {
  const isNewEmpty = Object.keys(newGroup).length === 0;
  newGroup = { ...oldGroup, ...newGroup };
  newGroup.rows.forEach((row, rowIndex) => {
    const newRow = row;
    const oldRow = oldGroup.rows[rowIndex];
    newGroup.rows[rowIndex] = { ...oldRow, ...newRow };
    newRow.elements.forEach((element, elementIndex) => {
      const oldElement = oldRow.elements[elementIndex];
      const newElement = element;
      if (
        oldElement.elementType !== newElement.elementType ||
        oldElement.elementName !== newElement.elementName
      ) {
        throw new Error("Element can't be changed");
      }
      validateElementOptions(newElement.elementType, oldElement, newElement);
      newRow.elements[elementIndex] = {
        ...oldElement,
        newElement,
        elementName: oldElement.elementName,
      };

      if (
        !isNewEmpty &&
        (oldElement.styles === newElement.styles ||
          oldElement.classes === newElement.classes)
      ) {
        delete newElement.styles; // updating styles don't required if there is no change
      } else {
        const classes = newElement.classes || {};
        const styles = newElement.styles || {};
        styles.base = { ...INPUT_STYLES, ...styles.base };
        buildStylesFromClassesAndStyles(classes, styles);

        newElement.classes = classes;
        newElement.styles = styles;
      }

      if (
        !isNewEmpty &&
        (oldElement.labelStyles.styles === newElement.labelStyles.styles ||
          oldElement.labelStyles.classes === newElement.labelStyles.classes)
      ) {
        delete newElement.styles; // updating styles don't required if there is no change
      } else {
        const classes = newElement?.labelStyles?.classes || {};
        const styles = newElement?.labelStyles?.styles || {};

        buildStylesFromClassesAndStyles(classes, styles);

        newElement.labelStyles = { classes };
        newElement.labelStyles.styles = styles;
      }
    });
  });
  return newGroup;
}

export function validateElementOptions(
  elementType: string,
  oldOptions: any,
  newOptions: any = {}
) {
  if (!ELEMENTS.hasOwnProperty(elementType) || elementType === "group") {
    throw new Error("Provide valid element type");
  }

  if (!oldOptions.name) {
    throw new Error("Provide a valid element name");
  }

  if (newOptions.hasOwnProperty("name") && newOptions.name !== oldOptions.name)
    throw new Error("Name attribute can't be updated");

  if (
    oldOptions.sensitive === true &&
    newOptions.hasOwnProperty("sensitive") &&
    newOptions.sensitive !== oldOptions.sensitive
  )
    throw new Error("Sensitive attribute can't be updated");

  newOptions = { ...oldOptions, ...newOptions };

  if (newOptions.mask || newOptions.replacePattern) {
    const type = ELEMENTS[elementType].attributes.type;
    if (type !== "text" || type !== "textarea" || type !== "email") {
      delete newOptions.mask;
      delete newOptions.replacePattern;
    }
  }

  if (!newOptions.mask === undefined && !Array.isArray(newOptions.mask)) {
    throw new Error("mask option has to be array or undefined");
  }

  // todo: replacer should be a char in mask[1]
  if (Array.isArray(newOptions.mask)) {
    const array = newOptions.mask;
    if (
      typeof array[0] !== "string" ||
      // (array[1] ? typeof array[1] !== "string" : false) ||
      (array[1] ? typeof array[1] !== "object" : false)
    ) {
      throw new Error("mask array values has to be string");
    }
  }

  if (Array.isArray(newOptions.replacePattern)) {
    const array = newOptions.replacePattern;
    if (
      typeof array[0] !== "string" ||
      // (array[1] ? typeof array[1] !== "string" : false) ||
      (array[1] ? typeof array[1] !== "string" : false)
    ) {
      throw new Error("replacePatterns array values has to be string");
    }
  }

  if (
    (elementType === ELEMENTS.radio.name ||
      elementType === ELEMENTS.checkbox.name) &&
    !newOptions.value
  ) {
    throw new Error("Elements radio and checkbox requires value attribute");
  }

  // todo: validate the objects in the newOptions array
  if (
    elementType === ELEMENTS.dropdown.name &&
    !(
      newOptions.options &&
      Array.isArray(newOptions.options) &&
      newOptions.options.length !== 0
    )
  ) {
    throw new Error(
      "Element dropdown requires options attribute with an array of objects containing value and text attributes"
    );
  }

  if (
    newOptions.hasOwnProperty("validation") &&
    !Array.isArray(newOptions.validation)
  ) {
    throw new Error("Validation has to be an array");
  } else if (newOptions.hasOwnProperty("validation")) {
    newOptions.validation.forEach((value: any) => {
      // todo: need to support regex
      if (typeof value !== "string") {
        throw new Error("only strings are allowed in validation array");
      }
    });
  }
}

export const getElements = (rows: any[]) => {
  const elements: string[] = [];
  rows.forEach((row) => {
    row.elements.forEach((element) => {
      elements.push(element);
    });
  });

  return elements;
};

export const getValueAndItsUnit = (
  string = "",
  defaultValue: string = "0",
  defaultUnit: string = "px"
) => {
  const index = string.search(/[^0-9]/gi);
  if (index === 0) {
    return [defaultValue, defaultUnit];
  }
  if (index === -1) {
    if (string.length === 0) {
      return [defaultValue, defaultUnit];
    } else {
      return [string, defaultUnit];
    }
  }
  return [string.slice(0, index), string.slice(index)];
};
