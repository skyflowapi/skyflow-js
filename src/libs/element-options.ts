import { ELEMENTS } from "../elements/constants";

export function validateElementOptions(
  elementType: string,
  oldOptions: any,
  newOptions: any = {}
) {
  if (!ELEMENTS.hasOwnProperty(elementType)) {
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
