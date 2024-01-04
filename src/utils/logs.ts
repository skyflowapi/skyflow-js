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
    IFRAMEFORM_CONSTRUCTOR_FRAME_READY_LISTNER: '%s1 - In IFrameForm constructor, Adding listner for FRAME_READY event',
    IFRAMEFORM_CONSTRUCTOR_TOKENIZATION_LISTNER: '%s1 - In IFrameForm constructor, Adding listner for TOKENIZATION_REQUEST event',
    CURRENT_ENV: '%s1 - Client Env is %s2',
    CURRENT_LOG_LEVEL: '%s1 - Client LogLevel is %s2',
    VALIDATE_GET_BY_ID_INPUT: '%s1 - Validating getByID input.',
  },
  errorLogs: {
    INVALID_FILE_NAMES: 'Invalid File Name. Only alphanumeric characters and !-_.*() are allowed.',
    INVALID_FILE_NAME: 'Interface: collect element - Invalid File Name. Only alphanumeric characters and !-_.*() are allowed.',
    CLIENT_CONNECTION: 'Interface: collect container - client connection not established. client info has not reached iframes',
    INVALID_BEARER_TOKEN: 'Interface: init - Invalid token is generated from getBearerToken callback',
    BEARER_TOKEN_REJECTED: 'Interface: init - GetBearerToken promise got rejected.',
    VAULTID_IS_REQUIRED: 'Interface: init - Invalid client credentials. vaultID is required.',
    EMPTY_VAULTID_IN_INIT: 'Interface: init - Invalid client credentials. vaultID cannot be empty.',
    VAULTURL_IS_REQUIRED: 'Interface: init - Invalid client credentials. vaultURL is required.',
    EMPTY_VAULTURL_IN_INIT: 'Interface: init - Invalid client credentials. vaultURL cannot be empty.',
    INVALID_VAULTURL_IN_INIT: 'Interface: init - Invalid client credentials. Expecting https://XYZ for vaultURL',
    GET_BEARER_TOKEN_IS_REQUIRED: 'Interface: init - Invalid client credentials. getBearerToken is required.',
    EMPTY_CONTAINER_TYPE: 'Interface: client {containerType} container - Invalid container type. Container object cannot be empty.',
    INVALID_CONTAINER_TYPE: 'Interface: client  {containerType}  container - Invalid container type. Invalid container object.',

    INVALID_COLLECT_VALUE: 'Invalid value',
    INVALID_COLLECT_VALUE_WITH_LABEL: 'Invalid %s1',
    REQUIRED_COLLECT_VALUE: '%s1 is required',
    DEFAULT_REQUIRED_COLLECT_VALUE: 'Field is required',

    RECORDS_KEY_NOT_FOUND: 'Interface: client insert - records object is required.',
    INVALID_RECORDS_IN_INSERT: 'Interface: client insert - Invalid records. records object should be an array.',
    EMPTY_RECORDS_IN_INSERT: 'Interface: client insert - records array cannot be empty.',
    MISSING_TABLE_IN_INSERT: 'Interface: client insert - "table" key is required in records array at index %s1',
    EMPTY_TABLE_IN_INSERT: 'Interface: client insert - table cannot be empty in records array at index %s1',
    INVALID_TABLE_IN_INSERT: 'Interface: client insert - table of type string is required at index %s1 in records array.',
    EMPTY_FIELDS_IN_INSERT: 'Interface: client insert - fields cannot be empty in records array at index %s1',
    MISSING_FIELDS_IN_INSERT: 'Interface: client insert - "fields" key is required in records array at index %s1',
    INVALID_FIELDS_IN_INSERT: 'Interface: client insert - fields of type object is required at index %s1 in records array.',
    INVALID_TOKENS_IN_INSERT: 'Interface: client insert - Invalid tokens in options. tokens of type boolean is required.',
    RECORDS_KEY_NOT_FOUND_DELETE: 'Interface: client delete - records object is required.',
    INVALID_RECORDS_IN_DELETE: 'Interface: client delete - Invalid records. records object should be an array.',
    EMPTY_RECORDS_IN_DELETE: 'Interface: client delete - records array cannot be empty.',
    MISSING_TABLE_IN_DELETE: 'Interface: client delete - "table" key is required in records array at index %s1',
    EMPTY_TABLE_IN_DELETE: 'Interface: client delete - table cannot be empty in records array at index %s1',
    INVALID_TABLE_IN_DELETE: 'Interface: client delete - table of type string is required at index %s1 in records array.',
    MISSING_ID_IN_DELETE: 'Interface: client delete - "id" key is required in records array at index %s1',
    EMPTY_ID_IN_DELETE: 'Interface: client delete - id cannot be empty in records array at index %s1',
    INVALID_ID_IN_DELETE: 'Interface: client delete - id of type string is required at index %s1 in records array.',
    DELETE_RECORDS_REJECTED: 'Interface: client delete - delete request is rejected.',
    INVALID_TOKENS_IN_COLLECT: 'Interface: collect container - Invalid tokens. tokens of type boolean is required.',
    RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS: 'Interface: collect container - "records" key not found in additionalFields',
    INVALID_RECORDS_IN_ADDITIONAL_FIELDS: 'Interface: collect container - records should be an array inside additionalFields',
    EMPTY_RECORDS_IN_ADDITIONAL_FIELDS: 'Interface: collect container - records object cannot be empty in additionalFields',
    MISSING_TABLE_IN_ADDITIONAL_FIELDS: 'Interface: collect container - "table" key not found in additionalFields records at index %s1',
    INVALID_TABLE_IN_ADDITIONAL_FIELDS: 'Interface: collect container - Provide valid table name in additionalFields records at index %s1',
    INVALID_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: 'Interface: collect container - Provide valid skyflow id in additionalFields records at index %s1',
    MISSING_FIELDS_IN_ADDITIONAL_FIELDS: 'Interface: collect container - "fields" key not found in additionalFields records at index %s1',
    INVALID_FIELDS_IN_ADDITIONAL_FIELDS: 'Interface: collect container - Provide valid fields in additionalFields records at index %s1',
    RECORDS_KEY_NOT_FOUND_DETOKENIZE: 'Interface: client detokenize - records object is required.',
    EMPTY_RECORDS_DETOKENIZE: 'Interface: client detokenize - records array cannot be empty.',
    INVALID_RECORDS_IN_DETOKENIZE: 'Interface: client detokenize - Invalid records. records object should be an array.',
    MISSING_TOKEN_IN_DETOKENIZE: 'Interface: client detokenize -  "token" key is required in records array at index %s1 ',
    INVALID_TOKEN_IN_DETOKENIZE: 'Interface: client detokenize - Invalid token. token of type string is required at index %s1 in records array.',
    RECORDS_KEY_NOT_FOUND_GET: 'Interface: client get - records object is required.',
    INVALID_RECORDS_IN_GET: 'Interface: client get - Invalid records. records object should be an array.',
    EMPTY_RECORDS_GET: 'Interface: client get - records array cannot be empty.',
    MISSING_IDS_IN_GET: 'Interface: client get - "ids" key is required in records array at index %s1',
    INVALID_IDS_IN_GET: 'Interface: client get - Invalid ids. ids object should be an array.',
    INVALID_COLUMN_VALUES_IN_GET: 'Interface: client get - Invalid column values. column values object should be an array.',
    EMPTY_IDS_IN_GET: 'Interface: client get - ids array cannot be empty at index %s1',
    INVALID_SKYFLOWID_TYPE_IN_GET: 'Interface: client get - Invalid skyflowId in ids array at index %s1',
    MISSING_TABLE_IN_GET: 'Interface: client get - "table" key is required in records array at index %s1',
    INVALID_TABLE_IN_GET: 'Interface: client get - table of type string is required at index %s1 in records array.',
    MISSING_REDACTION_IN_GET: 'Interface: client get - "redaction" key is required in records array at index %s1',
    INVALID_REDACTION_TYPE_IN_GET: 'Interface: client get - Invalid redaction type in records array at index %s1',
    INVALID_TOKENS_IN_GET: 'Interface: client get - Invalid tokens in options. tokens of type boolean is required.',
    TOKENS_GET_COLUMN_NOT_SUPPORTED: 'Interface: client get - column_name or column_values cannot be used with tokens in options.',
    REDACTION_WITH_TOKENS_NOT_SUPPORTED: 'Interface: client get - redaction cannot be used when tokens are true in options.',
    INVALID_REDACTION_TYPE_IN_DETOKENIZE: 'Interface: client get - Invalid redaction type in records array at index %s1',
    EMPTY_RECORDS_REVEAL: 'Interface: reveal container - cannot invoke reveal method before creating reveal elements',
    MISSING_TOKEN_KEY_REVEAL: 'Interface: RevealElement - token key is required ',
    MISSING_SKYFLOWID_KEY_REVEAL: 'Interface: FileRenderElement - skyflowID key is required ',
    MISSING_TABLE_KEY_REVEAL: 'Interface: FileRenderElement - table key is required ',
    MISSING_COLUMN_KEY_REVEAL: 'Interface: FileRenderElement - column key is required ',
    INVALID_SKYFLOW_ID_REVEAL: 'Interface: FileRenderElement - skyflowID is invalid. skyflowID of type string is required',
    INVALID_TABLE_REVEAL: 'Interface: FileRenderElement - table is invalid. table of type string is required',
    INVALID_COLUMN_NAME_REVEAL: 'Interface: FileRenderElement - column name is invalid. column of type string is required',
    EMPTY_SKYFLOW_ID_REVEAL: 'Interface: FileRenderElement - skyflowID is empty.',
    EMPTY_TABLE_REVEAL: 'Interface: FileRenderElement - table is empty.',
    EMPTY_COLUMN_NAME_REVEAL: 'Interface: FIleRenderElement - column is empty.',
    INVALID_TOKEN_ID_REVEAL: 'Interface: RevealElement - token is invalid. token of type string is required',
    INVALID_LABEL_REVEAL: 'Interface: RevealElement - label is invalid.',
    INVALID_ALT_TEXT_REVEAL: 'Interface: RevealElement - Invalid altText.',
    INVALID_ALT_TEXT_RENDER: 'Interface: RevealElement - Invalid altText.',
    INVALID_FORMAT_REVEAL: 'Interface: RevealElement - Invalid format type.',
    EMPTY_FORMAT_REVEAL: 'Interface: RevealElement - Empty format value provided.',
    INVALID_FORMAT_VALUE_REVEAL: 'Interface: RevealElement - Invalid format value provided.',
    INVALID_REDACTION_TYPE_REVEAL: 'Interface: RevealElement - Invalid Redaction type.',
    ELEMENTS_NOT_MOUNTED_REVEAL: 'Interface: reveal container - Cannot invoke reveal before mounting the elements',
    ELEMENT_NOT_MOUNTED_RENDER: 'Interface: render container - Cannot invoke renderFile before mounting the elements',
    EMPTY_TABLE_IN_ADDITIONAL_FIELDS: 'Interface: collect container - table cannot be empty in additionalFields at index %s1',
    EMPTY_FIELDS_IN_ADDITIONAL_FIELDS: 'Interface: collect container - fields cannot be empty in additionalFields at index %s1',
    EMPTY_TOKEN_IN_DETOKENIZE: 'Interface: client detokenize - token cannot be empty in records array at index %s1',
    EMPTY_SKYFLOWID_IN_GET: 'Interface: client get - id cannot be empty in records array at index %s1',
    EMPTY_TABLE_IN_GET: 'Interface: client get - table cannot be empty in records array at index %s1',
    EMPTY_REDACTION_TYPE_IN_GET: 'Interface: client get - redaction cannot be empty in records array at index %s1',
    EMPTY_TOKEN_ID_REVEAL: 'Interface: RevealElement - token cannot be empty',
    FETCH_RECORDS_REJECTED: 'Interface: client detokenize - detokenize request is rejected.',
    INSERT_RECORDS_REJECTED: 'Interface: client insert - insert request is rejected.',
    GET_REJECTED: 'Interface: client get - get request is rejected.',
    FAILED_REVEAL: 'Interface: reveal container - Failed to reveal data',
    FAILED_RENDER: 'Interface: reveal container - Failed to render file',
    SKYFLOW_IDS_AND_TOKEN_BOTH_SPECIFIED: 'Interface: FileRenderElement: skyflowID and token can not be specified together.',
    MISSING_TABLE_IN_COLLECT: 'Interface: collect element - "table" key is required.',
    EMPTY_TABLE_IN_COLLECT: 'Interface: collect element - table cannot be empty.',
    EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS: 'Interface: collect element - id cannot be empty.',
    INVALID_TABLE_IN_COLLECT: 'Interface: collect element - Invalid table. table of type string is required',
    INVALID_SKYFLOWID_IN_COLLECT: 'Interface: collect element - Invalid id. id of type string is required',
    MISSING_COLUMN_IN_COLLECT: 'Interface: collect element - "column" key is required.',
    MISSING_SKYFLOWID_IN_COLLECT: 'Interface: collect element - "skyflowID" key is required in file type element',
    EMPTY_COLUMN_IN_COLLECT: 'Interface: collect element - column cannot be empty.',
    INVALID_COLUMN_IN_COLLECT: 'Interface: collect element - Invalid column. column of type string is required',
    UNIQUE_ELEMENT_NAME: 'The element name has to be unique: %s1',
    ELEMENTS_NOT_MOUNTED: 'Interface: collect container - Elements should be mounted before invoking collect',
    DUPLICATE_ELEMENT: 'Interface: collect container - Duplicate column %s1 found in %s2.',
    DUPLICATE_ELEMENT_ADDITIONAL_FIELDS: 'Interface: collect container - Duplicate column %s1 found in %s2 in additional fields',
    MISSING_ELEMENT_TYPE: 'Interface:container element with type {TYPE} - Invalid element type. "type" key is required.',
    EMPTY_ELEMENT_TYPE: 'Interface:container element with type {TYPE} - Invalid element type. type cannot be empty.',
    INVALID_ELEMENT_TYPE: 'Interface:container element with type {TYPE} - invalid element type. type not found',
    INVALID_ELEMENT_SELECTOR: 'Interface: container element with type {TYPE} - Div cannot be found.',
    CANNOT_CHANGE_ELEMENT: "Element can't be changed.",
    INVALID_IFRAME: 'Error occured while creating an iframe',
    INVALID_FIELD: 'Invalid Field.',
    FRAME_NOT_FOUND: 'Interface: collect element - %s1 frame not found:',
    COMPLETE_AND_VALID_INPUTS: 'Interface: collect container - Provide complete and valid inputs for %s1',
    REQUIRED_PARAMS_NOT_PROVIDED: 'Interface: collect element - Required params are not provided.',
    INVALID_EVENT_TYPE: 'Interface: collect element - Provide a valid event type.',
    INVALID_EVENT_LISTENER: 'Interface: "on" on CollectElement - Provide valid event listener.',
    MISSING_HANDLER_IN_EVENT_LISTENER: 'Interface: "on" on CollectElement - Second argument is missing. handler cannot be empty.',
    INVALID_HANDLER_IN_EVENT_LISTENER: 'Interface: "on" on CollectElement - Invalid handler. handler should be of type function.',
    UNKNOWN_ERROR: 'Unknown Error.',
    NETWORK_ERROR: 'A network error occurred. This could be a CORS issue or a dropped internet connection. It is not possible for us to know. Please reach out to skyflow if you see this error',
    CONNECTION_ERROR: 'Error while initializing the connection.',
    ERROR_OCCURED: 'Error occurred.',
    INVALID_VALIDATIONS_TYPE: 'Interface: collect element - Invalid validations type.',
    MISSING_VALIDATION_RULE_TYPE: 'Interface: collect element - Type is missing in validationRule at index %s1 in validations array',
    INVALID_VALIDATION_RULE_TYPE: 'Interface: collect element - Invalid ValidationRuleType at index %s1 in validations array',
    MISSING_VALIDATION_RULE_PARAMS: 'Interface: collect element - params are missing in validationRule at index %s1 in validations array',
    INVALID_VALIDATION_RULE_PARAMS: 'Interface: collect element - Invalid ValidationRule params at index %s1 in validations array',
    MISSING_REGEX_IN_REGEX_MATCH_RULE: 'Interface: collect element - Missing regex in ValidationRule params at index %s1 in validations array',
    INVALID_REGEX_IN_REGEX_MATCH_RULE: 'Interface: collect element - Invalid regex in ValidationRule params at index %s1 in validations array',
    MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE: 'Interface: collect element - Either min or max is required in ValidationRule params at index %s1 in validations array',
    MISSING_ELEMENT_IN_ELEMENT_MATCH_RULE: 'Interface: collect element - Missing element in ValidationRule params at index %s1 in validations array',
    INVALID_ELEMENT_IN_ELEMENT_MATCH_RULE: 'Interface: collect element - Invalid collect element in ValidationRule params at index %s1 in validations array',
    ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE: 'Interface: collect element - collect element is not mounted in ValidationRule params at index %s1 in validations array',
    EMPTY_ELEMENT_IN_MOUNT: 'Interface: mount element with type %s1 - Mount cannot be empty.',
    VALIDATION_FAILED: 'Validation failed',
    REVEAL_ELEMENT_ERROR_STATE: 'unable to reveal, since one or more element(s) have setError',
    INVALID_FILE_TYPE: 'Interface: collect element - Invalid File Type',
    INVALID_FILE_SIZE: 'Interface: collect element - Invalid File Size',
    NO_FILE_SELECTED: 'Interface: collect element - No File Selected',
    INVALID_UPSERT_OPTION_TYPE:
      'Invalid upsert option, should be an array',
    EMPTY_UPSERT_OPTIONS_ARRAY:
      'upsert option cannot be an empty array, atleast one object of table and column is required.',
    INVALID_UPSERT_OPTION_OBJECT_TYPE:
      'Invalid upsert object at index %s1, an object of table and column is required.',
    MISSING_TABLE_IN_UPSERT_OPTION:
      '"table" key is required in upsert options object at index %s1',
    MISSING_COLUMN_IN_UPSERT_OPTION:
      '"column" key is required in upsert option at index %s1',
    INVALID_TABLE_IN_UPSERT_OPTION:
      'Invalid table in upsert object at index %s1, table of type non empty string is required',
    INVALID_COLUMN_IN_UPSERT_OPTION:
      'Invalid column in upsert object at index %s1, column of type non empty string is required',
    INVALID_RECORD_COLUMN_VALUE: 'Invalid Record Column value.',
    MISSING_RECORD_COLUMN_VALUE: 'Column Values is required when Column Name is specified.',
    MISSING_RECORD_COLUMN_NAME: 'Column Name is required when Column Values are specified.',
    INVALID_RECORD_COLUMN_VALUE_TYPE: 'Invalid Type of Records Column Values.',
    INVALID_COLUMN_VALUES_TYPE: 'Invalid column values type, should be an Array.',
    EMPTY_RECORD_COLUMN_VALUES: 'Record column values cannot be empty.',
    EMPTY_COLUMN_VALUE: 'Column Value is empty.',
    MISSING_IDS_OR_COLUMN_VALUES_IN_GET: 'Interface: client get - "ids" key  or "columnValues" key is missing.',
    SKYFLOW_IDS_AND_COLUMN_NAME_BOTH_SPECIFIED: 'ids and columnName can not be specified together.',
    GET_BY_SKYFLOWID_RESOLVED: '%s1 - GetById request is resolved.',
    RECORDS_KEY_NOT_FOUND_GETBYID: 'Interface: client getById - records object is required.',
    INVALID_RECORDS_IN_GETBYID: 'Interface: client getById - Invalid records. records object should be an array.',
    EMPTY_RECORDS_GETBYID: 'Interface: client getById - records array cannot be empty.',
    MISSING_IDS_IN_GETBYID: 'Interface: client getById - "ids" key is required in records array at index %s1',
    INVALID_IDS_IN_GETBYID: 'Interface: client getById - Invalid ids. ids object should be an array.',
    EMPTY_IDS_IN_GETBYID: 'Interface: client getById - ids array cannot be empty at index %s1',
    INVALID_SKYFLOWID_TYPE_IN_GETBYID: 'Interface: client getById - Invalid skyflowId in ids array at index %s1',
    MISSING_TABLE_IN_GETBYID: 'Interface: client getById - "table" key is required in records array at index %s1',
    INVALID_TABLE_IN_GETBYID: 'Interface: client getById - table of type string is required at index %s1 in records array.',
    MISSING_REDACTION_IN_GETBYID: 'Interface: client getById - "redaction" key is required in records array at index %s1',
    INVALID_REDACTION_TYPE_IN_GETBYID: 'Interface: client getById - Invalid redaction type in records array at index %s1',
    EMPTY_SKYFLOWID_IN_GETBYID: 'Interface: client getById - id cannot be empty in records array at index %s1',
    EMPTY_TABLE_IN_GETBYID: 'Interface: client getById - table cannot be empty in records array at index %s1',
    EMPTY_REDACTION_TYPE_IN_GETBYID: 'Interface: client getById - redaction cannot be empty in records array at index %s1',
    GET_BY_SKYFLOWID_REJECTED: 'Interface: client getById - getById request is rejected.',

    MISSING_COMPOSABLE_LAYOUT_KEY: 'Interface: client container - layout is required in composable container options.',
    EMPTY_COMPOSABLE_LAYOUT_ARRAY: 'Interface: client container - layout array cannot be empty in composable container options.',
    INVALID_COMPOSABLE_LAYOUT_TYPE: 'Interface: client container - invalid layout value, layout should be of type array of numbers in composable container options.',
    NEGATIVE_VALUES_COMPOSABLE_LAYOUT: 'Interface: client container - layout array should only have postive numbers in composable container options.',
    MISMATCH_ELEMENT_COUNT_LAYOUT_SUM: 'Interface: composable container mount - created elements count should be equal to sum of layout values.',
    MISSING_COMPOSABLE_CONTAINER_OPTIONS: 'Interface: client composable container - options object is required for composable container.',
    INVALID_COMPOSABLE_CONTAINER_OPTIONS: 'Interface: client composable container - invalid options value, should be an object type.',
    COMPOSABLE_CONTAINER_NOT_MOUNTED: 'Interface: composable collect - container should be mounted before invoking collect.',
    INVALID_BOOLEAN_OPTIONS: 'Interface: container create - Invaild %s1 in options, %s1 of type boolean is required.',

    INVALID_INPUT_OPTIONS_FORMAT: 'Interface: container create - Invalid type, format must be of non-empty string type.',
    INVALID_INPUT_OPTIONS_TRANSLATION: 'Interface: container create - Invalid type, translation must be of non-empty object type.',
    EMPTY_COLLECT_CUSTOM_FORMAT: 'Interface: container create - %s1 cannot be empty object.',
    INVALID_ALLOWED_OPTIONS: 'Interface: collect element - Invalid options, allowedFileType must be of string array type.',
    EMPTY_ALLOWED_OPTIONS_ARRAY: 'Interface: collect element - Invalid options value, allowedFileType array is empty.',
    INVALID_ALLOWED_FILETYPE_ARRAY: 'Interface: collect element - Invalid options value, allowedFileType array must contain only string elements.',
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
