// Mock Client so internal FrameElementInit imports use a controllable request fn.
jest.mock('../../../src/client', () => {
  const mockClientRequest = jest.fn().mockResolvedValue({ upload: 'ok' });
  class Client {
    constructor(config, meta) {
      this.config = config;
      this.meta = meta;
      this.request = mockClientRequest;
    }
    static fromJSON(json) {
      return new Client(json.config || json, {});
    }
    toJSON() { return { config: this.config, metaData: this.meta }; }
  }
  return { __esModule: true, default: Client, mockClientRequest };
});
// Mock collect helpers BEFORE importing FrameElementInit so internal references use mocks
jest.mock('../../../src/core-utils/collect', () => {
  const constructElementsInsertReq = jest.fn((insertObj, updateObj) => [
    { insertRecords: insertObj },
    { updateRecords: Object.entries(updateObj).map(([skyflowID, record]) => ({ skyflowID, ...record })) },
  ]);
  const constructInsertRecordRequest = jest.fn((finalInsertRecords) => {
    if (finalInsertRecords && typeof finalInsertRecords === 'object' && !Array.isArray(finalInsertRecords)) {
      return Object.entries(finalInsertRecords).map(([table, fields]) => ({ table, fields }));
    }
    return finalInsertRecords || [];
  });
  const insertDataInCollect = jest.fn(() => Promise.resolve({ records: [{ id: 'insert1' }] }));
  const updateRecordsBySkyflowIDComposable = jest.fn(() => Promise.resolve({ records: [{ id: 'update1' }] }));
  return {
    __esModule: true,
    constructElementsInsertReq,
    constructInsertRecordRequest,
    insertDataInCollect,
    updateRecordsBySkyflowIDComposable,
  };
});
import FrameElementInit from '../../../src/core/internal/frame-element-init';
import SkyflowError from '../../../src/libs/skyflow-error';
import { ELEMENTS } from '../../../src/core/constants';
import * as helpers from '../../../src/utils/helpers';
import Client, { mockClientRequest } from '../../../src/client';
import { ELEMENT_EVENTS_TO_IFRAME, COLLECT_TYPES } from '../../../src/core/constants';
import {
  constructElementsInsertReq,
  constructInsertRecordRequest,
  insertDataInCollect,
  updateRecordsBySkyflowIDComposable,
} from '../../../src/core-utils/collect';
// Mock element-options to bypass complex row merging logic that expects prior group structure
jest.mock('../../../src/libs/element-options', () => ({
  validateAndSetupGroupOptions: (oldGroup, newGroup) => newGroup || oldGroup || { rows: [] },
  getValueAndItsUnit: (v) => [v || ''],
}));

// Utility to create a mock File (JSDOM supports File)
const makeFile = (name = 'test.txt', size = 10, type = 'text/plain') => {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
};

// Minimal stub for an iframe form element expected by FrameElementInit internals
const makeFileElement = ({ multiple = false, files, name = 'upload', tableName = 'files_table', preserveFileName = true }) => {
  const value = multiple ? files : files[0];
  return {
    state: {
      value,
      name,
      isRequired: false,
    },
    tableName,
    onFocusChange: jest.fn(),
    preserveFileName,
    fieldType: multiple ? ELEMENTS.MULTI_FILE_INPUT.name : ELEMENTS.FILE_INPUT.name,
    iFrameName: `element:${multiple ? 'MULTI' : 'SINGLE'}_FILE_INPUT:123`,
  };
};

// Stub non-file input element for tokenize tests
const makeTextElement = ({ name = 'field1', tableName = 'patients', value = 'abc', isValid = true, isComplete = true, skyflowID } = {}) => ({
  state: {
    name,
    value,
    isValid,
    isComplete,
    isRequired: false,
  },
  tableName,
  validations: undefined,
  doesClientHasError: false,
  clientErrorText: '',
  errorText: 'invalid',
  fieldType: 'INPUT_FIELD', // not file types so tokenize processes it
  skyflowID,
  onFocusChange: jest.fn(),
  setValue: jest.fn(),
  getUnformattedValue: () => value,
});

describe('FrameElementInit extended unit tests', () => {
  let originalFileValidation;
  let originalValidateFileName;
  // use exported mockClientRequest instead of spying prototype

  beforeEach(() => {
    const payload = {
      record: { rows: [] },
      metaData: { clientDomain: 'http://localhost.com', clientJSON: { config: { options: {} } } },
      containerId: 'group',
    };
    const encoded = btoa(JSON.stringify(payload));
    // Mock global window (avoid setting location.href directly to prevent jsdom navigation error)
    jest.spyOn(global, 'window', 'get').mockReturnValue({
      name: 'FRAME_ELEMENT:group:123:ERROR:',
      location: { href: `http://localhost/?${encoded}` },
      parent: { postMessage: jest.fn() },
      addEventListener: jest.fn(),
    });
    originalFileValidation = helpers.fileValidation;
    originalValidateFileName = helpers.vaildateFileName;
  });


  afterEach(() => {
    helpers.fileValidation = originalFileValidation;
    helpers.vaildateFileName = originalValidateFileName;
  mockClientRequest.mockReset();
    jest.clearAllMocks();
  });

  test('createInsertRequest builds correct number of empty records', () => {
    const instance = new FrameElementInit();
    const request = instance['createInsertRequest'](3, { meta: 'x' });
    expect(request.records).toHaveLength(3);
    request.records.forEach((r) => expect(r.fields.meta).toBe('x'));
    expect(request.tokenization).toBe(false);
  });

  test('extractSkyflowIDs filters undefined/null ids', () => {
    const instance = new FrameElementInit();
    const ids = instance['extractSkyflowIDs']({ records: [{ skyflow_id: 'a' }, { skyflow_id: null }, { skyflow_id: 'b' }] });
    expect(ids).toEqual(['a', 'b']);
  });

  test('multipleUploadFiles success path with metaData and returned skyflow IDs (array fallback)', async () => {
    const instance = new FrameElementInit();
    const files = [makeFile('f1.txt'), makeFile('f2.txt')];
    const fileElement = makeFileElement({ multiple: true, files });
    instance.iframeFormList = [fileElement];

    // Force helper validations to pass
    helpers.fileValidation = jest.fn(() => true);
    helpers.vaildateFileName = jest.fn(() => true);

    // Mock insertDataCallInMultiFiles to resolve with skyflow IDs
    instance['insertDataCallInMultiFiles'] = jest.fn().mockResolvedValue({
      records: [ { skyflow_id: 'id1' }, { skyflow_id: 'id2' } ],
    });

  mockClientRequest.mockResolvedValue({ upload: 'ok' });

    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    const metaData = { foo: 'bar' };
    const result = await instance['multipleUploadFiles'](fileElement, config, metaData);
    expect(instance['insertDataCallInMultiFiles']).toHaveBeenCalled();
  // Since state.value was set to an array (not a FileList), implementation wraps it once => single upload
  expect(result.fileUploadResponse).toHaveLength(1);
  expect(mockClientRequest).toHaveBeenCalledTimes(1);
  });

  test('multipleUploadFiles rejects when no skyflow IDs returned', async () => {
    const instance = new FrameElementInit();
    const files = [makeFile('f1.txt'), makeFile('f2.txt')];
    const fileElement = makeFileElement({ multiple: true, files });
    instance.iframeFormList = [fileElement];
    helpers.fileValidation = jest.fn(() => true);
    helpers.vaildateFileName = jest.fn(() => true);
    instance['insertDataCallInMultiFiles'] = jest.fn().mockResolvedValue({ records: [] });
  mockClientRequest.mockResolvedValue({ upload: 'ok' });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['multipleUploadFiles'](fileElement, config, { meta: 'x' })).rejects.toEqual({ error: 'No skyflow IDs returned from insert data' });
  });

  test('multipleUploadFiles filename validation failure', async () => {
    const instance = new FrameElementInit();
    const files = [makeFile('bad.txt')];
    const fileElement = makeFileElement({ multiple: true, files });
    instance.iframeFormList = [fileElement];
    helpers.fileValidation = jest.fn(() => true);
    helpers.vaildateFileName = jest.fn(() => false); // force invalid name
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['multipleUploadFiles'](fileElement, config, {})).rejects.toBeTruthy();
  });

  test('validateFiles throws on invalid file type', () => {
    const instance = new FrameElementInit();
    const files = [makeFile('first.txt'), makeFile('second.txt')];
    const fileElement = makeFileElement({ multiple: true, files });
    helpers.fileValidation = jest.fn(file => file.name !== 'second.txt'); // second invalid
    helpers.vaildateFileName = jest.fn(() => true);
    expect(() => instance['validateFiles'](files, fileElement.state, fileElement)).toThrow(SkyflowError);
  });

  test('parallelUploadFiles resolves with aggregated responses when all succeed', async () => {
    const instance = new FrameElementInit();
    const fileElementA = makeFileElement({ multiple: false, files: [makeFile('a.txt')] });
    const fileElementB = makeFileElement({ multiple: false, files: [makeFile('b.txt')] });
    instance.iframeFormList = [fileElementA, fileElementB];
    instance.uploadFiles = jest.fn(() => Promise.resolve('{"ok":true}'));
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['parallelUploadFiles']({}, config)).resolves.toEqual({ fileUploadResponse: [{ ok: true }, { ok: true }] });
  });

  test('parallelUploadFiles rejects with mixed success and errors', async () => {
    const instance = new FrameElementInit();
    const fileElementA = makeFileElement({ multiple: false, files: [makeFile('a.txt')] });
    const fileElementB = makeFileElement({ multiple: false, files: [makeFile('b.txt')] });
    instance.iframeFormList = [fileElementA, fileElementB];
    instance.uploadFiles = jest.fn()
      .mockImplementationOnce(() => Promise.resolve('{"ok":true}'))
      .mockImplementationOnce(() => Promise.reject({ error: 'failed' }));
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['parallelUploadFiles']({}, config)).rejects.toEqual({ fileUploadResponse: [{ ok: true }], errorResponse: [{ error: 'failed' }] });
  });

  test('tokenize rejects when element invalid/incomplete', async () => {
    const instance = new FrameElementInit();
    const invalidElement = makeTextElement({ isValid: false, isComplete: false, value: '', name: 'text1' });
    instance.iframeFormList = [invalidElement];
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toBeInstanceOf(SkyflowError);
  });

  // ================= uploadFiles tests =================
  const makeSingleFileElement = ({ file, isRequired = false, preserveFileName = true, skyflowID } = {}) => ({
    state: { value: file, name: 'uploadColumn', isRequired },
    tableName: 'files_table',
    skyflowID,
    onFocusChange: jest.fn(),
    preserveFileName,
    fieldType: ELEMENTS.FILE_INPUT.name,
  });

  test('uploadFiles success with preserveFileName true and skyflowID included', async () => {
    const instance = new FrameElementInit();
    const file = makeFile('original.txt', 5);
    const element = makeSingleFileElement({ file, isRequired: true, preserveFileName: true, skyflowID: 'sky123' });
    helpers.fileValidation = jest.fn(() => true);
    helpers.vaildateFileName = jest.fn(() => true);
    mockClientRequest.mockResolvedValue({ upload: 'ok' });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'tokenXYZ' };
    const result = await instance.uploadFiles(element, config);
    expect(result).toEqual({ upload: 'ok' });
    expect(element.onFocusChange).toHaveBeenCalledWith(false); // required triggers focus change
    expect(helpers.fileValidation).toHaveBeenCalledTimes(2); // initial try + validatedFileState
    // Inspect request body (FormData) from mockClientRequest first call
    const callArgs = mockClientRequest.mock.calls[0][0];
    const body = callArgs.body;
    expect(body.get('columnName')).toBe('uploadColumn');
    expect(body.get('tableName')).toBe('files_table');
    expect(body.get('skyflowID')).toBe('sky123');
    const uploadedFile = body.get('file');
    expect(uploadedFile.name).toBe('original.txt');
  });

  test('uploadFiles success with preserveFileName false uses generated filename', async () => {
    const instance = new FrameElementInit();
    const file = makeFile('orig.txt', 5);
    const element = makeSingleFileElement({ file, preserveFileName: false });
    helpers.fileValidation = jest.fn(() => true);
    helpers.vaildateFileName = jest.fn(() => true);
    const genSpy = jest.spyOn(helpers, 'generateUploadFileName').mockImplementation(() => 'gen_name.txt');
    mockClientRequest.mockResolvedValue({ upload: 'ok' });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'tokenXYZ' };
    await instance.uploadFiles(element, config);
    const uploadedFile = mockClientRequest.mock.calls[0][0].body.get('file');
    expect(genSpy).toHaveBeenCalledWith('orig.txt');
    expect(uploadedFile.name).toBe('gen_name.txt');
    genSpy.mockRestore();
  });

  test('uploadFiles rejects on invalid file name when preserveFileName true', async () => {
    const instance = new FrameElementInit();
    const file = makeFile('bad.txt', 5);
    const element = makeSingleFileElement({ file, preserveFileName: true });
    helpers.fileValidation = jest.fn(() => true);
    helpers.vaildateFileName = jest.fn(() => false); // invalid name
    mockClientRequest.mockResolvedValue({ upload: 'ok' });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'tokenXYZ' };
    await expect(instance.uploadFiles(element, config)).rejects.toBeInstanceOf(SkyflowError);
  });

  test('uploadFiles rejects on invalid file type (second validation false)', async () => {
    const instance = new FrameElementInit();
    const file = makeFile('file.txt', 5);
    const element = makeSingleFileElement({ file });
    // First call passes; second returns false
    helpers.fileValidation = jest.fn()
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false);
    helpers.vaildateFileName = jest.fn(() => true);
    mockClientRequest.mockResolvedValue({ upload: 'ok' });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'tokenXYZ' };
    await expect(instance.uploadFiles(element, config)).rejects.toBeInstanceOf(SkyflowError);
  });

  test('uploadFiles propagates thrown error from initial fileValidation', async () => {
    const instance = new FrameElementInit();
    const file = makeFile('file.txt', 5);
    const element = makeSingleFileElement({ file });
    const thrown = new SkyflowError('CUSTOM_ERROR', [], true);
    helpers.fileValidation = jest.fn(() => { throw thrown; });
    helpers.vaildateFileName = jest.fn(() => true);
    mockClientRequest.mockResolvedValue({ upload: 'ok' });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'tokenXYZ' };
    await expect(instance.uploadFiles(element, config)).rejects.toBe(thrown);
  });

  // ================= handleCollectCall branch coverage (lines ~105-145) =================
  // Use setTimeout 0 to flush microtasks; avoids reliance on setImmediate (not in all environments)
  const flushPromises = () => new Promise((r) => setTimeout(r, 0));

  const makeMultiFileIFrameElement = () => ({
    fieldType: ELEMENTS.MULTI_FILE_INPUT.name,
    iFrameName: 'element:MULTI_FILE_INPUT:xyz',
    state: { isRequired: false, name: 'multiUpload', value: null },
    onFocusChange: jest.fn(),
  });

  test('handleCollectCall: multipleUploadFiles success path posts response', async () => {
    const instance = new FrameElementInit();
    const parentPostSpy = jest.spyOn(window.parent, 'postMessage');
    const multiElement = makeMultiFileIFrameElement();
    instance.iframeFormList = [multiElement];
    instance['multipleUploadFiles'] = jest.fn().mockResolvedValue({ ok: true });
    const clientConfig = { vaultID: 'v1', vaultURL: 'https://vault.url', authToken: 'tok' };
    // Directly invoke private handler with synthetic event
    instance['handleCollectCall']({
      data: {
        name: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${multiElement.iFrameName}`,
        clientConfig,
        options: { meta: 'x' },
      },
    });
    await flushPromises();
    expect(instance['multipleUploadFiles']).toHaveBeenCalledWith(multiElement, clientConfig, { meta: 'x' });
    expect(parentPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${multiElement.iFrameName}`,
        data: { ok: true },
      }),
      expect.any(String),
    );
  });

  test('handleCollectCall: multipleUploadFiles error path posts error', async () => {
    const instance = new FrameElementInit();
    const parentPostSpy = jest.spyOn(window.parent, 'postMessage');
    const multiElement = makeMultiFileIFrameElement();
    instance.iframeFormList = [multiElement];
    instance['multipleUploadFiles'] = jest.fn().mockRejectedValue({ error: 'fail' });
    const clientConfig = { vaultID: 'v1', vaultURL: 'https://vault.url', authToken: 'tok' };
    instance['handleCollectCall']({
      data: {
        name: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${multiElement.iFrameName}`,
        clientConfig,
        options: {},
      },
    });
    await flushPromises();
    expect(parentPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${multiElement.iFrameName}`,
        data: { error: 'fail' },
      }),
      expect.any(String),
    );
  });

  test('handleCollectCall: COLLECT request success posts COMPOSABLE_CALL_RESPONSE', async () => {
    const instance = new FrameElementInit();
    const parentPostSpy = jest.spyOn(window.parent, 'postMessage');
    instance['tokenize'] = jest.fn().mockResolvedValue({ records: [{ id: '1' }] });
    const clientConfig = { vaultID: 'v1', vaultURL: 'https://vault.url', authToken: 'tok' };
    instance['handleCollectCall']({
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + instance.containerId,
        data: { type: COLLECT_TYPES.COLLECT },
        clientConfig,
      },
    });
    await flushPromises();
    expect(instance['tokenize']).toHaveBeenCalled();
    expect(parentPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + instance.containerId,
        data: { records: [{ id: '1' }] },
      }),
      expect.any(String),
    );
  });

  test('handleCollectCall: COLLECT request error posts COMPOSABLE_CALL_RESPONSE error', async () => {
    const instance = new FrameElementInit();
    const parentPostSpy = jest.spyOn(window.parent, 'postMessage');
    instance['tokenize'] = jest.fn().mockRejectedValue({ error: 'bad' });
    const clientConfig = { vaultID: 'v1', vaultURL: 'https://vault.url', authToken: 'tok' };
    instance['handleCollectCall']({
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + instance.containerId,
        data: { type: COLLECT_TYPES.COLLECT },
        clientConfig,
      },
    });
    await flushPromises();
    expect(parentPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + instance.containerId,
        data: { error: 'bad' },
      }),
      expect.any(String),
    );
  });

  test('handleCollectCall: FILE_UPLOAD request success posts COMPOSABLE_FILE_CALL_RESPONSE', async () => {
    const instance = new FrameElementInit();
    const parentPostSpy = jest.spyOn(window.parent, 'postMessage');
    instance['parallelUploadFiles'] = jest.fn().mockResolvedValue({ fileUploadResponse: [{ ok: true }] });
    const clientConfig = { vaultID: 'v1', vaultURL: 'https://vault.url', authToken: 'tok' };
    instance['handleCollectCall']({
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + instance.containerId,
        data: { type: COLLECT_TYPES.FILE_UPLOAD },
        clientConfig,
      },
    });
    await flushPromises();
    expect(parentPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + instance.containerId,
        data: { fileUploadResponse: [{ ok: true }] },
      }),
      expect.any(String),
    );
  });

  test('handleCollectCall: FILE_UPLOAD request error posts COMPOSABLE_FILE_CALL_RESPONSE error', async () => {
    const instance = new FrameElementInit();
    const parentPostSpy = jest.spyOn(window.parent, 'postMessage');
    instance['parallelUploadFiles'] = jest.fn().mockRejectedValue({ error: 'upload-fail' });
    const clientConfig = { vaultID: 'v1', vaultURL: 'https://vault.url', authToken: 'tok' };
    instance['handleCollectCall']({
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + instance.containerId,
        data: { type: COLLECT_TYPES.FILE_UPLOAD },
        clientConfig,
      },
    });
    await flushPromises();
    expect(parentPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + instance.containerId,
        data: { error: 'upload-fail' },
      }),
      expect.any(String),
    );
  });

  test('handleCollectCall: COMPOSABLE_CONTAINER message sets client without error', async () => {
    const instance = new FrameElementInit();
    const spyFromJSON = jest.spyOn(Client, 'fromJSON');
    const clientConfigPayload = { config: { vaultURL: 'https://vault.url', vaultID: 'vaultX' } };
    instance['handleCollectCall']({
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + instance.containerId,
        client: clientConfigPayload,
      },
    });
    await flushPromises();
    expect(spyFromJSON).toHaveBeenCalled();
  });

  // ===== Additional tokenize branch coverage (lines ~315-469) =====
  test('tokenize accumulates checkbox values into comma-separated string', async () => {
    const instance = new FrameElementInit();
    const checkbox1 = { ...makeTextElement({ name: 'agree', value: 'yes' }), fieldType: ELEMENTS.checkbox.name };
    const checkbox2 = { ...makeTextElement({ name: 'agree', value: 'no' }), fieldType: ELEMENTS.checkbox.name };
    instance.iframeFormList = [checkbox1, checkbox2];
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await instance['tokenize']({ options: {} }, config);
    const firstCallInsertObj = constructElementsInsertReq.mock.calls[0][0];
    expect(firstCallInsertObj.agree).toBe('yes,no');
  });

  test('tokenize rejects duplicate element without validation rule', async () => {
    const instance = new FrameElementInit();
    const e1 = makeTextElement({ name: 'dup', tableName: 'patients', value: 'A' });
    const e2 = makeTextElement({ name: 'dup', tableName: 'patients', value: 'B' });
    instance.iframeFormList = [e1, e2];
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ description: expect.stringMatching(/appeared multiple times/) })
      })
    );
  });

  test('tokenize rejects when skyflowID is empty string', async () => {
    const instance = new FrameElementInit();
    const elem = makeTextElement({ name: 'fieldA', tableName: 'patients', value: 'A', skyflowID: '' });
    instance.iframeFormList = [elem];
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    try {
      await instance['tokenize']({ options: {} }, config);
      fail('Expected tokenize to reject for empty skyflowID');
    } catch (err) {
      expect(err).toBeInstanceOf(SkyflowError);
    }
  });

  test('tokenize builds updateRecords for same skyflowID and resolves update-only', async () => {
    const instance = new FrameElementInit();
    const e1 = makeTextElement({ name: 'first', tableName: 'patients', value: 'A', skyflowID: 'id123' });
    const e2 = makeTextElement({ name: 'second', tableName: 'patients', value: 'B', skyflowID: 'id123' });
    instance.iframeFormList = [e1, e2];
    constructInsertRecordRequest.mockImplementation(() => []); // no inserts
    updateRecordsBySkyflowIDComposable.mockResolvedValue({ records: [{ id: 'upd1' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    const result = await instance['tokenize']({ options: {} }, config);
    expect(result.records[0].id).toBe('upd1');
    const updateObj = constructElementsInsertReq.mock.calls[0][1];
    expect(updateObj).toHaveProperty('id123');
  });

  test('tokenize insert-only path resolves with insert records', async () => {
    const instance = new FrameElementInit();
    const elem = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [elem];
    constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [] } ]);
    constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
    insertDataInCollect.mockResolvedValue({ records: [{ id: 'ins1' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    const res = await instance['tokenize']({ options: {} }, config);
    expect(res.records[0].id).toBe('ins1');
  });

  test('tokenize mixed insert/update with one rejection returns combined object', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    const upd = makeTextElement({ name: 'first', tableName: 'patients', value: 'X', skyflowID: 'id999' });
    instance.iframeFormList = [ins, upd];
    constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [{ skyflowID: 'id999', table: 'patients', first: 'X' }] } ]);
    constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
    insertDataInCollect.mockResolvedValue({ records: [{ id: 'ins1' }] });
    updateRecordsBySkyflowIDComposable.mockRejectedValue({ errors: [{ code: 'E1' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ records: [{ id: 'ins1' }], errors: [{ code: 'E1' }] });
  });

  test('tokenize error-only path rejects with aggregated errors (no records)', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    const upd = makeTextElement({ name: 'beta', tableName: 'patients', value: 'B', skyflowID: 'idErr' });
    instance.iframeFormList = [ins, upd];
    // Mock to produce both insert and update records
    constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [{ skyflowID: 'idErr', table: 'patients', beta: 'B' }] } ]);
    constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
    // Force both promises to reject with only errors arrays (no records)
    insertDataInCollect.mockRejectedValue({ errors: [{ code: 'E_INS' }] });
    updateRecordsBySkyflowIDComposable.mockRejectedValue({ errors: [{ code: 'E_UPD' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }, { code: 'E_UPD' }]});
  });
    test('tokenize error-only path rejects with aggregated errors (no records) case 2', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [ins];
    // Mock to produce both insert and update records
    constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [] } ]);
    constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
    // Force both promises to reject with only errors arrays (no records)
    insertDataInCollect.mockRejectedValue({ errors: [{ code: 'E_INS' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }]});
  });

  test('tokenize resolve with no errors (no errors)', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    // const upd = makeTextElement({ name: 'beta', tableName: 'patients', value: 'B', skyflowID: 'idErr' });
    instance.iframeFormList = [ins];
    // Mock to produce both insert and update records
    constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [] } ]);
    constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
    // Force both promises to reject with only errors arrays (no records)
    insertDataInCollect.mockRejectedValue({ records: [{ code: 'E_INS' }] });
    // updateRecordsBySkyflowIDComposable.mockRejectedValue({ records: [{ code: 'E_UPD' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).resolves.toEqual({ records: [{ code: 'E_INS' }] });
  });

  test('tokenize catch path when constructElementsInsertReq throws', async () => {
    const instance = new FrameElementInit();
    const elem = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [elem];
    constructElementsInsertReq.mockImplementation(() => { throw new Error('bad-request'); });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ error: 'bad-request' });
  });
    test('tokenize PARTIAL error', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    const upd = makeTextElement({ name: 'beta', tableName: 'patients', value: 'B', skyflowID: 'idErr' });
    instance.iframeFormList = [ins, upd];
    // Mock to produce both insert and update records
    constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [{ skyflowID: 'idErr', table: 'patients', beta: 'B' }] } ]);
    constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
    // Force both promises to reject with only errors arrays (no records)
    insertDataInCollect.mockResolvedValue({ errors: [{ code: 'E_INS' }], records: [{ id: 'ins1' }] });
    updateRecordsBySkyflowIDComposable.mockRejectedValue({ errors: [{ code: 'E_UPD' }] });
    const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }, { code: 'E_UPD' }], records: [{ id: 'ins1' }] });
  });
});
