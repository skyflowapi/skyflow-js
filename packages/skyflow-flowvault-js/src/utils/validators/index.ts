/* eslint-disable max-len */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import * as coreValidators from '@core/validators';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import SkyflowError from '@core/errors';
import {
  IFlowDBRevealElementInput as IRevealElementInput,
  MessageType,
  CollectElementInput,
  LogLevel,
} from '../common';
import { printLog } from '../logs-helper';

// Re-export the variant-neutral validators now living in @core so the existing
// `../utils/validators` importers keep resolving the full set. Bound as local
// consts (not `export *`) so jest.spyOn(validators, ...) hooks still work —
// star/named re-exports compile to non-configurable getters that can't be spied.
export const validateCreditCardNumber = coreValidators.validateCreditCardNumber;
export const detectCardType = coreValidators.detectCardType;
export const validateExpiryYear = coreValidators.validateExpiryYear;
export const validateExpiryMonth = coreValidators.validateExpiryMonth;
export const isValidExpiryDateFormat = coreValidators.isValidExpiryDateFormat;
export const isValidExpiryYearFormat = coreValidators.isValidExpiryYearFormat;
export const isValidURL = coreValidators.isValidURL;
export const isValidRegExp = coreValidators.isValidRegExp;
export const validateCardNumberLengthCheck = coreValidators.validateCardNumberLengthCheck;
export const validateBooleanOptions = coreValidators.validateBooleanOptions;
export const validateExpiryDate = coreValidators.validateExpiryDate;
export const validateInsertRecords = coreValidators.validateInsertRecords;
export const validateUpdateRecord = coreValidators.validateUpdateRecord;
export const validateAdditionalFieldsInCollect = coreValidators.validateAdditionalFieldsInCollect;
export const validateDetokenizeInput = coreValidators.validateDetokenizeInput;
export const validateGetInput = coreValidators.validateGetInput;
export const validateGetByIdInput = coreValidators.validateGetByIdInput;
export const validateDeleteRecords = coreValidators.validateDeleteRecords;
export const validateInitConfig = coreValidators.validateInitConfig;
export const validateUpsertOptions = coreValidators.validateUpsertOptions;
export const validateComposableContainerOptions = coreValidators.validateComposableContainerOptions;
export const validateInputFormatOptions = coreValidators.validateInputFormatOptions;

// flowDB reveal-input validators. The flowDB reveal input is token-only
// (IFlowDBRevealElementInput) — no skyflowID/column/table/redaction-per-record or
// file-render keys — so these validate only the token-based surface.
export const validateRevealElementRecords = (records: IRevealElementInput[]) => {
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_REVEAL, []);
  records.forEach((record: any) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'token'))) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN_KEY_REVEAL, []);
    }
    if (!record.token) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TOKEN_ID_REVEAL, []);
    }
    if (!(typeof record.token === 'string' || record.token instanceof String)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_ID_REVEAL, []);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_LABEL_REVEAL, []);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALT_TEXT_REVEAL, []);
    }
  });
};

// flowDB-specific reveal-option error codes. These are not present in the shared
// @core SKYFLOW_ERROR_CODE map (they describe the flowDB tokenGroupRedactions
// option, which has no privacyDB counterpart), so they are defined locally here.
const FLOWDB_REVEAL_ERROR_CODE = {
  INVALID_TOKEN_GROUP_REDACTIONS_REVEAL: {
    code: 400,
    description: "Validation error. Invalid 'tokenGroupRedactions' key in reveal options. Specify an array of { tokenGroupName, redaction } objects.",
  },
  INVALID_TOKEN_GROUP_REDACTION_ENTRY_REVEAL: {
    code: 400,
    description: "Validation error. Invalid 'tokenGroupRedactions' entry at index %s1. Specify a non-empty string 'tokenGroupName' and 'redaction'.",
  },
};

export const validateRevealOptions = (options?: { tokenGroupRedactions?: any }) => {
  if (!options || options.tokenGroupRedactions === undefined) return;
  const { tokenGroupRedactions } = options;
  if (!Array.isArray(tokenGroupRedactions)) {
    throw new SkyflowError(FLOWDB_REVEAL_ERROR_CODE.INVALID_TOKEN_GROUP_REDACTIONS_REVEAL, []);
  }
  tokenGroupRedactions.forEach((entry: any, index: number) => {
    const hasValidName = entry && typeof entry.tokenGroupName === 'string' && entry.tokenGroupName !== '';
    const hasValidRedaction = entry && typeof entry.redaction === 'string' && entry.redaction !== '';
    if (!hasValidName || !hasValidRedaction) {
      throw new SkyflowError(
        FLOWDB_REVEAL_ERROR_CODE.INVALID_TOKEN_GROUP_REDACTION_ENTRY_REVEAL, [`${index}`], true,
      );
    }
  });
};

// Collect-input validator: emits a package-specific deprecation warning via the
// Tier-1 per-package logs-helper (printLog), so it stays local.
export const validateCollectElementInput = (input: CollectElementInput, logLevel: LogLevel) => {
  if (!Object.prototype.hasOwnProperty.call(input, 'type')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ELEMENT_TYPE, [], true);
  }
  if (!input.type) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_TYPE, [], true);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'altText')) {
    printLog(logs.warnLogs.COLLECT_ALT_TEXT_DEPERECATED, MessageType.WARN, logLevel);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'skyflowId') && !(typeof input.skyflowId === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_IN_COLLECT, [], true);
  }
};
