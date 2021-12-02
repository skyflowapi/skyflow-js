import logs from './logs';

const SKYFLOW_ERROR_CODE = {
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
  EMPTY_TABLE_IN_COLLECT: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_COLLECT },
  INVALID_TABLE_IN_COLLECT: { code: 400, description: logs.errorLogs.INVALID_TABLE_IN_COLLECT },
  MISSING_COLUMN_IN_COLLECT: { code: 400, description: logs.errorLogs.MISSING_COLUMN_IN_COLLECT },
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
  MISSING_FIELDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.MISSING_FIELDS_IN_ADDITIONAL_FIELDS,
  },
  INVALID_FIELDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.INVALID_FIELDS_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_RECORDS_REVEAL: { code: 400, description: logs.errorLogs.EMPTY_RECORDS_REVEAL },
  MISSING_TOKEN_KEY_REVEAL: { code: 400, description: logs.errorLogs.MISSING_TOKEN_KEY_REVEAL },
  INVALID_TOKEN_ID_REVEAL: { code: 400, description: logs.errorLogs.INVALID_TOKEN_ID_REVEAL },
  INVALID_LABEL_REVEAL: { code: 400, description: logs.errorLogs.INVALID_LABEL_REVEAL },
  INVALID_ALT_TEXT_REVEAL: { code: 400, description: logs.errorLogs.INVALID_ALT_TEXT_REVEAL },
  EMPTY_TABLE_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.EMPTY_TABLE_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_FIELDS_IN_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.EMPTY_FIELDS_IN_ADDITIONAL_FIELDS,
  },
  EMPTY_TOKEN_IN_DETOKENIZE: { code: 400, description: logs.errorLogs.EMPTY_TOKEN_IN_DETOKENIZE },
  EMPTY_SKYFLOWID_IN_GETBYID: { code: 400, description: logs.errorLogs.EMPTY_SKYFLOWID_IN_GETBYID },
  EMPTY_TABLE_IN_GETBYID: { code: 400, description: logs.errorLogs.EMPTY_TABLE_IN_GETBYID },
  EMPTY_REDACTION_TYPE_IN_GETBYID: {
    code: 400,
    description: logs.errorLogs.EMPTY_REDACTION_TYPE_IN_GETBYID,
  },
  EMPTY_TOKEN_ID_REVEAL: { code: 400, description: logs.errorLogs.EMPTY_TOKEN_ID_REVEAL },
  ELEMENT_MUST_HAVE_TOKEN: { code: 400, description: logs.errorLogs.ELEMENT_MUST_HAVE_TOKEN },
  DUPLICATE_ELEMENT: { code: 400, description: logs.errorLogs.DUPLICATE_ELEMENT },
  DUPLICATE_ELEMENT_ADDITIONAL_FIELDS: {
    code: 400,
    description: logs.errorLogs.DUPLICATE_ELEMENT_ADDITIONAL_FIELDS,
  },
  MISSING_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.MISSING_ELEMENT_TYPE },
  EMPTY_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.EMPTY_ELEMENT_TYPE },
  INVALID_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.INVALID_ELEMENT_TYPE },
  INVALID_ELEMENT_SELECTOR: { code: 400, description: logs.errorLogs.INVALID_ELEMENT_SELECTOR },
  MISSING_CONNECTION_CONFIG: { code: 400, description: logs.errorLogs.MISSING_CONNECTION_CONFIG },
  EMPTY_CONNECTION_URL: { code: 400, description: logs.errorLogs.EMPTY_CONNECTION_URL },
  MISSING_CONNECTION_URL: { code: 400, description: logs.errorLogs.MISSING_CONNECTION_URL },
  INVALID_CONNECTION_URL_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_CONNECTION_URL_TYPE,
  },
  ELEMENTS_NOT_MOUNTED_INVOKE_CONNECTION: {
    code: 400,
    description: logs.errorLogs.ELEMENTS_NOT_MOUNTED_INVOKE_CONNECTION,
  },
  INVALID_CONNECTION_URL: { code: 400, description: logs.errorLogs.INVALID_CONNECTION_URL },
  MISSING_METHODNAME_KEY: { code: 400, description: logs.errorLogs.MISSING_METHODNAME_KEY },
  INVALID_METHODNAME_VALUE: { code: 400, description: logs.errorLogs.INVALID_METHODNAME_VALUE },
  FRAME_NOT_FOUND: { code: 400, description: logs.errorLogs.FRAME_NOT_FOUND },
  REQUIRED_PARAMS_NOT_PROVIDED: {
    code: 400,
    description: logs.errorLogs.REQUIRED_PARAMS_NOT_PROVIDED,
  },
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
  RESPONSE_BODY_KEY_MISSING: { code: 404, description: logs.errorLogs.RESPONSE_BODY_KEY_MISSING },
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
  INVALID_EXPIRATION_DATE_FORMAT: {
    code: 400,
    description: logs.errorLogs.INVALID_EXPIRATION_DATE_FORMAT,
  },
  REVEAL_ELEMENT_ERROR_STATE: {
    code: 400,
    description: logs.errorLogs.REVEAL_ELEMENT_ERROR_STATE,
  },
};

export default SKYFLOW_ERROR_CODE;
