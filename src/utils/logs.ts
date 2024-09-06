/*
Copyright (c) 2022 Skyflow, Inc.
*/

const logs = {
  infoLogs: {
    INITIALIZE_CLIENT: '%s1 - Initializing skyflow client.',
    CLIENT_INITIALIZED: '%s1 - Initialized skyflow client successfully.',

    CREATE_COLLECT_CONTAINER: '%s1 - Creating Collect container.',
    COLLECT_CONTAINER_CREATED: '%s1 - Created Collect container successfully.',

    CREATE_REVEAL_CONTAINER: '%s1 - Creating Reveal container.',
    REVEAL_CONTAINER_CREATED: '%s1 - Created Reveal container successfully.',

    VALIDATE_RECORDS: '%s1 - Validating insert records.',
    VALIDATE_DETOKENIZE_INPUT: '%s1 - Validating detokenize input.',
    VALIDATE_GET_INPUT: '%s1 - Validating get input.',
    VALIDATE_DELETE_INPUT: '%s1 - Validating delete input.',
    VALIDATE_COLLECT_RECORDS: '%s1 - Validating collect element input.',
    VALIDATE_REVEAL_RECORDS: '%s1 - Validating reveal element input.',
    VALIDATE_RENDER_RECORDS: '%s1 - Validating file render element input.',

    CREATED_ELEMENT: '%s1 - Created %s2 element.',
    ELEMENT_MOUNTED: '%s1 - %s2 Element mounted.',
    ELEMENT_REVEALED: '%s1 - %s2 Element revealed.',
    FILE_RENDERED: '%s1 - %s2 File rendered.',
    COLLECT_SUBMIT_SUCCESS: '%s1 - Data has been collected successfully.',
    REVEAL_SUBMIT_SUCCESS: '%s1 - Data has been revealed successfully.',
    RENDER_SUBMIT_SUCCESS: '%s1 - File download URL has been fetched successfully.',
    INSERT_DATA_SUCCESS: '%s1 - Data has been inserted successfully.',
    DETOKENIZE_SUCCESS: '%s1 - Data has been revealed successfully.',
    GET_SUCCESS: '%s1 - Data has been revealed successfully.',
    DELETE_SUCCESS: '%s1 - Data has been deleted successfully.',

    BEARER_TOKEN_LISTENER: '%s1 - Get bearer token listener added.',
    CAPTURED_BEARER_TOKEN_EVENT: '%s1 - Captured bearer token event.',
    BEARER_TOKEN_RESOLVED: '%s1 - GetBearerToken promise resolved successfully.',
    REUSE_BEARER_TOKEN: '%s1 - Reusing the bearer token.',

    PUREJS_CONTROLLER_INITIALIZED: '%s1 - SkyflowController initialized.',
    PUREJS_LISTENER_READY: '%s1 - Purejs listener ready.',
    EMIT_PURE_JS_CONTROLLER: '%s1 - Emitted Skyflow controller event.',

    INSERT_TRIGGERED: '%s1 - Insert method triggered.',
    DETOKENIZE_TRIGGERED: '%s1 - Detokenize method triggered.',
    GET_TRIGGERED: '%s1 - Get method triggered.',
    GET_BY_ID_TRIGGERED: '%s1 - Get method triggered.',
    DELETE_TRIGGERED: '%s1 - Delete method triggered.',
    EMIT_PURE_JS_REQUEST: '%s1 - Emitted %s2 request.',
    CAPTURE_PURE_JS_REQUEST: '%s1 - Captured %s2 event.',
    LISTEN_PURE_JS_REQUEST: '%s1 - Listening to %s2 event.',

    CAPTURE_PUREJS_FRAME: '%s1 - Captured SkyflowController frame ready event.',

    FETCH_RECORDS_RESOLVED: '%s1 - Detokenize request is resolved.',

    INSERT_RECORDS_RESOLVED: '%s1 - Insert request is resolved.',

    GET_RESOLVED: '%s1 - Get request is resolved.',
    GET_BY_SKYFLOWID_RESOLVED: '%s1 - GetById request is resolved.',

    DELETE_RESOLVED: '%s1 - Delete request is resolved',

    EMIT_EVENT: '%s1 - %s2 event emitted',
    CAPTURE_EVENT: '%s1 - Captured event %s2',
    METRIC_CAPTURE_EVENT: 'Metric event captured Successfully',
    UNKNOWN_METRIC_CAPTURE_EVENT: 'Metric event capturing Failed with %s1',
    UNKNOWN_RESPONSE_FROM_METRIC_EVENT: 'Metric event Captured with Unknown Response',
    LISTEN_COLLECT_FRAME_READY: '%s1 - Listening to collect FRAME_READY event',
    EMIT_COLLECT_ELEMENT_FRAME_READY: '%s1 - Emitting collect element %s2 FRAME_READY event',
    ENTERED_COLLECT_FRAME_READY_CB: '%s1 - In IFrameForm constructor, Entered FRAME_READY callback',
    EXECUTE_COLLECT_ELEMENT_FRAME_READY_CB: '%s1 - In IFrameForm, executing collect element, %s2 FRAME_READY callback',
    CLIENT_METADATA_NOT_SET: '%s1 - Client metadata not set',
    EXECUTE_COLLECT_ELEMENT_INIT: '%s1 - calling Collect element init',
    INSIDE__COLLECT_ELEMENT_INIT: '%s1 - Inside Collect element init for %s2',
    CREATING_COLLECT_ELEMENT_FORM: '%s1 - Start, creating iframe form for %s2',
    COLLECT_FRAME_READY_CB: '%s1 - In FrameElements, executing collect element FRAME_READY cb for %s2, sending metadata',
    INSIDE_FRAME_ELEMENTS_CONSTRUCOTR: '%s1 - Inside FrameElements constructor',
    SETUP_IN_START: '%s1 - Inside FrameElements start(), calling setup',
    SETUP_IN_CONSTRUCTOR: '%s1 - Inside FrameElements constructor, calling setup',
    COLLECT_ELEMET_START: '%s1 - %s2, Collect Element start',
    COLLECT_CONTROLLER_START: '%s1 - %s2, Collect Controller start',
    REVEAL_ELEMENT_START: '%s1 - %s2, Reveal Element start',
    EMIT_COLLECT_FRAME_CONTROLLER_EVENT: '%s1 - Emit collect FrameController FRAME_READY event',
    EXECUTE_COLLECT_CONTROLLER_READY_CB: '%s1 - Executing collect FrameController FRAME_READY callback, set client metadata',
    IFRAMEFORM_CONSTRUCTOR_FRAME_READY_LISTNER: '%s1 - In IFrameForm constructor, Adding listener for FRAME_READY event',
    IFRAMEFORM_CONSTRUCTOR_TOKENIZATION_LISTNER: '%s1 - In IFrameForm constructor, Adding listener for TOKENIZATION_REQUEST event',
    CURRENT_ENV: '%s1 - Client Env is %s2',
    CURRENT_LOG_LEVEL: '%s1 - Client LogLevel is %s2',
    VALIDATE_GET_BY_ID_INPUT: '%s1 - Validating getByID input.',
  },
  errorLogs: {
    INVALID_FILE_NAMES: 'Invalid File Name. Only alphanumeric characters and !-_.*() are allowed.',
    INVALID_FILE_NAME: `Invalid File Name. Only alphanumeric characters and !-_.*() are allowed.`,
    CLIENT_CONNECTION: `client connection not established. client info has not reached iframes`,
    INVALID_BEARER_TOKEN: `Token generated from 'getBearerToken' callback function is invalid. Make sure the implementation of 'getBearerToken' is correct.`,
    BEARER_TOKEN_REJECTED: `'getBearerToken' callback function call failed with rejected promise. Make sure the implementation of 'getBearerToken' is correct.`,
    VAULTID_IS_REQUIRED: `Initialization failed. Invalid credentials. Specify a valid 'vaultID'.`,
    EMPTY_VAULTID_IN_INIT: `Initialization failed. Invalid credentials. Specify a valid 'vaultID'.`,
    VAULTURL_IS_REQUIRED: `Initialization failed. Invalid credentials. Specify a valid 'vaultURL'`,
    EMPTY_VAULTURL_IN_INIT: `Initialization failed. Invalid credentials. Specify a valid 'vaultURL'`,
    INVALID_VAULTURL_IN_INIT: `Initialization failed. Invalid client credentials. 'vaultURL' must be begin with 'https://.'`,
    GET_BEARER_TOKEN_IS_REQUIRED: `Initialization failed. Invalid client credentials. Specify a valid bearer token.`,
    EMPTY_CONTAINER_TYPE: `Container creation failed. 'containerType' is invalid. Specify a valid container type.`,
    INVALID_CONTAINER_TYPE: `Container creation failed. '%s1' is invalid. Specify a valid container type.`,

    INVALID_COLLECT_VALUE: 'Invalid value',
    INVALID_COLLECT_VALUE_WITH_LABEL: 'Invalid %s1',
    REQUIRED_COLLECT_VALUE: '%s1 is required',
    DEFAULT_REQUIRED_COLLECT_VALUE: 'Field is required',

    RECORDS_KEY_NOT_FOUND: `Validation error. Invalid 'records' key found. Specify a value of type array instead.`,
    INVALID_RECORDS_IN_INSERT: `Validation error. Invalid records. Specify a value of type array instead.`,
    EMPTY_RECORDS_IN_INSERT: `Validation error. 'records' key cannot be empty. Provide a non-empty value instead.`,
    MISSING_TABLE_IN_INSERT: `Validation error. Missing 'table' key in records at index %s1. Provide a valid 'table' key.`,
    EMPTY_TABLE_IN_INSERT: `Validation error. 'table' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    INVALID_TABLE_IN_INSERT: `Validation error. Invalid 'table' key in records at index %s1. Specify a value of type string instead.`,
    EMPTY_FIELDS_IN_INSERT: `Validation error. Missing 'fields' key in records at index %s1. Provide a valid 'fields' key.`,
    MISSING_FIELDS_IN_INSERT: `Validation error. 'fields' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    INVALID_FIELDS_IN_INSERT: `Validation error. Invalid 'fields' key in records at index %s1. Specify a value of type object instead.`,
    INVALID_TOKENS_IN_INSERT: `Validation error.Invalid 'tokens' key in insert options. Specify a boolean value for tokens.`,
    RECORDS_KEY_NOT_FOUND_DELETE: `Validation error. Missing 'records' key. Provide a valid 'records' key.`,
    INVALID_RECORDS_IN_DELETE: `Validation error. Invalid 'records' key found. Specify a value of type array instead.`,
    EMPTY_RECORDS_IN_DELETE: `Validation error. 'records' key cannot be empty. Provide a non-empty value instead.`,
    MISSING_TABLE_IN_DELETE: `Validation error. Missing 'table' key in records at index %s1. Provide a valid 'table' key.`,
    EMPTY_TABLE_IN_DELETE: `Validation error. 'table' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    INVALID_TABLE_IN_DELETE: `Validation error. Invalid 'table' key in records at index %s1. Specify a value of type string instead.`,
    MISSING_ID_IN_DELETE: `Validation error. Missing 'id' key in records at index %s1. Provide a valid 'id' key.`,
    EMPTY_ID_IN_DELETE: `Validation error. 'id' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    INVALID_ID_IN_DELETE: `Validation error. Invalid 'id' key in records at index %s1. Specify a value of type string instead.`,
    DELETE_RECORDS_REJECTED: `Delete failed. Delete request is rejected.`,
    INVALID_TOKENS_IN_COLLECT: `Validation error. Invalid tokens. Specify a boolean value for tokens.`,
    RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS: `Validation error.records key not found in additionalFields. Specify a records key in addtionalFields.`,
    INVALID_RECORDS_IN_ADDITIONAL_FIELDS: `Validation error.'records' must be an array within additionalFields.`,
    EMPTY_RECORDS_IN_ADDITIONAL_FIELDS: `Validation error. 'records' object cannot be empty within additionalFields. Specify a non-empty value instead.`,
    MISSING_TABLE_IN_ADDITIONAL_FIELDS: `Validation error. 'table' key not found in additionalFields record at index %s1`,
    INVALID_TABLE_IN_ADDITIONAL_FIELDS: `Validation error.Invalid table key value in additionalFields record at index %s1. Specify a value of type string for table key.`,
    INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: `Validation error.Invalid 'skyflow_id' key value in additionalFields record at index %s1. Specify a valid value for 'skyflow_id' key.`,
    MISSING_FIELDS_IN_ADDITIONAL_FIELDS: `Validation error.'fields' key not found in additionalFields record at index %s1. Specify a 'fields' key in additionalFields record at index %s1.`,
    INVALID_FIELDS_IN_ADDITIONAL_FIELDS: `Validation error.invaid 'fields' key value in additionalFields record at index %s1. Specify a value of type array for 'fields' key.`,
    RECORDS_KEY_NOT_FOUND_DETOKENIZE: `Delete failed. Delete request is rejected.`,
    EMPTY_RECORDS_DETOKENIZE: `Validation error. Invalid 'records' key found. Specify a value of type array instead.`,
    INVALID_RECORDS_IN_DETOKENIZE: `Validation error. 'records' key cannot be empty. Provide a non-empty value instead.`,
    MISSING_TOKEN_IN_DETOKENIZE: `Validation error. Missing 'token' key in records at index %s1. Provide a valid 'token' key.`,
    INVALID_TOKEN_IN_DETOKENIZE: `Validation error. Invalid 'token' key in records at index %s1. Specify a value of type string instead.`,
    RECORDS_KEY_NOT_FOUND_GET: `Validation error. Missing 'records' key. Provide a valid 'records' key.`,
    INVALID_RECORDS_IN_GET: `Validation error. Invalid 'records' key found. Specify a value of type array instead.`,
    EMPTY_RECORDS_GET: `Validation error. 'records' key cannot be empty. Provide a non-empty value instead.`,
    MISSING_IDS_IN_GET: `Validation error. Missing 'ids' key in records at index %s1. Provide a valid 'ids' key.`,
    INVALID_IDS_IN_GET: `Validation error. Invalid 'ids' key found. Specify a value of type array instead.`,
    INVALID_COLUMN_VALUES_IN_GET: `Validation error. Invalid 'columnValues' key found. Specify a value of type array instead.`,
    EMPTY_IDS_IN_GET: `Validation error. 'ids' key cannot be an array of empty strings in records at index %s1. Specify non-empty values instead.`,
    INVALID_SKYFLOWID_TYPE_IN_GET: `Validation error. Invalid 'id' found in 'ids' array in 'records' at index %s1 . Specify a value of type string instead.`,
    MISSING_TABLE_IN_GET: `Validation error. Missing 'table' key in records at index %s1. Provide a valid 'table' key.`,
    INVALID_TABLE_IN_GET: `Validation error. Invalid 'table' key in records at index %s1. Specify a value of type string instead.`,
    MISSING_REDACTION_IN_GET: `Validation error. Missing 'redaction' key in records at index %s1. Provide a valid 'redaction' key.`,
    INVALID_REDACTION_TYPE_IN_GET: `Validation error. Invalid 'redaction' key in records at index %s1. Specify a valid redaction type.`,
    INVALID_TOKENS_IN_GET: `Validation error. Invalid tokens in get options. Specify a boolean value for tokens.`,
    TOKENS_GET_COLUMN_NOT_SUPPORTED: `Validation error. 'columnName' and 'columnValues' cannot be used when 'tokens' are set to true in get options. Either set 'tokens' to false or use 'ids' instead.`,
    REDACTION_WITH_TOKENS_NOT_SUPPORTED: `Get failed. Redaction cannot be applied when 'tokens' are set to true in get options. Either remove redaction or set 'tokens' to false.`,
    INVALID_REDACTION_TYPE_IN_DETOKENIZE: `Validation error. Invalid 'redaction' key in records at index %s1. Specify a valid redaction type.`,
    EMPTY_RECORDS_REVEAL: `Validation error. 'records' key cannot be empty. Provide a non-empty value instead.`,
    MISSING_TOKEN_KEY_REVEAL: `Validation error. Missing 'token' key for reveal element. Specify a valid value for token.`,
    MISSING_SKYFLOWID_KEY_REVEAL: `Validation error. Missing 'skyflowID' key for file render element. Provide a valid 'skyflowID' key.`,
    MISSING_TABLE_KEY_REVEAL: `Validation error.'table' key not found for file render element. Specify a valid value for 'table' key.`,
    MISSING_COLUMN_KEY_REVEAL: `Validation error.'column' key not found for file render element. Specify a valid value for 'column' key.`,
    INVALID_SKYFLOW_ID_REVEAL: `Validation error. Invalid 'skyflowID' key for file render element. Specify a value of type string instead.`,
    INVALID_TABLE_REVEAL: `Validation error. Invalid 'table' key for file render element. Specify a value of type string instead.`,
    INVALID_COLUMN_NAME_REVEAL: `Validation error. Invalid 'column' key for file render element. Specify a value of type string instead.`,
    EMPTY_SKYFLOW_ID_REVEAL: `Validation error. 'skyflowID' key cannot be empty for file render element. Specify a non-empty value instead.`,
    EMPTY_TABLE_REVEAL: `Validation error. 'table' key cannot be empty for file render element. Specify a non-empty value instead.`,
    EMPTY_COLUMN_NAME_REVEAL: `Validation error. 'column' key cannot be empty for file render element. Specify a non-empty value instead.`,
    INVALID_TOKEN_ID_REVEAL: `Validation error. Invalid 'token' key found for reveal element. Specify a value of type string instead.`,
    INVALID_LABEL_REVEAL: `Validation error. Invalid 'label' key found for reveal element. Specify a value of type string instead.`,
    INVALID_ALT_TEXT_REVEAL: `Validation error. Invalid 'altText' key found for reveal element. Specify a value of type string instead.`,
    INVALID_ALT_TEXT_RENDER: `Validation error. Invalid 'altText' key found for reveal element. Specify a value of type string instead.`,
    INVALID_FORMAT_REVEAL: `Validation error. Invalid 'format' key found for reveal element. Specify a value of type string instead.`,
    EMPTY_FORMAT_REVEAL: `Validation error. 'format' key cannot be empty for reveal element. Specify a non-empty value instead.`,
    INVALID_FORMAT_VALUE_REVEAL: `Validation error. Invalid 'format' key found for reveal element. Specify a value of type string instead.`,
    INVALID_REDACTION_TYPE_REVEAL: `Validation error. Invalid 'redaction' key found for reveal element. Specify a valid redaction type.`,
    ELEMENTS_NOT_MOUNTED_REVEAL: `Reveal failed. Make sure to mount all elements before invoking 'reveal' function.`,
    EMPTY_TABLE_IN_ADDITIONAL_FIELDS: `Validation error.'table' field cannot be empty in additionalFields record at index %s1. Specify a non-empty value instead.`,
    EMPTY_FIELDS_IN_ADDITIONAL_FIELDS: `Validation error.'fields' object cannot be empty in additionalFields record at index %s1. Specify a non-empty value instead.`,
    EMPTY_TOKEN_IN_DETOKENIZE: `Validation error. 'token' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    EMPTY_SKYFLOWID_IN_GET: `Validation error. 'id' cannot be empty in 'ids' array in 'records' at index %s1. Specify non-empty values instead.`,
    EMPTY_TABLE_IN_GET: `Validation error. 'table' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    EMPTY_REDACTION_TYPE_IN_GET: `Validation error. 'redaction' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    EMPTY_TOKEN_ID_REVEAL: `Validation error. 'token' key cannot be empty for reveal element. Specify a non-empty value instead.`,
    FETCH_RECORDS_REJECTED: `Detokenize failed. Detokenize request is rejected.`,
    INSERT_RECORDS_REJECTED: `Insert failed. Insert request is rejected.`,
    GET_REJECTED: `Get failed. Get request is rejected.`,
    FAILED_REVEAL: `Reveal failed. Some errors were encountered.`,
    FAILED_RENDER: `Failed to render file. Some errors were encountered.`,
    SKYFLOW_IDS_AND_TOKEN_BOTH_SPECIFIED: `Validation error. skyflowID and token can not be specified together.`,
    MISSING_TABLE_IN_COLLECT: `Validation error.'table' key not found for collect element. Specify a valid value for 'table' key.`,
    EMPTY_TABLE_IN_COLLECT: `Validation error.'table' cannot be empty for collect element. Specify a non-empty value for 'table'.`,
    EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: `Validation error.'id' cannot be empty in addtionalFields record at index %s1. Specify a non-empty value for 'id'.`,
    EMPTY_SKYFLOW_ID_COLLECT: `Validation error.'skyflowID' cannot be empty for collect element. Specify a non-empty value for 'skyflowID'.`,
    INVALID_TABLE_IN_COLLECT: `Validation error. Invalid type for 'table' key value for collect element. Specify a value of type string instead.`,
    INVALID_SKYFLOWID_IN_COLLECT: `Validation error. Invalid type for 'skyflowID' key value for collect element. Specify a value of type string instead.`,
    MISSING_COLUMN_IN_COLLECT: `Validation error. 'column' key not found for collect element. Specify a valid column.`,
    MISSING_SKYFLOWID_IN_COLLECT: `Validation error. 'skyflow_id' key not found for collect element. Specify a valid skyflowID.`,
    EMPTY_COLUMN_IN_COLLECT: `Validation error. 'column' key cannot be empty for collect element. Specify a non-empty value instead.`,
    INVALID_COLUMN_IN_COLLECT: `Validation error. Invalid type for 'column' key for collect element. Specify a value of type string instead.`,
    UNIQUE_ELEMENT_NAME: `Validation error.Element name must be unique: %s1. Please enter a unique element name.`,
    ELEMENTS_NOT_MOUNTED: `Collect failed. Make sure all elements are mounted before calling 'collect' on the container.`,
    DUPLICATE_ELEMENT: `Mount failed.'%s1' appeared multiple times in '%s2'. Make sure each column in a record is unique.`,
    DUPLICATE_ELEMENT_ADDITIONAL_FIELDS: `Mount failed. '%s1' appeared in record index '%s2' in the additional fields. Make sure each column in a record is unique.`,
    MISSING_ELEMENT_TYPE: `Mount failed. Invalid element type. Specify a valid 'type'.`,
    EMPTY_ELEMENT_TYPE: `Mount failed. Invalid element type. Specify a valid 'type'`,
    INVALID_ELEMENT_TYPE: `Mount failed. Invalid element type. Specify a valid 'type'`,
    INVALID_ELEMENT_SELECTOR: `Mount failed. 'div' element not found. Specify a valid 'div'.`,
    CANNOT_CHANGE_ELEMENT: `Element can't be changed.`,
    INVALID_IFRAME: `Error occured while creating an iframe`,
    INVALID_FIELD: 'Invalid Field.',
    FRAME_NOT_FOUND: `Frame %s1 not found. Could not initialise element.`,
    COMPLETE_AND_VALID_INPUTS: `Mount failed. Incomplete inputs for '%s1'. Make sure all inputs are complete and valid.`,
    REQUIRED_PARAMS_NOT_PROVIDED: `Initialisation error. Couldn't find iframe name for element.`,
    INVALID_EVENT_TYPE: `Invalid event type. Specify a valid event type.`,
    INVALID_EVENT_LISTENER: ` Invalid event listener. Please specify a valid event listener.`,
    MISSING_HANDLER_IN_EVENT_LISTENER: `Event handler callback is missing. Provide a valid event handler callback function.`,
    INVALID_HANDLER_IN_EVENT_LISTENER: `Validation error. Invalid type for 'validations' key. Specify a value of type array instead.`,
    UNKNOWN_ERROR: 'Unknown Error.',
    NETWORK_ERROR: `A network error occurred. This could be a CORS issue or a dropped internet connection. It is not possible for us to know. Please reach out to skyflow if you see this error`,
    CONNECTION_ERROR: `Error while initializing the connection.`,
    ERROR_OCCURED: 'Error occurred.',
    INVALID_VALIDATIONS_TYPE: `Validation error. Invalid validations type.`,
    MISSING_VALIDATION_RULE_TYPE: `Validation error. 'type' for validation rule missing in validations array at index %s1. Specify a valid 'type' for each rule in validations array.`,
    INVALID_VALIDATION_RULE_TYPE: 'Validation error. Invalid \'type\' for validation rule found in validations array at index %s1 . Specify a valid rule type for validation rule.',
    MISSING_VALIDATION_RULE_PARAMS: `Validation error. 'params' for validation rule missing in validations array at index %s1. Specify valid 'params' for each rule in validations array.`,
    INVALID_VALIDATION_RULE_PARAMS: `Validation error. Invalid 'params' for validation rule found in validations array at index %s1 . Specify valid params for validation rule.`,
    MISSING_REGEX_IN_REGEX_MATCH_RULE: `Validation error. Missing 'regex' param in validations array at index %s1. Specify a valid value for regex param.`,
    INVALID_REGEX_IN_REGEX_MATCH_RULE: `Validation error. Invalid value for 'regex' param found for regex in validations array at index %s1. Provide a valid value regular expression for regex param.`,
    MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE: `Validation error. Missing both 'min' and 'max' params in validations array at index %s1. Specify either one or both params.`,
    MISSING_ELEMENT_IN_ELEMENT_MATCH_RULE: `Validation error. Missing 'element' param in validations array at index %s1. Specify a valid value for element param. `,
    INVALID_ELEMENT_IN_ELEMENT_MATCH_RULE: `Validation error. Invalid 'element' provided in validations array at index %s1. Specify a value of type collect element instead.`,
    ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE: `Validation error. Element provided in validations array at index %s1 is not mounted. Make sure the element is mounted.`,
    EMPTY_ELEMENT_IN_MOUNT: `mount element with type %s1 - Mount cannot be empty.`,
    VALIDATION_FAILED: 'Validation failed',
    REVEAL_ELEMENT_ERROR_STATE: `Reveal failed. 'setError' is invoked on one or more elements. Make sure to reset any custom errors on all elements before invoking 'reveal' function.`,
    INVALID_FILE_TYPE: `Invalid File Type.`,
    INVALID_FILE_SIZE: `Invalid File Size`,
    NO_FILE_SELECTED: `No File Selected`,
    INVALID_UPSERT_OPTION_TYPE:
      `Validation error. Invalid 'upsert' key in insert options. Specify a value of type array instead`,
    EMPTY_UPSERT_OPTIONS_ARRAY:
      `Validation error. 'upsert' key cannot be an empty array in insert options. Make sure to add atleast one table column object in upsert array.`,
    INVALID_UPSERT_OPTION_OBJECT_TYPE:
      `Validation error. Invalid value in upsert array at index %s1 in insert options. Specify objects with 'table' and 'column' keys instead.`,
    MISSING_TABLE_IN_UPSERT_OPTION:
      `Validation error. Missing 'table' key in upsert array at index %s1. Provide a valid 'table' key.`,
    MISSING_COLUMN_IN_UPSERT_OPTION:
      `Validation error. Missing 'column' key in upsert array at index %s1. Provide a valid 'column' key`,
    INVALID_TABLE_IN_UPSERT_OPTION:
      `Validation error. Invalid 'table' key in upsert array at index %s1. Specify a value of type string instead.`,
    INVALID_COLUMN_IN_UPSERT_OPTION:
      `Validation error. Invalid 'column' key in upsert array at index %s1. Specify a value of type string instead.`,
    INVALID_RECORD_COLUMN_VALUE: `Validation error. Invalid 'column' key. Specify a value of type string instead.`,
    MISSING_RECORD_COLUMN_VALUE: `Validation error. Column Values is required when Column Name is specified.`,
    MISSING_RECORD_COLUMN_NAME: `Validation error. Column Name is required when Column Values are specified.`,
    INVALID_RECORD_COLUMN_VALUE_TYPE: `Validation error. Invalid Type of Records Column Values in records at index %s1`,
    INVALID_COLUMN_VALUES_TYPE: `Validation error. Invalid column values type, should be an Array.`,
    EMPTY_RECORD_COLUMN_VALUES: `Validation error. Record column values cannot be empty in records at index %s1`,
    EMPTY_COLUMN_VALUE: `Validation error. Column Value is empty in records at index %s1`,
    MISSING_IDS_OR_COLUMN_VALUES_IN_GET: `Validation error. Both 'ids' or 'columnValues' keys are missing. Either provide 'ids' or 'columnValues' with 'columnName' to fetch records.`,
    SKYFLOW_IDS_AND_COLUMN_NAME_BOTH_SPECIFIED: `Validation error. ids and columnName can not be specified together.`,
    GET_BY_SKYFLOWID_RESOLVED: '%s1 - GetById request is resolved.',
    RECORDS_KEY_NOT_FOUND_GETBYID: `Validation error. Missing 'records' key. Provide a valid 'records' key.`,
    INVALID_RECORDS_IN_GETBYID: `Validation error. Invalid 'records' key found. Specify a value of type array instead.`,
    EMPTY_RECORDS_GETBYID: `Validation error. 'records' key cannot be empty. Provide a non-empty value instead.`,
    MISSING_IDS_IN_GETBYID: `Validation error. Missing 'ids' key in records at index %s1. Provide a valid 'ids' key.`,
    INVALID_IDS_IN_GETBYID: `Validation error. Invalid 'ids' key in records at index %s1. ids object should be an array.`,
    EMPTY_IDS_IN_GETBYID: `Validation error. 'ids' key cannot be an empty array in records at index %s1. Make sure to provide atleast one id in array.`,
    INVALID_SKYFLOWID_TYPE_IN_GETBYID: `Validation error. Invalid value in ids array in records at index %s1. Specify a value of type string instead.`,
    MISSING_TABLE_IN_GETBYID: `Validation error. Missing 'table' key in records at index %s1. Provide a valid 'table' key.`,
    INVALID_TABLE_IN_GETBYID: `Validation error. Invalid 'table' key in records at index %s1. Specify a value of type string instead.`,
    MISSING_REDACTION_IN_GETBYID: `Validation error. Missing 'redaction' key in records at index %s1. Provide a valid 'redaction' key.`,
    INVALID_REDACTION_TYPE_IN_GETBYID: `Validation error. Invalid 'redaction' key in records at index %s1. Specify a valid redaction type.`,
    EMPTY_SKYFLOWID_IN_GETBYID: `Validation error. 'ids' key cannot be an array of empty strings in records at index %s1. Specify non-empty values instead.`,
    EMPTY_TABLE_IN_GETBYID: `Validation error. 'table' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    EMPTY_REDACTION_TYPE_IN_GETBYID: `Validation error. 'redaction' key cannot be empty in records at index %s1. Specify a non-empty value instead.`,
    GET_BY_SKYFLOWID_REJECTED: `GetById failed. GetById request is rejected.`,
    MISSING_COMPOSABLE_LAYOUT_KEY: `Mount failed. Layout is not specified in composable container options. Specify a valid layout.`,
    EMPTY_COMPOSABLE_LAYOUT_ARRAY: `Mount failed. Layout array is empty in composable container options. Specify a valid layout array.`,
    INVALID_COMPOSABLE_LAYOUT_TYPE: `Mount failed. Invalid layout array values. Make sure all values in the layout array are positive numbers.`,
    NEGATIVE_VALUES_COMPOSABLE_LAYOUT: `Mount failed. layout array should only have positive numbers in composable container options.`,
    MISMATCH_ELEMENT_COUNT_LAYOUT_SUM: `Mount failed. Invalid layout array values. Make sure all values in the layout array are positive numbers.`,
    MISSING_COMPOSABLE_CONTAINER_OPTIONS: `Mount failed. An options object is required for composable containers. Specify a valid options object.`,
    INVALID_COMPOSABLE_CONTAINER_OPTIONS: `Mount failed. Invalid options object. Specify a valid options object.`,
    COMPOSABLE_CONTAINER_NOT_MOUNTED: `Mount elements first. Make sure all elements are mounted before calling 'collect' on the container.`,
    INVALID_BOOLEAN_OPTIONS: `Validation error. Invalid %s1 found in collect options. Specify a value of type boolean instead.`,
    INVALID_INPUT_OPTIONS_FORMAT: `Mount failed. Format must be a non-empty string. Specify a valid format.`,
    INVALID_INPUT_OPTIONS_TRANSLATION: `Mount failed. Translation must be a non-empty object. Specify a valid translation.`,
    EMPTY_COLLECT_CUSTOM_FORMAT: `Mount failed. '%s1' can not be an empty object. Specify a valid object.`,
    INVALID_ALLOWED_OPTIONS: `Validation error. Invalid options, allowedFileType must be of string array type.`,
    EMPTY_ALLOWED_OPTIONS_ARRAY: `Validation error. Invalid options value, allowedFileType array is empty.`,
    INVALID_ALLOWED_FILETYPE_ARRAY: `Validation error. Invalid options value, allowedFileType array must contain only string elements.`,
    INVALID_OPTION_CARD_METADATA: `Validation error. container create - Invalid type, cardMetadata must be of non-empty object type.`,
    INVALID_OPTION_CARD_SCHEME: `Validation error. container create - Invalid options, scheme must be of string array type.`,
  },
  warnLogs: {
    INVALID_EXPIRATION_DATE_FORMAT: 'EXPIRATION_DATE format must be in one of %s1, the format is set to default MM/YY',
    INVALID_EXPIRATION_YEAR_FORMAT: 'EXPIRATION_YEAR format must be in one of %s1, the format is set to default YY',
    UNABLE_TO_SET_VALUE_IN_PROD_ENV: '%s1 setValue() cannot invoked while in PROD env. It is Not Recommeded',
    UNABLE_TO_CLEAR_VALUE_IN_PROD_ENV: '%s1 clearValue() cannot invoked while in PROD env. It is Not Recommeded',
    COLLECT_ALT_TEXT_DEPERECATED: 'altText is DEPERECATED, passing altText will not have any effect',
    GET_BY_ID_DEPRECATED: 'getById is deprecated, use new get method',
    INPUT_FORMATTING_NOT_SUPPROTED: 'format or translation are not supported on %s1 element type.',
    INVALID_INPUT_TRANSLATION: 'invalid or unsupported translation provided for %s1 element type.',

  },
};

export default logs;
