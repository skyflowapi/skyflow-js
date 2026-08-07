/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral frame/element leaf helpers, shared by each package's own frame
// controller (per the loose-coupling boundary — core holds neutral helpers only,
// each package owns its tokenize()/revealData()).
import { IValidationRule, ValidationRuleType } from '@core/types';

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
