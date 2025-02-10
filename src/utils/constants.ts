/*
Copyright (c) 2022 Skyflow, Inc.
*/
import logs from './logs';

const SKYFLOW_ERROR_CODE = {
  INVALID_FILE_NAME: { code: 400, description: logs.errorLogs.INVALID_FILE_NAME },
  INVALID_FIELD: { code: 400, description: logs.errorLogs.INVALID_FIELD },
  VAULTID_IS_REQUIRED: { code: 400, description: logs.errorLogs.VAULTID_IS_REQUIRED },
  EMPTY_VAULTID_IN_INIT: { code: 400, description: logs.errorLogs.EMPTY_VAULTID_IN_INIT },
  VAULTURL_IS_REQUIRED: { code: 400, description: logs.errorLogs.VAULTURL_IS_REQUIRED },
  EMPTY_VAULTURL_IN_INIT: { code: 400, description: logs.errorLogs.EMPTY_VAULTURL_IN_INIT },
  INVALID_VAULTURL_IN_INIT: { code: 400, description: logs.errorLogs.INVALID_VAULTURL_IN_INIT },
  GET_BEARER_TOKEN_IS_REQUIRED: {
    code: 400,
    description: logs.errorLogs.GET_BEARER_TOKEN_IS_REQUIRED,
  },
  EMPTY_CONTAINER_TYPE: { code: 400, description: logs.errorLogs.EMPTY_CONTAINER_TYPE },
  INVALID_CONTAINER_TYPE: { code: 400, description: logs.errorLogs.INVALID_CONTAINER_TYPE },
  UNIQUE_ELEMENT_NAME: { code: 400, description: logs.errorLogs.UNIQUE_ELEMENT_NAME },
  ELEMENTS_NOT_MOUNTED: { code: 400, description: logs.errorLogs.ELEMENTS_NOT_MOUNTED },
  MISSING_TABLE_IN_COLLECT: { code: 400, description: logs.errorLogs.MISSING_TABLE_IN_COLLECT },
  MISSING_SKYFLOWID_KEY_REVEAL: {
    code: 400,
    description: logs.errorLogs.MISSING_SKYFLOWID_KEY_REVEAL,
  },
  EMPTY_TABLE_IN_COLLECT: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_COLLECT },
  EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_SKYFLOW_ID_COLLECT: {
    code: 400,
    description: logs.errorLogs.EMPTY_SKYFLOW_ID_COLLECT,
  },
  INVALID_TABLE_IN_COLLECT: { code: 400, description: logs.errorLogs.INVALID_TABLE_IN_COLLECT },
  INVALID_SKYFLOWID_IN_COLLECT: {
    code: 400,
    description: logs.errorLogs.INVALID_SKYFLOWID_IN_COLLECT,
  },
  MISSING_COLUMN_IN_COLLECT: { code: 400, description: logs.errorLogs.MISSING_COLUMN_IN_COLLECT },
  MISSING_SKYFLOWID_IN_COLLECT: {
    code: 400,
    description: logs.errorLogs.MISSING_SKYFLOWID_IN_COLLECT,
  },

  EMPTY_COLUMN_IN_COLLECT: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_COLLECT },
  INVALID_COLUMN_IN_COLLECT: { code: 400, description: logs.errorLogs.INVALID_COLUMN_IN_COLLECT },
  CLIENT_CONNECTION: { code: 400, description: logs.errorLogs.CLIENT_CONNECTION },
  RECORDS_KEY_NOT_FOUND: { code: 404, description: logs.errorLogs.RECORDS_KEY_NOT_FOUND },
  EMPTY_RECORDS_IN_INSERT: { code: 400, description: logs.errorLogs.EMPTY_RECORDS_IN_INSERT },
  INVALID_RECORDS_IN_INSERT: {
    code: 404,
    description: logs.errorLogs.INVALID_RECORDS_IN_INSERT,
  },
  INVALID_TABLE_IN_INSERT: { code: 400, description: logs.errorLogs.INVALID_TABLE_IN_INSERT },
  EMPTY_TABLE_IN_INSERT: {
    code: 400,
    description: logs.errorLogs.EMPTY_TABLE_IN_INSERT,
  },
  MISSING_TABLE_IN_INSERT: {
    code: 400,
    description: logs.errorLogs.MISSING_TABLE_IN_INSERT,
  },
  EMPTY_FIELDS_IN_INSERT: {
    code: 400,
    description: logs.errorLogs.EMPTY_FIELDS_IN_INSERT,
  },
  MISSING_FIELDS_IN_INSERT: {
    code: 404,
    description: logs.errorLogs.MISSING_FIELDS_IN_INSERT,
  },
  INVALID_FIELDS_IN_INSERT: {
    code: 404,
    description: logs.errorLogs.INVALID_FIELDS_IN_INSERT,
  },
  INVALID_TOKENS_IN_INSERT: {
    code: 404,
    description: logs.errorLogs.INVALID_TOKENS_IN_INSERT,
  },
  RECORDS_KEY_NOT_FOUND_DETOKENIZE: {
    code: 404,
    description: logs.errorLogs.RECORDS_KEY_NOT_FOUND_DETOKENIZE,
  },
  EMPTY_RECORDS_DETOKENIZE: { code: 400, description: logs.errorLogs.EMPTY_RECORDS_DETOKENIZE },
  INVALID_RECORDS_IN_DETOKENIZE: {
    code: 404,
    description: logs.errorLogs.INVALID_RECORDS_IN_DETOKENIZE,
  },
  MISSING_TOKEN_IN_DETOKENIZE: {
    code: 400,
    description: logs.errorLogs.MISSING_TOKEN_IN_DETOKENIZE,
  },
  INVALID_TOKEN_IN_DETOKENIZE: {
    code: 400,
    description: logs.errorLogs.INVALID_TOKEN_IN_DETOKENIZE,
  },
  RECORDS_KEY_NOT_FOUND_GET: {
    code: 400,
    description: logs.errorLogs.RECORDS_KEY_NOT_FOUND_GET,
  },
  INVALID_RECORDS_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_RECORDS_IN_GET,
  },
  EMPTY_RECORDS_GET: {
    code: 400,
    description: logs.errorLogs.EMPTY_RECORDS_GET,
  },
  MISSING_IDS_IN_GET: {
    code: 400,
    description: logs.errorLogs.MISSING_IDS_IN_GET,
  },
  INVALID_IDS_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_IDS_IN_GET,
  },
  INVALID_COLUMN_VALUES_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_COLUMN_VALUES_IN_GET,
  },
  EMPTY_IDS_IN_GET: {
    code: 400,
    description: logs.errorLogs.EMPTY_IDS_IN_GET,
  },
  INVALID_SKYFLOWID_TYPE_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_SKYFLOWID_TYPE_IN_GET,
  },
  MISSING_TABLE_IN_GET: {
    code: 400,
    description: logs.errorLogs.MISSING_TABLE_IN_GET,
  },
  INVALID_TABLE_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_TABLE_IN_GET,
  },
  MISSING_REDACTION_IN_GET: {
    code: 400,
    description: logs.errorLogs.MISSING_REDACTION_IN_GET,
  },
  INVALID_REDACTION_TYPE_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_REDACTION_TYPE_IN_GET,
  },
  INVALID_TOKENS_IN_GET: {
    code: 400,
    description: logs.errorLogs.INVALID_TOKENS_IN_GET,
  },
  TOKENS_GET_COLUMN_NOT_SUPPORTED: {
    code: 400,
    description: logs.errorLogs.TOKENS_GET_COLUMN_NOT_SUPPORTED,
  },
  REDACTION_WITH_TOKENS_NOT_SUPPORTED: {
    code: 400,
    description: logs.errorLogs.REDACTION_WITH_TOKENS_NOT_SUPPORTED,
  },
  INVALID_REDACTION_TYPE_IN_DETOKENIZE: {
    code: 400,
    description: logs.errorLogs.INVALID_REDACTION_TYPE_IN_DETOKENIZE,
  },
  INVALID_TOKENS_IN_COLLECT: {
    code: 404,
    description: logs.errorLogs.INVALID_TOKENS_IN_COLLECT,
  },
  RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS: {
    code: 404,
    description: logs.errorLogs.RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS,
  },
  INVALID_RECORDS_IN_ADDITIONAL_FIELDS: {
    code: 404,
    description: logs.errorLogs.INVALID_RECORDS_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_RECORDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.EMPTY_RECORDS_IN_ADDITIONAL_FIELDS,
  },
  MISSING_TABLE_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.MISSING_TABLE_IN_ADDITIONAL_FIELDS,
  },
  INVALID_TABLE_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.INVALID_TABLE_IN_ADDITIONAL_FIELDS,
  },
  INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS,
  },
  MISSING_FIELDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.MISSING_FIELDS_IN_ADDITIONAL_FIELDS,
  },
  INVALID_FIELDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.INVALID_FIELDS_IN_ADDITIONAL_FIELDS,
  },
  RECORDS_KEY_NOT_FOUND_DELETE: {
    code: 400,
    description: logs.errorLogs.RECORDS_KEY_NOT_FOUND_DELETE,
  },
  EMPTY_RECORDS_IN_DELETE: { code: 400, description: logs.errorLogs.EMPTY_RECORDS_IN_DELETE },
  INVALID_RECORDS_IN_DELETE: { code: 404, description: logs.errorLogs.INVALID_RECORDS_IN_DELETE },
  INVALID_TABLE_IN_DELETE: { code: 400, description: logs.errorLogs.INVALID_TABLE_IN_DELETE },
  EMPTY_TABLE_IN_DELETE: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_DELETE },
  MISSING_TABLE_IN_DELETE: { code: 400, description: logs.errorLogs.MISSING_TABLE_IN_DELETE },
  EMPTY_ID_IN_DELETE: { code: 400, description: logs.errorLogs.EMPTY_ID_IN_DELETE },
  MISSING_ID_IN_DELETE: { code: 404, description: logs.errorLogs.MISSING_ID_IN_DELETE },
  INVALID_ID_IN_DELETE: { code: 404, description: logs.errorLogs.INVALID_ID_IN_DELETE },
  EMPTY_RECORDS_REVEAL: { code: 400, description: logs.errorLogs.EMPTY_RECORDS_REVEAL },
  MISSING_TOKEN_KEY_REVEAL: { code: 400, description: logs.errorLogs.MISSING_TOKEN_KEY_REVEAL },
  INVALID_TOKEN_ID_REVEAL: { code: 400, description: logs.errorLogs.INVALID_TOKEN_ID_REVEAL },
  INVALID_LABEL_REVEAL: { code: 400, description: logs.errorLogs.INVALID_LABEL_REVEAL },
  INVALID_ALT_TEXT_REVEAL: { code: 400, description: logs.errorLogs.INVALID_ALT_TEXT_REVEAL },
  INVALID_ALT_TEXT_RENDER: { code: 400, description: logs.errorLogs.INVALID_ALT_TEXT_RENDER },
  INVALID_FORMAT_REVEAL: { code: 400, description: logs.errorLogs.INVALID_FORMAT_REVEAL },
  EMPTY_FORMAT_REVEAL: { code: 400, description: logs.errorLogs.EMPTY_FORMAT_REVEAL },
  INVALID_FORMAT_VALUE_REVEAL: {
    code: 400, description: logs.errorLogs.INVALID_FORMAT_VALUE_REVEAL,
  },
  INVALID_REDACTION_TYPE_REVEAL: {
    code: 400,
    description: logs.errorLogs.INVALID_REDACTION_TYPE_REVEAL,
  },
  EMPTY_TABLE_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.EMPTY_TABLE_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_FIELDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.EMPTY_FIELDS_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_TOKEN_IN_DETOKENIZE: { code: 400, description: logs.errorLogs.EMPTY_TOKEN_IN_DETOKENIZE },
  EMPTY_SKYFLOWID_IN_GET: { code: 400, description: logs.errorLogs.EMPTY_SKYFLOWID_IN_GET },
  EMPTY_TABLE_IN_GET: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_GET },
  EMPTY_REDACTION_TYPE_IN_GET: {
    code: 400,
    description: logs.errorLogs.EMPTY_REDACTION_TYPE_IN_GET,
  },
  EMPTY_TOKEN_ID_REVEAL: { code: 400, description: logs.errorLogs.EMPTY_TOKEN_ID_REVEAL },
  DUPLICATE_ELEMENT: { code: 400, description: logs.errorLogs.DUPLICATE_ELEMENT },
  DUPLICATE_ELEMENT_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.DUPLICATE_ELEMENT_ADDITIONAL_FIELDS,
  },
  MISSING_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.MISSING_ELEMENT_TYPE },
  EMPTY_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.EMPTY_ELEMENT_TYPE },
  INVALID_ALLOWED_OPTIONS: { code: 400, description: logs.errorLogs.INVALID_ALLOWED_OPTIONS },
  EMPTY_ALLOWED_OPTIONS_ARRAY: {
    code: 400,
    description: logs.errorLogs.EMPTY_ALLOWED_OPTIONS_ARRAY,
  },
  INVALID_ALLOWED_FILETYPE_ARRAY: {
    code: 400,
    description: logs.errorLogs.INVALID_ALLOWED_FILETYPE_ARRAY,
  },
  INVALID_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.INVALID_ELEMENT_TYPE },
  INVALID_ELEMENT_SELECTOR: { code: 400, description: logs.errorLogs.INVALID_ELEMENT_SELECTOR },
  FRAME_NOT_FOUND: { code: 400, description: logs.errorLogs.FRAME_NOT_FOUND },
  REQUIRED_PARAMS_NOT_PROVIDED: {
    code: 400,
    description: logs.errorLogs.REQUIRED_PARAMS_NOT_PROVIDED,
  },
  INVALID_RECORD_COLUMN_VALUE:
   { code: 400, description: logs.errorLogs.INVALID_RECORD_COLUMN_VALUE },
  MISSING_RECORD_COLUMN_VALUE:
   { code: 400, description: logs.errorLogs.MISSING_RECORD_COLUMN_VALUE },
  MISSING_RECORD_COLUMN_NAME: { code: 400, description: logs.errorLogs.MISSING_RECORD_COLUMN_NAME },

  INVALID_EVENT_TYPE: { code: 400, description: logs.errorLogs.INVALID_EVENT_TYPE },
  INVALID_EVENT_LISTENER: { code: 400, description: logs.errorLogs.INVALID_EVENT_LISTENER },
  MISSING_HANDLER_IN_EVENT_LISTENER: {
    code: 400,
    description: logs.errorLogs.MISSING_HANDLER_IN_EVENT_LISTENER,
  },
  INVALID_HANDLER_IN_EVENT_LISTENER: {
    code: 400,
    description: logs.errorLogs.INVALID_HANDLER_IN_EVENT_LISTENER,
  },
  UNKNOWN_ERROR: { code: 400, description: logs.errorLogs.UNKNOWN_ERROR },
  CONNECTION_ERROR: { code: 400, description: logs.errorLogs.CONNECTION_ERROR },
  NETWORK_ERROR: { code: 500, description: logs.errorLogs.NETWORK_ERROR },
  COMPLETE_AND_VALID_INPUTS: { code: 400, description: logs.errorLogs.COMPLETE_AND_VALID_INPUTS },
  INVALID_VALIDATIONS_TYPE: { code: 400, description: logs.errorLogs.INVALID_VALIDATIONS_TYPE },
  MISSING_VALIDATION_RULE_TYPE: {
    code: 400,
    description: logs.errorLogs.MISSING_VALIDATION_RULE_TYPE,
  },
  INVALID_VALIDATION_RULE_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_VALIDATION_RULE_TYPE,
  },
  MISSING_VALIDATION_RULE_PARAMS: {
    code: 400,
    description: logs.errorLogs.MISSING_VALIDATION_RULE_PARAMS,
  },
  INVALID_VALIDATION_RULE_PARAMS: {
    code: 400,
    description: logs.errorLogs.INVALID_VALIDATION_RULE_PARAMS,
  },
  MISSING_REGEX_IN_REGEX_MATCH_RULE: {
    code: 400,
    description: logs.errorLogs.MISSING_REGEX_IN_REGEX_MATCH_RULE,
  },
  INVALID_REGEX_IN_REGEX_MATCH_RULE: {
    code: 400,
    description: logs.errorLogs.INVALID_REGEX_IN_REGEX_MATCH_RULE,
  },
  MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE: {
    code: 400,
    description: logs.errorLogs.MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE,
  },
  MISSING_ELEMENT_IN_ELEMENT_MATCH_RULE: {
    code: 400,
    description: logs.errorLogs.MISSING_ELEMENT_IN_ELEMENT_MATCH_RULE,
  },
  INVALID_ELEMENT_IN_ELEMENT_MATCH_RULE: {
    code: 400,
    description: logs.errorLogs.INVALID_ELEMENT_IN_ELEMENT_MATCH_RULE,
  },
  ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE: {
    code: 400,
    description: logs.errorLogs.ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE,
  },
  EMPTY_ELEMENT_IN_MOUNT: {
    code: 400,
    description: logs.errorLogs.EMPTY_ELEMENT_IN_MOUNT,
  },
  REVEAL_ELEMENT_ERROR_STATE: {
    code: 400,
    description: logs.errorLogs.REVEAL_ELEMENT_ERROR_STATE,
  },
  INVALID_FILE_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_FILE_TYPE,
  },
  INVALID_FILE_SIZE: {
    code: 400,
    description: logs.errorLogs.INVALID_FILE_SIZE,
  },
  NO_FILE_SELECTED: {
    code: 400,
    description: logs.errorLogs.NO_FILE_SELECTED,
  },
  INVALID_TABLE_IN_UPSERT_OPTION: {
    code: 400,
    description: logs.errorLogs.INVALID_TABLE_IN_UPSERT_OPTION,
  },
  INVALID_COLUMN_IN_UPSERT_OPTION: {
    code: 400,
    description: logs.errorLogs.INVALID_COLUMN_IN_UPSERT_OPTION,
  },

  INVALID_UPSERT_OPTION_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_UPSERT_OPTION_TYPE,
  },
  EMPTY_UPSERT_OPTIONS_ARRAY: {
    code: 400,
    description: logs.errorLogs.EMPTY_UPSERT_OPTIONS_ARRAY,
  },
  INVALID_UPSERT_OPTION_OBJECT_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_UPSERT_OPTION_OBJECT_TYPE,
  },
  MISSING_TABLE_IN_UPSERT_OPTION: {
    code: 400,
    description: logs.errorLogs.MISSING_TABLE_IN_UPSERT_OPTION,
  },

  MISSING_COLUMN_IN_UPSERT_OPTION: {
    code: 400,
    description: logs.errorLogs.MISSING_COLUMN_IN_UPSERT_OPTION,
  },
  INVALID_RECORD_COLUMN_VALUE_TYPE:
  { code: 400, description: logs.errorLogs.INVALID_RECORD_COLUMN_VALUE_TYPE },
  INVALID_COLUMN_VALUES_TYPE:
  { code: 400, description: logs.errorLogs.INVALID_COLUMN_VALUES_TYPE },
  EMPTY_RECORD_COLUMN_VALUES: { code: 400, description: logs.errorLogs.EMPTY_RECORD_COLUMN_VALUES },
  EMPTY_COLUMN_VALUE: { code: 400, description: logs.errorLogs.EMPTY_COLUMN_VALUE },
  MISSING_IDS_OR_COLUMN_VALUES_IN_GET: {
    code: 400, description: logs.errorLogs.MISSING_IDS_OR_COLUMN_VALUES_IN_GET,
  },
  SKYFLOW_IDS_AND_COLUMN_NAME_BOTH_SPECIFIED: {
    code: 400, description: logs.errorLogs.SKYFLOW_IDS_AND_COLUMN_NAME_BOTH_SPECIFIED,
  },
  SKYFLOW_IDS_AND_TOKEN_BOTH_SPECIFIED: {
    code: 400, description: logs.errorLogs.SKYFLOW_IDS_AND_TOKEN_BOTH_SPECIFIED,
  },
  MISSING_TABLE_KEY_REVEAL: {
    code: 400, description: logs.errorLogs.MISSING_TABLE_KEY_REVEAL,
  },
  MISSING_COLUMN_KEY_REVEAL: {
    code: 400, description: logs.errorLogs.MISSING_COLUMN_KEY_REVEAL,
  },
  INVALID_SKYFLOW_ID_REVEAL: {
    code: 400, description: logs.errorLogs.INVALID_SKYFLOW_ID_REVEAL,
  },

  INVALID_TABLE_REVEAL: {
    code: 400, description: logs.errorLogs.INVALID_TABLE_REVEAL,
  },
  INVALID_COLUMN_NAME_REVEAL: {
    code: 400, description: logs.errorLogs.INVALID_COLUMN_NAME_REVEAL,
  },
  EMPTY_SKYFLOW_ID_REVEAL: {
    code: 400, description: logs.errorLogs.EMPTY_SKYFLOW_ID_REVEAL,
  },
  EMPTY_TABLE_REVEAL: {
    code: 400, description: logs.errorLogs.EMPTY_TABLE_REVEAL,
  },
  EMPTY_COLUMN_NAME_REVEAL: {
    code: 400, description: logs.errorLogs.EMPTY_COLUMN_NAME_REVEAL,
  },
  RECORDS_KEY_NOT_FOUND_GETBYID: {
    code: 400,
    description: logs.errorLogs.RECORDS_KEY_NOT_FOUND_GETBYID,
  },
  INVALID_RECORDS_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.INVALID_RECORDS_IN_GETBYID,
  },
  EMPTY_RECORDS_GETBYID: {
    code: 400,
    description: logs.errorLogs.EMPTY_RECORDS_GETBYID,
  },
  MISSING_IDS_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.MISSING_IDS_IN_GETBYID,
  },
  INVALID_IDS_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.INVALID_IDS_IN_GETBYID,
  },
  EMPTY_IDS_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.EMPTY_IDS_IN_GETBYID,
  },
  INVALID_SKYFLOWID_TYPE_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.INVALID_SKYFLOWID_TYPE_IN_GETBYID,
  },
  MISSING_TABLE_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.MISSING_TABLE_IN_GETBYID,
  },
  INVALID_TABLE_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.INVALID_TABLE_IN_GETBYID,
  },
  MISSING_REDACTION_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.MISSING_REDACTION_IN_GETBYID,
  },
  INVALID_REDACTION_TYPE_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.INVALID_REDACTION_TYPE_IN_GETBYID,
  },
  EMPTY_SKYFLOWID_IN_GETBYID: { code: 400, description: logs.errorLogs.EMPTY_SKYFLOWID_IN_GETBYID },
  EMPTY_TABLE_IN_GETBYID: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_GETBYID },
  EMPTY_REDACTION_TYPE_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.EMPTY_REDACTION_TYPE_IN_GETBYID,
  },
  MISSING_COMPOSABLE_LAYOUT_KEY: {
    code: 400,
    description: logs.errorLogs.MISSING_COMPOSABLE_LAYOUT_KEY,
  },
  EMPTY_COMPOSABLE_LAYOUT_ARRAY: {
    code: 400,
    description: logs.errorLogs.EMPTY_COMPOSABLE_LAYOUT_ARRAY,
  },
  INVALID_COMPOSABLE_LAYOUT_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_COMPOSABLE_LAYOUT_TYPE,
  },
  NEGATIVE_VALUES_COMPOSABLE_LAYOUT: {
    code: 400,
    description: logs.errorLogs.NEGATIVE_VALUES_COMPOSABLE_LAYOUT,
  },
  MISMATCH_ELEMENT_COUNT_LAYOUT_SUM: {
    code: 400,
    description: logs.errorLogs.MISMATCH_ELEMENT_COUNT_LAYOUT_SUM,
  },
  MISSING_COMPOSABLE_CONTAINER_OPTIONS: {
    code: 400,
    description: logs.errorLogs.MISSING_COMPOSABLE_CONTAINER_OPTIONS,
  },
  INVALID_COMPOSABLE_CONTAINER_OPTIONS: {
    code: 400,
    description: logs.errorLogs.INVALID_COMPOSABLE_CONTAINER_OPTIONS,
  },
  COMPOSABLE_CONTAINER_NOT_MOUNTED: {
    code: 400,
    description: logs.errorLogs.COMPOSABLE_CONTAINER_NOT_MOUNTED,
  },
  INVALID_BOOLEAN_OPTIONS: {
    code: 400,
    description: logs.errorLogs.INVALID_BOOLEAN_OPTIONS,
  },

  EMPTY_COLLECT_CUSTOM_FORMAT: {
    code: 400,
    description: logs.errorLogs.EMPTY_COLLECT_CUSTOM_FORMAT,
  },

  INVALID_INPUT_OPTIONS_FORMAT: {
    code: 400,
    description: logs.errorLogs.INVALID_INPUT_OPTIONS_FORMAT,
  },

  INVALID_INPUT_OPTIONS_TRANSLATION: {
    code: 400,
    description: logs.errorLogs.INVALID_INPUT_OPTIONS_TRANSLATION,
  },
  INVALID_OPTION_CARD_METADATA: {
    code: 400,
    description: logs.errorLogs.INVALID_OPTION_CARD_METADATA,
  },
  INVALID_OPTION_CARD_SCHEME: {
    code: 400,
    description: logs.errorLogs.INVALID_OPTION_CARD_SCHEME,
  },
  INVALID_FIELD_SHOW_3DS_CHALLEGNGE: {
    code: 400,
    description: logs.errorLogs.INVALID_FIELD_SHOW_3DS_CHALLEGNGE,
  },
};

export default SKYFLOW_ERROR_CODE;
