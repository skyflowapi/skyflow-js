/* eslint-disable max-len */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import * as coreValidators from '@core/validators';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import SkyflowError from '@core/errors';
import { FileElementType } from '@core/constants';
import {
  IFlowDBRevealElementInput as IRevealElementInput,
  MessageType,
  CollectElementInput,
  CollectElementOptions,
  LogLevel,
  UpdateType,
  IFlowDBUpsertOptions,
  AdditionalFields,
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

// flowDB collect-element input error codes. These describe flowDB-only create()
// constraints (no file elements; `tableName` is the documented identity key, not
// `table`) that have no privacyDB counterpart, so they are defined locally here
// — mirroring the FLOWDB_REVEAL_ERROR_CODE / FLOWDB_COLLECT_ERROR_CODE blocks.
const FLOWDB_COLLECT_INPUT_ERROR_CODE = {
  FILE_ELEMENTS_NOT_SUPPORTED: {
    code: 400,
    description: "Validation error. File elements ('FILE_INPUT' / 'MULTI_FILE_INPUT') are not supported. Use a supported element type.",
  },
  INVALID_TABLE_KEY_IN_COLLECT: {
    code: 400,
    description: "Validation error. Invalid 'table' key in collect element. Specify 'tableName' instead.",
  },
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
  // flowDB has no file-element support. flowvault's public ElementType is base-only
  // (no file types), so a TS caller can't pass them — but a JS caller still can, so
  // reject the raw string values explicitly rather than letting the collect pipeline
  // silently drop them. Compared as strings since input.type is typed base-only.
  const elementType = input.type as string;
  if (elementType === FileElementType.FILE_INPUT || elementType === FileElementType.MULTI_FILE_INPUT) {
    throw new SkyflowError(FLOWDB_COLLECT_INPUT_ERROR_CODE.FILE_ELEMENTS_NOT_SUPPORTED, [], true);
  }
  // flowDB's documented identity key is `tableName` (mapped internally to `table`).
  // Reject a client-supplied `table` so the collect and composable-collect paths
  // behave identically — otherwise `table` works on one path and breaks on the other.
  if (Object.prototype.hasOwnProperty.call(input, 'table')) {
    throw new SkyflowError(FLOWDB_COLLECT_INPUT_ERROR_CODE.INVALID_TABLE_KEY_IN_COLLECT, [], true);
  }
};

// flowDB collect-element options validator. Runs at create() time (via
// buildCreateElementFields) so the check stays flowDB-local — `returnMockValue`
// is a flowDB-only option (privacyDB has no equivalent). Only the type is
// enforced: when present it must be a boolean, otherwise the mock-CVV opt-in
// would be silently coerced to `false`.
export const validateCollectElementOptions = (options?: CollectElementOptions) => {
  if (options
    && Object.prototype.hasOwnProperty.call(options, 'returnMockValue')
    && !coreValidators.validateBooleanOptions(options.returnMockValue)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['returnMockValue'], true);
  }
};

// flowDB collect-option error codes. flowDB's upsert / additionalFields inputs use
// flowDB naming (`tableName` / `uniqueColumns` / `data`), NOT privacyDB's
// `table` / `column` / `fields`, so the shared @core SKYFLOW_ERROR_CODE messages
// (which name the privacyDB keys) would be misleading here. Defined locally,
// mirroring the FLOWDB_REVEAL_ERROR_CODE block above.
const FLOWDB_COLLECT_ERROR_CODE = {
  INVALID_UPSERT_OPTIONS_TYPE: {
    code: 400,
    description: "Validation error. Invalid 'upsert' options. Specify a non-empty array of { tableName, uniqueColumns } objects.",
  },
  INVALID_UPSERT_OPTION_ENTRY: {
    code: 400,
    description: "Validation error. Invalid 'upsert' entry at index %s1. Specify an object with 'tableName' and 'uniqueColumns'.",
  },
  MISSING_TABLE_NAME_IN_UPSERT: {
    code: 400,
    description: "Validation error. Missing or empty 'tableName' in upsert entry at index %s1. Provide a valid 'tableName'.",
  },
  INVALID_UNIQUE_COLUMNS_IN_UPSERT: {
    code: 400,
    description: "Validation error. Invalid 'uniqueColumns' in upsert entry at index %s1. Provide a non-empty array of column-name strings.",
  },
  INVALID_UPDATE_TYPE_IN_UPSERT: {
    code: 400,
    description: "Validation error. Invalid 'updateType' in upsert entry at index %s1. Use one of 'UPDATE' or 'REPLACE'.",
  },
  MISSING_RECORDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: "Validation error. Missing 'records' key in additionalFields. Specify a non-empty array of { tableName, data } records.",
  },
  INVALID_RECORDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: "Validation error. Invalid 'records' in additionalFields. Specify a non-empty array of { tableName, data } records.",
  },
  MISSING_TABLE_NAME_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: "Validation error. Missing or empty 'tableName' in additionalFields record at index %s1. Provide a valid 'tableName'.",
  },
  INVALID_DATA_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: "Validation error. Invalid 'data' in additionalFields record at index %s1. Provide a non-null object of column values.",
  },
  INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: "Validation error. Invalid 'skyflowId' in additionalFields record at index %s1. Provide a string skyflowId.",
  },
};

// flowDB upsert validator: validates the flowDB upsert shape
// ({ tableName, uniqueColumns, updateType? }). Distinct from @core's
// validateUpsertOptions (privacyDB { table, column }).
export const validateFlowDBUpsertOptions = (upsertOptions?: Array<IFlowDBUpsertOptions>) => {
  if (!(upsertOptions && Array.isArray(upsertOptions) && upsertOptions.length > 0)) {
    throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_UPSERT_OPTIONS_TYPE, [], true);
  }
  upsertOptions.forEach((option: any, index: number) => {
    if (!(option && typeof option === 'object' && !Array.isArray(option))) {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_UPSERT_OPTION_ENTRY, [`${index}`], true);
    }
    if (!(typeof option.tableName === 'string' && option.tableName.length > 0)) {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.MISSING_TABLE_NAME_IN_UPSERT, [`${index}`], true);
    }
    const { uniqueColumns } = option;
    const hasValidColumns = Array.isArray(uniqueColumns)
      && uniqueColumns.length > 0
      && uniqueColumns.every((column: any) => typeof column === 'string' && column.length > 0);
    if (!hasValidColumns) {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_UNIQUE_COLUMNS_IN_UPSERT, [`${index}`], true);
    }
    if (option.updateType !== undefined && !Object.values(UpdateType).includes(option.updateType)) {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_UPDATE_TYPE_IN_UPSERT, [`${index}`], true);
    }
  });
};

// flowDB additionalFields validator: validates the flowDB record shape
// ({ tableName, data, skyflowId? }). Distinct from @core's
// validateAdditionalFieldsInCollect (privacyDB { table, fields }). An empty-string
// skyflowId is accepted (the insert path treats it as "not provided").
export const validateFlowDBAdditionalFieldsInCollect = (recordObj?: AdditionalFields) => {
  if (!(recordObj && Object.prototype.hasOwnProperty.call(recordObj, 'records'))) {
    throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.MISSING_RECORDS_IN_ADDITIONAL_FIELDS, [], true);
  }
  const { records } = recordObj;
  if (!(records && Array.isArray(records) && records.length > 0)) {
    throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_RECORDS_IN_ADDITIONAL_FIELDS, [], true);
  }
  records.forEach((record: any, index: number) => {
    if (!(record && typeof record.tableName === 'string' && record.tableName.length > 0)) {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.MISSING_TABLE_NAME_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (!(record.data && typeof record.data === 'object' && !Array.isArray(record.data))) {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_DATA_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
    if (record.skyflowId !== undefined && typeof record.skyflowId !== 'string') {
      throw new SkyflowError(FLOWDB_COLLECT_ERROR_CODE.INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS, [`${index}`], true);
    }
  });
};
