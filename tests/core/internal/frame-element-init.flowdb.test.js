// flowDB variant of the frame-element-init tokenize orchestration tests.
// Mirrors the (currently skipped) privacyDB tokenize tests in
// frame-element-init.additional.test.js and frame-element-init.fulfilled-errors.test.js,
// but mocks the flowDB collect functions that frame-element-init now uses.
import { ELEMENTS } from '../../../src/core/constants';

// Mock collect helpers BEFORE importing FrameElementInit so internal references use mocks
jest.mock('../../../src/core-utils/collect', () => {
  const constructElementsInsertReq = jest.fn((insertObj, updateObj) => [
    { records: Object.entries(insertObj).map(([table, fields]) => ({ table, fields })) },
    { updateRecords: Object.entries(updateObj).map(([skyflowID, record]) => ({ skyflowID, ...record })) },
  ]);
  const constructFlowDBInsertRequest = jest.fn(() => ({ vaultID: 'vault123', records: [] }));
  const constructFlowDBUpdateRequest = jest.fn(() => ({ vaultID: 'vault123', records: [] }));
  const insertDataInCollectFlowDB = jest.fn(() => Promise.resolve({ records: [{ id: 'insert1' }], errors: [] }));
  const updateDataInCollectFlowDB = jest.fn(() => Promise.resolve({ records: [{ id: 'update1' }], errors: [] }));
  return {
    __esModule: true,
    constructElementsInsertReq,
    constructFlowDBInsertRequest,
    constructFlowDBUpdateRequest,
    insertDataInCollectFlowDB,
    updateDataInCollectFlowDB,
  };
});
import FrameElementInit from '../../../src/core/internal/frame-element-init';
import {
  constructElementsInsertReq,
  constructFlowDBInsertRequest,
  constructFlowDBUpdateRequest,
  insertDataInCollectFlowDB,
  updateDataInCollectFlowDB,
} from '../../../src/core-utils/collect';

const makeTextElement = ({ name = 'field1', tableName = 'patients', value = 'abc', isValid = true, isComplete = true, skyflowID } = {}) => ({
  state: { name, value, isValid, isComplete, isRequired: false },
  tableName,
  validations: undefined,
  doesClientHasError: false,
  clientErrorText: '',
  errorText: 'invalid',
  fieldType: 'INPUT_FIELD',
  skyflowID,
  onFocusChange: jest.fn(),
  setValue: jest.fn(),
  getUnformattedValue: () => value,
});

const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };

beforeEach(() => {
  const payload = { record: { rows: [] }, metaData: { clientDomain: 'http://localhost.com', clientJSON: { config: { options: {} } } }, containerId: 'group' };
  const encoded = btoa(JSON.stringify(payload));
  jest.spyOn(global, 'window', 'get').mockReturnValue({
    name: 'FRAME_ELEMENT:group:123:ERROR:',
    location: { href: `http://localhost/?${encoded}` },
    parent: { postMessage: jest.fn() },
    addEventListener: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('FrameElementInit tokenize (flowDB variant)', () => {
  test('accumulates checkbox values into comma-separated string', async () => {
    const instance = new FrameElementInit();
    const checkbox1 = { ...makeTextElement({ name: 'agree', value: 'yes' }), fieldType: ELEMENTS.checkbox.name };
    const checkbox2 = { ...makeTextElement({ name: 'agree', value: 'no' }), fieldType: ELEMENTS.checkbox.name };
    instance.iframeFormList = [checkbox1, checkbox2];
    await instance['tokenize']({ options: {} }, config);
    const firstCallInsertObj = constructElementsInsertReq.mock.calls[0][0];
    expect(firstCallInsertObj.agree).toBe('yes,no');
  });

  test('builds updateRecords for same skyflowID and resolves update-only', async () => {
    const instance = new FrameElementInit();
    const e1 = makeTextElement({ name: 'first', tableName: 'patients', value: 'A', skyflowID: 'id123' });
    const e2 = makeTextElement({ name: 'second', tableName: 'patients', value: 'B', skyflowID: 'id123' });
    instance.iframeFormList = [e1, e2];
    // both elements carry the same skyflowID -> no inserts, one update
    updateDataInCollectFlowDB.mockResolvedValue({ records: [{ id: 'upd1' }] });
    const result = await instance['tokenize']({ options: {} }, config);
    expect(result.records[0].id).toBe('upd1');
    expect(insertDataInCollectFlowDB).not.toHaveBeenCalled();
    expect(updateDataInCollectFlowDB).toHaveBeenCalledTimes(1);
    const updateObj = constructElementsInsertReq.mock.calls[0][1];
    expect(updateObj).toHaveProperty('id123');
  });

  test('insert-only path resolves with insert records', async () => {
    const instance = new FrameElementInit();
    const elem = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [elem];
    constructElementsInsertReq.mockImplementation(() => [ { records: [{ table: 'patients', fields: { alpha: 'A' } }] }, { updateRecords: [] } ]);
    insertDataInCollectFlowDB.mockResolvedValue({ records: [{ id: 'ins1' }] });
    const res = await instance['tokenize']({ options: {} }, config);
    expect(res.records[0].id).toBe('ins1');
    expect(updateDataInCollectFlowDB).not.toHaveBeenCalled();
  });

  test('mixed insert/update with update errors returns combined object', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    const upd = makeTextElement({ name: 'first', tableName: 'patients', value: 'X', skyflowID: 'id999' });
    instance.iframeFormList = [ins, upd];
    constructElementsInsertReq.mockImplementation(() => [ { records: [{ table: 'patients', fields: { alpha: 'A' } }] }, { updateRecords: [{ skyflowID: 'id999', table: 'patients', first: 'X' }] } ]);
    insertDataInCollectFlowDB.mockResolvedValue({ records: [{ id: 'ins1' }] });
    updateDataInCollectFlowDB.mockResolvedValue({ errors: [{ code: 'E1' }] });
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ records: [{ id: 'ins1' }], errors: [{ code: 'E1' }] });
  });

  test('error-only path rejects with aggregated errors (no records)', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    const upd = makeTextElement({ name: 'beta', tableName: 'patients', value: 'B', skyflowID: 'idErr' });
    instance.iframeFormList = [ins, upd];
    constructElementsInsertReq.mockImplementation(() => [ { records: [{ table: 'patients', fields: { alpha: 'A' } }] }, { updateRecords: [{ skyflowID: 'idErr', table: 'patients', beta: 'B' }] } ]);
    insertDataInCollectFlowDB.mockResolvedValue({ errors: [{ code: 'E_INS' }] });
    updateDataInCollectFlowDB.mockResolvedValue({ errors: [{ code: 'E_UPD' }] });
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }, { code: 'E_UPD' }] });
  });

  test('error-only insert-only path rejects with aggregated errors', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [ins];
    constructElementsInsertReq.mockImplementation(() => [ { records: [{ table: 'patients', fields: { alpha: 'A' } }] }, { updateRecords: [] } ]);
    insertDataInCollectFlowDB.mockResolvedValue({ errors: [{ code: 'E_INS' }] });
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }] });
  });

  test('resolves with records when no errors', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [ins];
    constructElementsInsertReq.mockImplementation(() => [ { records: [{ table: 'patients', fields: { alpha: 'A' } }] }, { updateRecords: [] } ]);
    insertDataInCollectFlowDB.mockResolvedValue({ records: [{ id: 'ins1' }] });
    await expect(instance['tokenize']({ options: {} }, config)).resolves.toEqual({ records: [{ id: 'ins1' }] });
  });

  test('partial error: insert mixed records+errors, update errors', async () => {
    const instance = new FrameElementInit();
    const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    const upd = makeTextElement({ name: 'beta', tableName: 'patients', value: 'B', skyflowID: 'idErr' });
    instance.iframeFormList = [ins, upd];
    constructElementsInsertReq.mockImplementation(() => [ { records: [{ table: 'patients', fields: { alpha: 'A' } }] }, { updateRecords: [{ skyflowID: 'idErr', table: 'patients', beta: 'B' }] } ]);
    insertDataInCollectFlowDB.mockResolvedValue({ errors: [{ code: 'E_INS' }], records: [{ id: 'ins1' }] });
    updateDataInCollectFlowDB.mockResolvedValue({ errors: [{ code: 'E_UPD' }] });
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }, { code: 'E_UPD' }], records: [{ id: 'ins1' }] });
  });

  test('catch path when request building throws', async () => {
    const instance = new FrameElementInit();
    const elem = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
    instance.iframeFormList = [elem];
    constructFlowDBInsertRequest.mockImplementation(() => { throw new Error('bad-request'); });
    await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ error: 'bad-request' });
  });
});
