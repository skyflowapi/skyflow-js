const logs = {
  infoLogs: {
    INITIALIZE_CLIENT: 'Initializing skyflow client.',
    CLIENT_INITIALIZED: 'Initialized skyflow client successfully.',

    CREATE_COLLECT_CONTAINER: 'Creating Collect container.',
    COLLECT_CONTAINER_CREATED: 'Created Collect container successfully.',

    CREATE_REVEAL_CONTAINER: 'Creating Reveal container.',
    REVEAL_CONTAINER_CREATED: 'Created Reveal container successfully.',

    VALIDATE_RECORDS: 'Validating insert records.',
    VALIDATE_DETOKENIZE_INPUT: 'Validating detokenize input.',
    VALIDATE_GET_BY_ID_INPUT: 'Validating getByID input.',
    VALIDATE_GATEWAY_CONFIG: 'Validating gateway config.',
    VALIDATE_COLLECT_RECORDS: 'Validating collect element input.',
    VALIDATE_REVEAL_RECORDS: 'Validating reveal element input.',

    CREATED_ELEMENT: 'Created %s1 element.',
    ELEMENT_MOUNTED: '%s1 Element mounted.',
    ELEMENT_REVEALED: '%s1 Element revealed.',

    COLLECT_SUBMIT_SUCCESS: 'Data has been collected successfully.',
    REVEAL_SUBMIT_SUCCESS: 'Data has been revealed successfully.',
    INSERT_DATA_SUCCESS: 'Data has been inserted successfully.',
    DETOKENIZE_SUCCESS: 'Data has been revealed successfully.',
    GET_BY_ID_SUCCESS: 'Data has been revealed successfully.',

    BEARER_TOKEN_LISTENER: 'Get bearer token listener added.',
    CAPTURED_BEARER_TOKEN_EVENT: 'Captured bearer token event.',
    BEARER_TOKEN_RESOLVED: 'GetBearerToken promise resolved successfully.',
    REUSE_BEARER_TOKEN: 'Reusing the bearer token.',

    PUREJS_CONTROLLER_INITIALIZED: 'SkyflowController initialized.',
    PUREJS_LISTENER_READY: 'Purejs listener ready.',
    EMIT_PURE_JS_CONTROLLER: 'Emitted Skyflow controller event.',

    INSERT_TRIGGERED: 'Insert method triggered.',
    DETOKENIZE_TRIGGERED: 'Detokenize method triggered.',
    GET_BY_ID_TRIGGERED: 'Get by ID triggered.',
    INVOKE_GATEWAY_TRIGGERED: 'Invoke gateway triggered.',

    EMIT_PURE_JS_REQUEST: 'Emitted %s1 request.',
    CAPTURE_PURE_JS_REQUEST: 'Captured %s1 event.',
    LISTEN_PURE_JS_REQUEST: 'Listening to %s1 event',

    CAPTURE_PUREJS_FRAME: 'Captured SkyflowController frame ready event.',

    FETCH_RECORDS_RESOLVED: 'Detokenize request is resolved.',

    INSERT_RECORDS_RESOLVED: 'Insert request is resolved.',

    GET_BY_SKYFLOWID_RESOLVED: 'GetById request is resolved.',

    SEND_INVOKE_GATEWAY_RESOLVED: 'Invoke gateway request resolved.',

    EMIT_EVENT: '%s1 event emitted.',
    CAPTURE_EVENT: 'Captured event %s1.',
  },
  errorLogs: {
    CLIENT_CONNECTION: 'client connection not established.',

    BEARER_TOKEN_REJECTED: 'GetBearerToken promise got rejected.',
    INVALID_BEARER_TOKEN: 'Bearer token is invalid or expired.',

    INVALID_VAULT_ID: 'Vault Id is invalid or cannot be found.',
    EMPTY_VAULT_ID: 'VaultID is empty.',

    INVALID_CREDENTIALS: 'Invalid client credentials.',

    INVALID_CONTAINER_TYPE: 'Invalid container type.',

    INVALID_COLLECT_VALUE: 'Invalid value',
    INVALID_COLLECT_VALUE_WITH_LABEL: 'Invalid %s1',

    RECORDS_KEY_NOT_FOUND: 'records object key value not found.',
    EMPTY_RECORDS: 'records object is empty.',
    RECORDS_KEY_ERROR: 'Key “records” is missing or payload is incorrectly formatted.',
    MISSING_RECORDS: 'Missing records property.',
    INVALID_RECORDS: 'Invalid Records.',
    EMPTY_RECORD_IDS: 'Record ids cannot be Empty.',
    INVALID_RECORD_ID_TYPE: 'Invalid Type of Records Id.',
    INVALID_RECORD_LABEL: 'Invalid Record Label Type.',
    INVALID_RECORD_ALT_TEXT: 'Invalid Record altText Type.',

    FETCH_RECORDS_REJECTED: 'Detokenize request is rejected.',
    INSERT_RECORDS_REJECTED: 'Insert request is rejected.',
    GET_BY_SKYFLOWID_REJECTED: 'GetById request is rejected.',
    SEND_INVOKE_GATEWAY_REJECTED: 'Invoke gateway request rejected.',

    FAILED_REVEAL: 'Failed to reveal data',

    INVALID_TABLE_NAME: 'Table Name passed doesn’t exist in the vault with id.',
    EMPTY_TABLE_NAME: 'Table Name is empty.',
    EMPTY_TABLE_AND_FIELDS:
        'table or fields parameter cannot be passed as empty at index %s1 in records array.',
    EMPTY_TABLE: "Table can't be passed as empty at index %s1 in records array.",
    TABLE_KEY_ERROR: 'Key “table” is missing or payload is incorrectly formatted.',
    FIELDS_KEY_ERROR: 'Key “fields” is missing or payload is incorrectly formatted.',
    INVALID_TABLE_OR_COLUMN: 'Invalid table or column.',
    INVALID_COLUMN_NAME: 'Column with given name is not present in the table in vault.',
    EMPTY_COLUMN_NAME: 'Column name is empty.',
    MISSING_TABLE: 'Missing Table Property.',
    INVALID_RECORD_TABLE_VALUE: 'Invalid Record Table value.',

    INVALID_TOKEN_ID: 'Token provided is invalid.',
    INVALID_TOKEN_ID_WITH_ID: 'Token %s1 provided is invalid',
    EMPTY_TOKEN_ID: 'Token is empty.',
    ID_KEY_ERROR: "Key 'token' is missing in the payload provided.",
    MISSING_TOKEN: 'Missing token property.',
    MISSING_TOKEN_KEY: 'token key is Missing.',
    ELEMENT_MUST_HAVE_TOKEN: 'Element must have token.',

    REDACTION_KEY_ERROR: 'Key “redaction” is missing or payload is incorrectly formatted.',
    INVALID_REDACTION_TYPE: 'Redaction type value isn’t one of: “PLAIN_TEXT”, “REDACTED” ,“DEFAULT” or “MASKED”.',
    MISSING_REDACTION: 'Missing Redaction property.',
    MISSING_REDACTION_VALUE: 'Missing redaction value.',

    UNIQUE_ELEMENT_NAME: 'The element name has to unique: %s1',
    ELEMENT_NOT_MOUNTED: 'Element Not Mounted.',
    ELEMENTS_NOT_MOUNTED: 'Elements Not Mounted.',
    MISSING_IDS: 'Missing ids property.',
    DUPLICATE_ELEMENT: 'Duplicate column %s1 found in %s2.',
    INVALID_ELEMENT_TYPE: 'Provide valid element type.',
    INVALID_ELEMENT_SELECTOR:
            'Provided element selector is not valid or not found.',
    CANNOT_CHANGE_ELEMENT: "Element can't be changed.",

    MISSING_GATEWAY_URL: 'gateway URL Key is Missing.',
    INVALID_GATEWAY_URL_TYPE: 'Invalid gateway URL type.',
    INVALID_GATEWAY_URL: 'Invalid gateway URL.',

    MISSING_METHODNAME_KEY: 'methodName Key is Missing.',
    INVALID_METHODNAME_VALUE: 'Invalid methodName value.',
    INVALID_IFRAME: 'Expecting a valid Iframe.',
    INVALID_FIELD: 'Invalid Field.',
    FRAME_NOT_FOUND: '%s1 frame not found:',
    COMPLETE_AND_VALID_INPUTS: '%s1 Provide complete and valid inputs.',
    REQUIRED_PARAMS_NOT_PROVIDED: 'Required params are not provided.',
    INVALID_EVENT_TYPE: 'Provide a valid event type.',
    INVALID_EVENT_LISTENER: 'Provide valid event listener.',
    UNKNOWN_ERROR: 'Unknown Error.',
    TRANSACTION_ERROR: 'An error occurred during transaction.',
    CONNECTION_ERROR: 'Error while initializing the connection.',
    ERROR_OCCURED: 'Error occurred.',
    RESPONSE_BODY_KEY_MISSING: '%s1 is missing in the response.',
  },
};

export default logs;
