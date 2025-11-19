import Client from "../../src/client";
import { getUpsertColumn, updateRecordsBySkyflowID, constructElementsInsertReq, insertDataInMultipleFiles, insertDataInCollect, updateRecordsBySkyflowIDComposable, checkForElementMatchRule, checkForValueMatch, constructUpdateRecordRequest, constructUpdateRecordResponse } from "../../src/core-utils/collect";
import { ValidationRuleType } from "../../src/utils/common";
import SKYFLOW_ERROR_CODE from "../../src/utils/constants";
import { parameterizedString } from "../../src/utils/logs-helper";
import { getAccessToken } from "../../src/utils/bus-events";

jest.mock('../../src/utils/bus-events', () => ({
    getAccessToken: jest.fn().mockResolvedValue('auth-token'),
  }));
describe("getUpsertColumn fn test", () => {
    const options = {
        upsert: [
            {
                table: 'test',
                column: 'column'
            }
        ]
    }
    test("return unique column", () => {
        const fnResponse = getUpsertColumn('test', options.upsert);
        expect(fnResponse).toStrictEqual('column');
    });
    test("return empty column", () => {
        const fnResponse = getUpsertColumn('testTwo', options.upsert);
        expect(fnResponse).toStrictEqual('');
    });
    test("upsert options as undefined", () => {
        const fnResponse = getUpsertColumn('test', undefined);
        expect(fnResponse).toStrictEqual('');
    });

});
let req = {
    'table1': {
        fields: {
            cvv: '122'
        }
    }
}
let update = {
    'table1': {
        fields: {
            cvv: '122'
        }
    }
}
let update2 = {
    'table1': {
        fields: {
            column: '122'
        }
    }
}
const options = {
    tokens: true,
    additionalFields: {
      records: [
        {
          table: "table1",
          fields: {
            name: 'name'
          },
        },
      ],
    },
  };
  const options2 = {
    tokens: true,
    additionalFields: {
      records: [
        {
          table: "table1",
          fields: {
            column: '122',
            skyflowID: 'table1'
          },
        },
      ],
    },
  };
describe("constructElementsInsertReq fn test", () => {

    test("constructElementsInsertReq error 1", () => {
         try{
            constructElementsInsertReq(req, update, options);
        }catch(err){
            expect(err.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT_ADDITIONAL_FIELDS.description));
        }
    });
    test("constructElementsInsertReq error 2", () => {
        try{
           constructElementsInsertReq(req, update2, options);
       }catch(err){
           expect(err.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT.description, 'name', 'table1'));
       }
   });
   test("constructElementsInsertReq error 2", () => {
    try{
       constructElementsInsertReq(req, update2, options2);
   }catch(err){
    expect(err.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT.description));
}
});

});

class MockIFrameFormElement {
    state = { value: 'testValue' };

    isMatchEqual(index, value, rule) {
        return index % 2 === 0; 
    }
}

describe('checkForElementMatchRule', () => {
    it('should return false when validations array is null or undefined', () => {
        expect(checkForElementMatchRule(null)).toBe(false);
        expect(checkForElementMatchRule(undefined)).toBe(false);
    });

    it('should return false when validations array is empty', () => {
        expect(checkForElementMatchRule([])).toBe(false);
    });

    it('should return true when an ELEMENT_VALUE_MATCH_RULE type is found', () => {
        const validations = [
            { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
            { type: ValidationRuleType.ANOTHER_TYPE, params: {} },
        ];
        expect(checkForElementMatchRule(validations)).toBe(true);
    });

    it('should return false when no ELEMENT_VALUE_MATCH_RULE type is found', () => {
        const validations = [
            { type: ValidationRuleType.ANOTHER_TYPE, params: {} },
            { type: ValidationRuleType.DIFFERENT_TYPE, params: {} },
        ];
        expect(checkForElementMatchRule(validations)).toBe(false);
    });
});

describe('checkForValueMatch', () => {
    let element;

    beforeEach(() => {
        element = new MockIFrameFormElement();
    });

    it('should return false when validations array is null or undefined', () => {
        expect(checkForValueMatch(null, element)).toBe(false);
        expect(checkForValueMatch(undefined, element)).toBe(false);
    });

    it('should return false when validations array is empty', () => {
        expect(checkForValueMatch([], element)).toBe(false);
    });

    it('should return true when an ELEMENT_VALUE_MATCH_RULE type is found and isMatchEqual returns false', () => {
        const validations = [
            { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
        ];
        jest.spyOn(element, 'isMatchEqual').mockReturnValue(false);

        expect(checkForValueMatch(validations, element)).toBe(true);
    });

    it('should return false when an ELEMENT_VALUE_MATCH_RULE type is found but isMatchEqual returns true', () => {
        const validations = [
            { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
        ];
        jest.spyOn(element, 'isMatchEqual').mockReturnValue(true);

        expect(checkForValueMatch(validations, element)).toBe(false);
    });

    it('should return false when no ELEMENT_VALUE_MATCH_RULE type is found', () => {
        const validations = [
            { type: ValidationRuleType.ANOTHER_TYPE, params: {} },
        ];
        expect(checkForValueMatch(validations, element)).toBe(false);
    });
});

describe("constructUpdateRecordRequest", () => {
  test("should construct request with tokens true", () => {
    const updateData = {
      table: "table1",
      fields: { name: "John" },
      skyflowID: "id1",
    };
    const options = { tokens: true };
    const req = constructUpdateRecordRequest(updateData, options);
    expect(req).toEqual({
      record: { fields: { name: "John" } },
      tokenization: true,
    });
  });

  test("should construct request with tokens false", () => {
    const updateData = {
      table: "table1",
      fields: { name: "John" },
      skyflowID: "id1",
    };
    const options = { tokens: false };
    const req = constructUpdateRecordRequest(updateData, options);
    expect(req).toEqual({
      record: { fields: { name: "John" } },
      tokenization: false,
    });
  });

  test("should default tokens to false if not provided", () => {
    const updateData = {
      table: "table1",
      fields: { name: "John" },
      skyflowID: "id1",
    };
    const req = constructUpdateRecordRequest(updateData, {});
    expect(req).toEqual({
      record: { fields: { name: "John" } },
      tokenization: false,
    });
  });
});

describe("constructUpdateRecordResponse", () => {
  test("should construct response with tokens", () => {
    const responseBody = {
      skyflow_id: "id1",
      tokens: {
        name: "tok123",
        age: "tok456",
      },
    };
    const result = constructUpdateRecordResponse(responseBody, true);
    expect(result).toEqual({
      updatedField: {
        skyflowID: "id1",
        name: "tok123",
        age: "tok456",
      },
    });
  });

  test("should construct response without tokens", () => {
    const responseBody = {
      skyflow_id: "id1",
      tokens: null,
    };
    const result = constructUpdateRecordResponse(responseBody, false);
    expect(result).toEqual({
      updatedField: {
        skyflowID: "id1",
      },
    });
  });

  test("should construct response with tokens false and tokens present", () => {
    const responseBody = {
      skyflow_id: "id1",
      tokens: {
        name: "tok123",
      },
    };
    const result = constructUpdateRecordResponse(responseBody, false);
    expect(result).toEqual({
      updatedField: {
        skyflowID: "id1",
      },
    });
  });


});

describe("updateRecordsBySkyflowIDComposable", () => {

const buildClient = () => Client.fromJSON({config: { vaultID: 'vault123', vaultURL: 'https://vaulturl.com' } });

const buildUpdateRecords = (overrides = {}) => ({
    updateRecords: [
      {
        table: 'table1',
        fields: { table: 'table1', name: 'John', ...(overrides.fields || {}) },
        skyflowID: 'id1',
      },
    ],
  });

  test("resolves with tokenized fields when options.tokens=true", async () => {
    const mockClient = buildClient();
    jest.spyOn(mockClient, 'request').mockResolvedValue({
      skyflow_id: 'id1',
      tokens: { name: 'tok123' },
    });
    const skyflowRecords = buildUpdateRecords();
    await expect(updateRecordsBySkyflowIDComposable(skyflowRecords, mockClient, { tokens: true }, 'auth-token'))
      .resolves.toEqual({
        records: [
          {
            table: 'table1',
            fields: { skyflow_id: 'id1', name: 'tok123' },
          },
        ],
      });
  });

  test("resolves with non-tokenized fields when options.tokens=false", async () => {
    const mockClient = buildClient();
    jest.spyOn(mockClient, 'request').mockResolvedValue({ skyflow_id: 'id1' });
    const skyflowRecords = buildUpdateRecords();
    await expect(updateRecordsBySkyflowIDComposable(skyflowRecords, mockClient, { tokens: false }, 'auth-token'))
      .resolves.toEqual({
        records: [
          {
            table: 'table1',
            skyflow_id: 'id1',
          },
        ],
      });
  });

  test("rejects with errors array when single record fails", async () => {
    const mockClient = buildClient();
    jest.spyOn(mockClient, 'request').mockRejectedValue({ error: { code: 500, description: 'update failed' } });
    const skyflowRecords = buildUpdateRecords();
    await expect(updateRecordsBySkyflowIDComposable(skyflowRecords, mockClient, { tokens: true }, 'auth-token'))
      .rejects.toEqual({
        errors: [
          {
            error: { code: 500, description: 'update failed' },
          },
        ],
      });
  });

  test("rejects with mixed records & errors when partial failure occurs", async () => {
    const mockClient = buildClient();
    // First call succeeds, second fails
    jest.spyOn(mockClient, 'request')
      .mockResolvedValueOnce({ skyflow_id: 'id1', tokens: { name: 'tok123' } })
      .mockRejectedValueOnce({ error: { code: 400, description: 'bad request' } });
    const skyflowRecords = {
      updateRecords: [
        { table: 'table1', fields: { table: 'table1', name: 'John' }, skyflowID: 'id1' },
        { table: 'table1', fields: { table: 'table1', name: 'Jane' }, skyflowID: 'id2' },
      ],
    };
    await expect(updateRecordsBySkyflowIDComposable(skyflowRecords, mockClient, { tokens: true }, 'auth-token'))
      .rejects.toEqual({
        records: [
          { table: 'table1', fields: { skyflow_id: 'id1', name: 'tok123' } },
        ],
        errors: [
          { error: { code: 400, description: 'bad request' } },
        ],
      });
  });
});

describe('updateRecordsBySkyflowID', () => {
  const buildClient = () => ({
    config: { vaultID: 'vault123', vaultURL: 'https://vaulturl.com' },
    request: jest.fn(),
    toJSON: () => ({ metaData: { uuid: 'client-uuid' } }),
  });

  const buildUpdateRecords = (overrides = {}) => ({
    updateRecords: [
      {
        table: 'table1',
        fields: { table: 'table1', name: 'John', ...(overrides.fields || {}) },
        skyflowID: 'id1',
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockResolvedValue('auth-token');
  });

  test('resolves with tokenized records when tokens=true and all succeed', async () => {
    const client = buildClient();
    client.request.mockResolvedValue({ skyflow_id: 'id1', tokens: { name: 'tok123' } });
    const skyflowRecords = buildUpdateRecords();
    await expect(updateRecordsBySkyflowID(skyflowRecords, client, { tokens: true }))
      .resolves.toEqual([
        { table: 'table1', fields: { skyflow_id: 'id1', name: 'tok123' } },
      ]);
    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({
      requestMethod: 'PUT',
      url: 'https://vaulturl.com/v1/vaults/vault123/table1/id1',
    }));
  });

  test('resolves with non-tokenized records when tokens=false and all succeed', async () => {
    const client = buildClient();
    client.request.mockResolvedValue({ skyflow_id: 'id1' });
    const skyflowRecords = buildUpdateRecords();
    await expect(updateRecordsBySkyflowID(skyflowRecords, client, { tokens: false }))
      .resolves.toEqual([
        { table: 'table1', skyflow_id: 'id1' },
      ]);
  });

  test('rejects with errors array when all fail', async () => {
    const client = buildClient();
    client.request.mockRejectedValue({ error: { code: 500, description: 'update failed' } });
    const skyflowRecords = buildUpdateRecords();
    await expect(updateRecordsBySkyflowID(skyflowRecords, client, { tokens: true }))
      .rejects.toEqual({
        errors: [
          { error: { code: 500, description: 'update failed' } },
        ],
      });
  });

  test('rejects with mixed records & errors when partial failure occurs', async () => {
    const client = buildClient();
    client.request
      .mockResolvedValueOnce({ skyflow_id: 'id1', tokens: { name: 'tok123' } })
      .mockRejectedValueOnce({ error: { code: 400, description: 'bad request' } });
    const skyflowRecords = {
      updateRecords: [
        { table: 'table1', fields: { table: 'table1', name: 'John' }, skyflowID: 'id1' },
        { table: 'table1', fields: { table: 'table1', name: 'Jane' }, skyflowID: 'id2' },
      ],
    };
    await expect(updateRecordsBySkyflowID(skyflowRecords, client, { tokens: true }))
      .rejects.toEqual({
        records: [
          { table: 'table1', fields: { skyflow_id: 'id1', name: 'tok123' } },
        ],
        errors: [
          { error: { code: 400, description: 'bad request' } },
        ],
      });
  });
});

describe('insertDataInCollect', () => {
  const buildClient = () => ({
    config: { vaultID: 'vault123', vaultURL: 'https://vaulturl.com' },
    request: jest.fn(),
  });

  const finalInsertRecords = { records: [ { table: 'table1', fields: { cvv: '122' } } ] };

  test('success path with tokens=true constructs tokenized response', async () => {
    const client = buildClient();
    const options = { tokens: true };
    const recordsPayload = { records: [{ table: 'table1', fields: { cvv: '122' } }] };
    // Mock response shape expected by constructInsertRecordResponse when tokens=true
    client.request.mockResolvedValue({
      responses: [
        { records: [{ skyflow_id: 'sky123' }] }, // POST response (index 0)
        { fields: { '*': 'ignore', cvv: 'tok-cvv-999' } }, // GET response (index 1)
      ],
    });
  const result = await insertDataInCollect(recordsPayload.records, client, options, finalInsertRecords, 'auth-token');
    expect(result).toEqual({
      records: [
        {
          table: 'table1',
          fields: { skyflow_id: 'sky123', cvv: 'tok-cvv-999' },
        },
      ],
    });
    // Ensure request invoked with proper vault path/method
    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({
      requestMethod: 'POST',
      url: 'https://vaulturl.com/v1/vaults/vault123',
    }));
  });

  test('success path with tokens=false constructs non-tokenized response', async () => {
    const client = buildClient();
    const options = { tokens: false };
    const recordsPayload = { records: [{ table: 'table1', fields: { cvv: '122' } }] };
    client.request.mockResolvedValue({
      responses: [
        { records: [{ skyflow_id: 'sky123' }] },
      ],
    });
  const result = await insertDataInCollect(recordsPayload.records, client, options, finalInsertRecords, 'auth-token');
    expect(result).toEqual({
      records: [
        { table: 'table1', skyflow_id: 'sky123' },
      ],
    });
  });

  test('error path returns wrapped errors array', async () => {
    const client = buildClient();
    const options = { tokens: true };
    const recordsPayload = { records: [{ table: 'table1', fields: { cvv: '122' } }] };
    client.request.mockRejectedValue({ error: { code: 500, description: 'insert failed' } });
  const result = await insertDataInCollect(recordsPayload.records, client, options, finalInsertRecords, 'auth-token');
    expect(result).toEqual({
      errors: [
        { error: { code: 500, description: 'insert failed' } },
      ],
    });
  });
});

describe('insertDataInMultipleFiles', () => {
  const buildClient = () => ({
    config: { vaultID: 'vault123', vaultURL: 'https://vaulturl.com' },
    request: jest.fn(),
  });

  const finalInsertRecords = { records: [ { table: 'files_table', fields: { file_ref: 'ref1' } } ] };

  test('success path tokens=true aggregates tokenized file fields', async () => {
    const client = buildClient();
    const options = { tokens: true };
    const recordsPayload = { records: [{ table: 'files_table', fields: { file_ref: 'ref1' } }] };
    client.request.mockResolvedValue({
      responses: [
        { records: [{ skyflow_id: 'file123' }] },
        { fields: { '*': 'ignore', file_ref: 'tok-file-abc' } },
      ],
    });
  const result = await insertDataInMultipleFiles(recordsPayload.records, client, options, finalInsertRecords, 'auth-token');
    expect(result).toEqual({
      records: [
        {
          table: 'files_table',
          fields: { skyflow_id: 'file123', file_ref: 'tok-file-abc' },
        },
      ],
    });
  });

  test('success path tokens=false returns skyflow_id only', async () => {
    const client = buildClient();
    const options = { tokens: false };
    const recordsPayload = { records: [{ table: 'files_table', fields: { file_ref: 'ref1' } }] };
    client.request.mockResolvedValue({
      responses: [
        { records: [{ skyflow_id: 'file123' }] },
      ],
    });
  const result = await insertDataInMultipleFiles(recordsPayload.records, client, options, finalInsertRecords, 'auth-token');
    expect(result).toEqual({
      records: [
        { table: 'files_table', skyflow_id: 'file123' },
      ],
    });
  });

  test('error path returns wrapped errors array (multiple files)', async () => {
    const client = buildClient();
    const options = { tokens: true };
    const recordsPayload = { records: [{ table: 'files_table', fields: { file_ref: 'ref1' } }] };
    client.request.mockRejectedValue({ error: { code: 400, description: 'file upload failed' } });
  const result = await insertDataInMultipleFiles(recordsPayload.records, client, options, finalInsertRecords, 'auth-token');
    expect(result).toEqual({
      errors: [
        { error: { code: 400, description: 'file upload failed' } },
      ],
    });
  });
});
