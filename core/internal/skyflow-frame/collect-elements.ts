/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Variant-neutral element-collection logic shared by both packages'
// skyflow-frame controllers' `tokenize()`. Walks the mounted collect element
// iframes twice: (1) validation (required/valid + element-match rules) and
// (2) building the per-table insert object and the per-skyflowID update object.
// Runs inside the skyflow iframe bundle, so it depends only on @core leaves.
//
// Divergence is parameterised, not branched in the caller:
//   - `collectCVV` (flowDB only) additionally records CVV values into `cvvMap`
//     so the flowDB collect path can re-map ephemeral CVV tokens in the response.
//     privacyDB passes `false`, leaving that path (and its extra
//     getUnformattedValue() reads) completely inert — byte-identical behaviour.
//
// The identity keys read off the element (`tableName`/`skyflowID`) are the
// internal pipeline names both packages normalise to before this point (flowDB
// remaps its client-facing `tableName`/`skyflowId` upstream in create/update).
import get from 'lodash/get';
import { ELEMENTS } from '@core/constants';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';
import { checkForElementMatchRule, checkForValueMatch } from '@core/helpers';
import { ElementInfo, ICollectOptionsBase, LogLevel } from '@core/types';

const set = require('set-value');

// Shared base for each package's `TokenizeDataInput`. Both extend their own
// `ICollectOptions` (⟶ ICollectOptionsBase) plus these transport fields.
export interface ITokenizeDataInputBase extends ICollectOptionsBase {
  type: string;
  elementIds: ElementInfo[];
  containerId: string;
}

// CVV values captured per insert-table / per-update-skyflowID (flowDB only).
export interface ICVVMap {
  insert: Record<string, any>;
  update: Record<string, any>;
}

// Result of the two element-collection loops.
export interface ICollectedElementsData {
  insertResponseObject: Record<string, any>;
  updateResponseObject: Record<string, any>;
  cvvMap: ICVVMap;
}

export interface CollectElementsParams {
  elementIds: ElementInfo[];
  containerId: string;
  logLevel: LogLevel;
  clientDomain: string;
  // flowDB: capture CVV values into `cvvMap`. privacyDB: false (inert).
  collectCVV: boolean;
}

// Resolve the mounted iframe input element for a given element descriptor.
// `window.parent.frames[<string>]` degrades to `any` under noImplicitAny:false,
// exactly as in the original controllers.
const getInputElement = (
  element: ElementInfo,
  containerId: string,
  logLevel: LogLevel,
  clientDomain: string,
) => {
  const Frame = window.parent.frames[`${element.frameId}:${containerId}:${logLevel}:${btoa(clientDomain)}`];
  return Frame.document.getElementById(element.elementId);
};

// Walks the collect elements and returns the insert/update request objects
// (+ cvvMap when `collectCVV`). Throws `SkyflowError` on validation failure
// (incomplete/invalid inputs, duplicate columns, empty skyflowID); the caller's
// `tokenize` catches and rejects.
export const collectElementsData = (
  params: CollectElementsParams,
): ICollectedElementsData => {
  const {
    elementIds, containerId: id, logLevel, clientDomain, collectCVV,
  } = params;
  const insertResponseObject: any = {};
  const updateResponseObject: any = {};
  const cvvMap: ICVVMap = { insert: {}, update: {} };
  let errorMessage = '';

  // Loop 1 — validation: force blur on required/invalid, apply element-match
  // rules, and accumulate an error string for any incomplete/invalid input.
  for (let i = 0; i < elementIds.length; i += 1) {
    const inputElement = getInputElement(elementIds[i], id, logLevel, clientDomain);
    if (inputElement) {
      if (
        inputElement.iFrameFormElement.fieldType !== ELEMENTS.FILE_INPUT.name
        && inputElement.iFrameFormElement.fieldType !== ELEMENTS.MULTI_FILE_INPUT.name
      ) {
        const {
          state, doesClientHasError, clientErrorText, errorText, onFocusChange, validations,
          setValue,
        } = inputElement.iFrameFormElement;
        if (state.isRequired || !state.isValid) {
          onFocusChange(false);
        }
        if (validations
          && checkForElementMatchRule(validations)
          && checkForValueMatch(validations, inputElement.iFrameFormElement)) {
          setValue(state.value);
          onFocusChange(false);
        }
        if (!state.isValid || !state.isComplete) {
          if (doesClientHasError) {
            errorMessage += `${state.name}:${clientErrorText}`;
          } else { errorMessage += `${state.name}:${errorText} `; }
        }
      }
    }
  }

  if (errorMessage.length > 0) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPLETE_AND_VALID_INPUTS, [`${errorMessage}`], true);
  }

  // Loop 2 — build the insert object (keyed by table) and the update object
  // (keyed by skyflowID). CVV values are additionally captured when collectCVV.
  for (let i = 0; i < elementIds.length; i += 1) {
    const inputElement = getInputElement(elementIds[i], id, logLevel, clientDomain);
    if (inputElement) {
      const {
        state, tableName, validations, skyflowID,
      } = inputElement.iFrameFormElement;
      if (tableName) {
        if (
          inputElement.iFrameFormElement.fieldType !== ELEMENTS.FILE_INPUT.name
          && inputElement.iFrameFormElement.fieldType !== ELEMENTS.MULTI_FILE_INPUT.name
        ) {
          const isCVV = inputElement.iFrameFormElement.fieldType === ELEMENTS.CVV.name;
          if (
            inputElement.iFrameFormElement.fieldType === ELEMENTS.checkbox.name
          ) {
            if (insertResponseObject[state.name]) {
              insertResponseObject[state.name] = `${insertResponseObject[state.name]},${state.value
              }`;
            } else {
              insertResponseObject[state.name] = state.value;
            }
          } else if (insertResponseObject[tableName] && !(skyflowID === '') && skyflowID === undefined) {
            if (get(insertResponseObject[tableName], state.name)
              && !(validations && checkForElementMatchRule(validations))) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT,
                [state.name, tableName], true);
            }
            set(
              insertResponseObject[tableName],
              state.name,
              inputElement.iFrameFormElement.getUnformattedValue(),
            );
            if (collectCVV && isCVV) {
              cvvMap.insert[tableName] = {
                ...(cvvMap.insert[tableName] || {}),
                [state.name]: inputElement.iFrameFormElement.getUnformattedValue(),
              };
            }
          } else if (skyflowID || skyflowID === '') {
            if (skyflowID === '' || skyflowID === null) {
              throw new SkyflowError(
                SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS,
              );
            }
            if (updateResponseObject[skyflowID]) {
              set(
                updateResponseObject[skyflowID],
                state.name,
                inputElement.iFrameFormElement.getUnformattedValue(),
              );
            } else {
              updateResponseObject[skyflowID] = {};
              set(
                updateResponseObject[skyflowID],
                state.name,
                inputElement.iFrameFormElement.getUnformattedValue(),
              );
              set(
                updateResponseObject[skyflowID],
                'table',
                tableName,
              );
            }
            if (collectCVV && isCVV) {
              cvvMap.update[skyflowID] = {
                ...(cvvMap.update[skyflowID] || {}),
                [state.name]: inputElement.iFrameFormElement.getUnformattedValue(),
              };
            }
          } else {
            insertResponseObject[tableName] = {};
            set(
              insertResponseObject[tableName],
              state.name,
              inputElement.iFrameFormElement.getUnformattedValue(),
            );
            if (collectCVV && isCVV) {
              cvvMap.insert[tableName] = {
                ...(cvvMap.insert[tableName] || {}),
                [state.name]: inputElement.iFrameFormElement.getUnformattedValue(),
              };
            }
          }
        }
      }
    }
  }

  return { insertResponseObject, updateResponseObject, cvvMap };
};
