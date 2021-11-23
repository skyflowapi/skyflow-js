import logs from './logs';

const SKYFLOW_ERROR_CODE = {
  INVALID_FIELD: { code: 400, description: logs.errorLogs.INVALID_FIELD },
  INVALID_CREDENTIALS: { code: 400, description: logs.errorLogs.INVALID_CREDENTIALS },
  INVALID_CONTAINER_TYPE: { code: 400, description: logs.errorLogs.INVALID_CONTAINER_TYPE },
  UNIQUE_ELEMENT_NAME: { code: 400, description: logs.errorLogs.UNIQUE_ELEMENT_NAME },
  ELEMENTS_NOT_MOUNTED: { code: 400, description: logs.errorLogs.ELEMENTS_NOT_MOUNTED },
  INVALID_TABLE_OR_COLUMN: { code: 400, description: logs.errorLogs.INVALID_TABLE_OR_COLUMN },
  CLIENT_CONNECTION: { code: 400, description: logs.errorLogs.CLIENT_CONNECTION },
  RECORDS_KEY_NOT_FOUND: { code: 404, description: logs.errorLogs.RECORDS_KEY_NOT_FOUND },
  EMPTY_RECORDS: { code: 400, description: logs.errorLogs.EMPTY_RECORDS },
  MISSING_RECORDS: { code: 400, description: logs.errorLogs.MISSING_RECORDS },
  EMPTY_RECORD_IDS: { code: 400, description: logs.errorLogs.EMPTY_RECORD_IDS },
  INVALID_RECORD_ID_TYPE: { code: 400, description: logs.errorLogs.INVALID_RECORD_ID_TYPE },
  INVALID_RECORD_LABEL: { code: 400, description: logs.errorLogs.INVALID_RECORD_LABEL },
  INVALID_RECORD_ALT_TEXT: { code: 400, description: logs.errorLogs.INVALID_RECORD_ALT_TEXT },
  EMPTY_TABLE_AND_FIELDS: { code: 400, description: logs.errorLogs.EMPTY_TABLE_AND_FIELDS },
  EMPTY_TABLE: { code: 400, description: logs.errorLogs.EMPTY_TABLE },
  MISSING_TABLE: { code: 400, description: logs.errorLogs.MISSING_TABLE },
  INVALID_RECORD_TABLE_VALUE: { code: 400, description: logs.errorLogs.INVALID_RECORD_TABLE_VALUE },

  INVALID_TOKEN_ID: { code: 400, description: logs.errorLogs.INVALID_TOKEN_ID },
  MISSING_TOKEN: { code: 400, description: logs.errorLogs.MISSING_TOKEN },
  MISSING_TOKEN_KEY: { code: 400, description: logs.errorLogs.MISSING_TOKEN_KEY },
  ELEMENT_MUST_HAVE_TOKEN: { code: 400, description: logs.errorLogs.ELEMENT_MUST_HAVE_TOKEN },
  INVALID_REDACTION_TYPE: { code: 400, description: logs.errorLogs.INVALID_REDACTION_TYPE },
  MISSING_REDACTION: { code: 400, description: logs.errorLogs.MISSING_REDACTION },
  MISSING_REDACTION_VALUE: { code: 400, description: logs.errorLogs.MISSING_REDACTION_VALUE },
  ELEMENT_NOT_MOUNTED: { code: 400, description: logs.errorLogs.ELEMENT_NOT_MOUNTED },
  MISSING_IDS: { code: 400, description: logs.errorLogs.MISSING_IDS },
  DUPLICATE_ELEMENT: { code: 400, description: logs.errorLogs.DUPLICATE_ELEMENT },
  INVALID_ELEMENT_TYPE: { code: 400, description: logs.errorLogs.INVALID_ELEMENT_TYPE },
  INVALID_ELEMENT_SELECTOR: { code: 400, description: logs.errorLogs.INVALID_ELEMENT_SELECTOR },
  MISSING_CONNECTION_URL: { code: 400, description: logs.errorLogs.MISSING_CONNECTION_URL },
  INVALID_CONNECTION_URL_TYPE: {
    code: 400,
    description: logs.errorLogs.INVALID_CONNECTION_URL_TYPE,
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
  UNKNOWN_ERROR: { code: 400, description: logs.errorLogs.UNKNOWN_ERROR },
  CONNECTION_ERROR: { code: 400, description: logs.errorLogs.CONNECTION_ERROR },
  TRANSACTION_ERROR: { code: 400, description: logs.errorLogs.TRANSACTION_ERROR },
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
  MISSING_REGEX_IN_PATTERN_RULE: {
    code: 400,
    description: logs.errorLogs.MISSING_REGEX_IN_PATTERN_RULE,
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
};

export default SKYFLOW_ERROR_CODE;
