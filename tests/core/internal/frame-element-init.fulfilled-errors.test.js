import FrameElementInit from '../../../src/core/internal/frame-element-init';
import { ELEMENTS } from '../../../src/core/constants';
import SkyflowError from '../../../src/libs/skyflow-error';
import * as helpers from '../../../src/utils/helpers';
import { constructElementsInsertReq, constructInsertRecordRequest, insertDataInCollect, updateRecordsBySkyflowIDComposable } from '../../../src/core-utils/collect';

// Reuse existing mocks from additional test by mocking modules again (Jest will hoist mocks)
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

// Element factory
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

const getCollectMocks = () => ({ constructElementsInsertReq, constructInsertRecordRequest, insertDataInCollect, updateRecordsBySkyflowIDComposable });

// Minimal window mock
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

// Test 1: both promises fulfilled with only errors arrays
it('tokenize rejects when both insert and update promises fulfill with only errors arrays (fulfilled errors-only branch)', async () => {
  const instance = new FrameElementInit();
  const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
  const upd = makeTextElement({ name: 'beta', tableName: 'patients', value: 'B', skyflowID: 'idErr' });
  instance.iframeFormList = [ins, upd];
  const { constructElementsInsertReq, constructInsertRecordRequest, insertDataInCollect, updateRecordsBySkyflowIDComposable } = getCollectMocks();
  constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [{ skyflowID: 'idErr', table: 'patients', beta: 'B' }] } ]);
  constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
  insertDataInCollect.mockResolvedValue({ errors: [{ code: 'E_INS' }] });
  updateRecordsBySkyflowIDComposable.mockResolvedValue({ errors: [{ code: 'E_UPD' }] });
  const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
  await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ errors: [{ code: 'E_INS' }, { code: 'E_UPD' }] });
});

// Test 2: mixed fulfilled records and fulfilled errors array
it('tokenize rejects with combined object when insert fulfills records and update fulfills errors array (fulfilled mixed branch)', async () => {
  const instance = new FrameElementInit();
  const ins = makeTextElement({ name: 'alpha', tableName: 'patients', value: 'A' });
  const upd = makeTextElement({ name: 'first', tableName: 'patients', value: 'X', skyflowID: 'id999' });
  instance.iframeFormList = [ins, upd];
  const { constructElementsInsertReq, constructInsertRecordRequest, insertDataInCollect, updateRecordsBySkyflowIDComposable } = getCollectMocks();
  constructElementsInsertReq.mockImplementation(() => [ { insertRecords: { patients: { alpha: 'A' } } }, { updateRecords: [{ skyflowID: 'id999', table: 'patients', first: 'X' }] } ]);
  constructInsertRecordRequest.mockImplementation(() => [ { table: 'patients', fields: { alpha: 'A' } } ]);
  insertDataInCollect.mockResolvedValue({ records: [{ id: 'ins1' }] });
  updateRecordsBySkyflowIDComposable.mockResolvedValue({ errors: [{ code: 'E_UPD' }] });
  const config = { vaultURL: 'https://vault.url', vaultID: 'vault123', authToken: 'token123' };
  await expect(instance['tokenize']({ options: {} }, config)).rejects.toEqual({ records: [{ id: 'ins1' }], errors: [{ code: 'E_UPD' }] });
});
