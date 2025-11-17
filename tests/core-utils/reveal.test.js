/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Skyflow from '../../src/skyflow';
import {formatRecordsForClient, formatRecordsForClientComposable, formatRecordsForIframe, formatRecordsForRender, formatForRenderClient, getFileURLFromVaultBySkyflowID, getFileURLForRender, getFileURLFromVaultBySkyflowIDComposable, fetchRecordsByTokenIdComposable} from "../../src/core-utils/reveal";
import { Env, LogLevel } from '../../src/utils/common';
import { getAccessToken } from '../../src/utils/bus-events';
import Client from '../../src/client';
import { url } from 'inspector';

const testTokenId = '1677f7bd-c087-4645-b7da-80a6fd1a81a4';
const testInvalidTokenId = '80a6fd1a81a4-b7da-c087-4645';

const mGetRandomValues = jest.fn().mockReturnValue(new Uint32Array(10));
Object.defineProperty(window, 'crypto', {
  value: { getRandomValues: mGetRandomValues },
});
const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientData = {
  client: {
    config: { ...skyflowConfig },
    metaData: {
      uuid: 'id'
    },
  },
  clientJSON:{
    context: { logLevel: LogLevel.ERROR,env:Env.PROD},
    config:{
      ...skyflowConfig,
      getBearerToken:jest.fn().toString(),
    },
    metaData: {
      uuid: 'id'
    },
  } 
}

const skyflow = Skyflow.init({
  vaultID: 'vault_id',
  vaultURL: 'https://vault.test.com',
  getBearerToken: () => new Promise((resolve, reject) => {
    const Http = new XMLHttpRequest();

    Http.onreadystatechange = () => {
      if (Http.readyState == 4 && Http.status == 200) {
        const response = JSON.parse(Http.responseText);
        resolve(response.accessToken);
      }
    };
    const url = 'http://localhost:8000/js/userToken';
    Http.open('GET', url);
    Http.send();
  }),
});

jest.setTimeout(15000);
jest.mock('../../src/utils/bus-events', () => ({
  getAccessToken: jest.fn(
    () => Promise.resolve('mockAccessToken')
  ),
}));
describe('Reveal PureJs- get() Method Input', () => {
  test('should throw error for Empty Input Array', (done) => {
    skyflow.detokenize([]).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('should throw error for Empty Object in Input', (done) => {
    skyflow.detokenize({ records: [{}] }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('should throw error for Missing id Property', (done) => {
    skyflow.detokenize({
      records: [
        {
          // redaction: RedactionType.PLAIN_TEXT,
        },
      ],
    }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  }); 
  test('should throw error for Empty string in id value', (done) => {
    skyflow.detokenize({
      records: [
        {
          token: '',
        },
      ],
    }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});

describe("formatRecordsForClient fn test",()=>{
  test("only success records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231", "valueType" : "STRING"}] }
    const fnResponse = formatRecordsForClient(testInput, {"7402-2242-2342-232": "231"});
    expect(fnResponse.success.length).toBe(1);
    expect(fnResponse.errors).toBeUndefined();
  });
  test("both success and error records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231", "valueType" : "STRING"}],"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClient(testInput,{"7402-2242-2342-232": "231"});
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success.length).toBe(1);
  });
  test("only error records",()=>{
    const testInput = {"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClient(testInput);
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success).toBeUndefined();
  });
});
describe("formatRecordsForClientComposable fn test",()=>{
  test("only success records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231", "valueType" : "STRING"}] }
    const fnResponse = formatRecordsForClientComposable(testInput, {"7402-2242-2342-232": "231"});
    expect(fnResponse.success.length).toBe(1);
    expect(fnResponse.errors).toBeUndefined();
  });
  test("both success and error records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231", "valueType" : "STRING"}],"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClientComposable(testInput,{"7402-2242-2342-232": "231"});
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success.length).toBe(1);
  });
  test("only error records",()=>{
    const testInput = {"errors":[{
      "token":"3232-6434-3253-4221",
      "error":"token not found"
    }]};
    const fnResponse = formatRecordsForClientComposable(testInput);
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success).toBeUndefined();
  });
});

describe("formatRecordsForIframe fn test",()=>{
  test("no records should return empty object",()=>{
    const testInput = {};
    const fnResponse = formatRecordsForIframe(testInput);
    expect(fnResponse).toStrictEqual({});
  });
  test("with records should return token value object",()=>{
    const testInput = {"records":[{token:"7823-323-242-2232",value:"token_value","valueType" : "STRING"}]};
    const fnResponse = formatRecordsForIframe(testInput);
    expect(fnResponse).toStrictEqual({"7823-323-242-2232":"token_value"});
  });
});

describe("formatRecordsForRender fn test",()=>{
  test("no records should return empty object",()=>{
    const testInput = {};
    const fnResponse = formatRecordsForRender(testInput, 'col', 'id');
    expect(fnResponse).toStrictEqual({
        "column": "col",
        "skyflowID": "id",
        "url": "",
      });
  });
  test("with records should return token value object",()=>{
    const testInput = {"fields": {
      "col" : "http://dummy.com",
      "skyflow_id": "id",
    }};
    const fnResponse = formatRecordsForRender(testInput, 'col', 'id');
    expect(fnResponse).toStrictEqual({"column": "col",
      "skyflowID": "id",
      "url": "http://dummy.com",});
  });
});
describe("formatForRenderClient fn test",()=>{
  test("no records should return empty object",()=>{
    const testInput = {};
    const fnResponse = formatForRenderClient(testInput, 'col');
    expect(fnResponse).toStrictEqual({});
  });
  test("with records should return token value object",()=>{
    const testInput = {"fields": {
      "col" : "http://dummy.com",
      "skyflow_id": "id",
    }};
    const fnResponse = formatForRenderClient(testInput, 'col');
    expect(fnResponse).toStrictEqual({ success :{"column": "col",
      "skyflow_id": "id",
      "fileMetadata": undefined,
    }});
  });
  test("errors case", ()=>{
    const errorResponse = {
      "errors": {
        "skyflowId" : "id",
         "column": "col",
         "error": "token not found"
      }
      
    }
    const fnResponse = formatForRenderClient(errorResponse, 'col');
    expect(fnResponse).toStrictEqual({ errors :{
     "skyflowId" : "id",
         "column": "col",
         "error": "token not found"
    }});

  })
});
describe('getFileURLFromVaultBySkyflowID', () => {
  it('should resolve with the file URL when the promise is resolved', async () => {
    const mockSkyflowIdRecord = {
      column: 'mockColumn',
      skyflowID: 'mockSkyflowID',
      table: 'mockTable',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON);
    // console.log(mockClient.toJSON().metaData);

    const result  = getFileURLFromVaultBySkyflowID(mockSkyflowIdRecord, mockClient);
    jest.spyOn(mockClient, 'request').mockResolvedValue('mockFileURL');
    expect(result).toBeDefined();
  });

  it('should reject with an error when the promise is rejected', async () => {
    const mockSkyflowIdRecord = {
      column: 'mockColumn',
      skyflowID: 'mockSkyflowID',
      table: 'mockTable',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON); 
    jest.spyOn(mockClient, 'request').mockRejectedValue({error: {
      code: '500',
      description: 'Internal Server Error',
    }
    });

    await expect(getFileURLFromVaultBySkyflowID(mockSkyflowIdRecord, mockClient)).rejects.toEqual({
      error: {
        code: '500',
        description: 'Internal Server Error',
      },
      column: 'mockColumn',
      skyflowId: 'mockSkyflowID',
    });
    });
  it('should reject with an error when the promise is root rejected', async () => {
    const mockSkyflowIdRecord = {
      column: 'mockColumn',
      skyflowID: 'mockSkyflowID',
      table: 'mockTable',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON); 
    jest.spyOn(mockClient, 'request').mockImplementation(() => {
      throw {
        error: {
          code: '500',
          description: 'Internal Server Error',
        }
      };
    });

    await expect(getFileURLFromVaultBySkyflowID(mockSkyflowIdRecord, mockClient)).rejects.toEqual({
      error: {
        code: '500',
        description: 'Internal Server Error',
      },
    });
  });
});

describe('getFileURLFromVaultBySkyflowID for composable reveal', () => {
  it('should resolve with the file URL when the promise is resolved', async () => {
    const mockSkyflowIdRecord = {
      column: 'mockColumn',
      skyflowID: 'mockSkyflowID',
      table: 'mockTable',
    };
   
    const mockClient = Client.fromJSON(clientData.clientJSON);
    // mock getFileURLForRender
    jest.spyOn(mockClient, 'request').mockResolvedValue('mockFileURL');
 
    const result  = getFileURLFromVaultBySkyflowIDComposable(mockSkyflowIdRecord, mockClient, "token");
    console.log('result',result);
    expect(result).toBeDefined();
  });

  it('should reject with an error when the promise is rejected', async () => {
    const mockSkyflowIdRecord = {
      column: 'mockColumn',
      skyflowID: 'mockSkyflowID',
      table: 'mockTable',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON); 
    jest.spyOn(mockClient, 'request').mockRejectedValue({error: {
      code: '500',
      description: 'Internal Server Error',
    }
    });

    await expect(getFileURLFromVaultBySkyflowIDComposable(mockSkyflowIdRecord, mockClient, "token")).rejects.toEqual({
      error: {
        code: '500',
        description: 'Internal Server Error',
      },
      column: 'mockColumn',
      skyflowId: 'mockSkyflowID',
    });
  });
  it('should reject with an error when the promise is root rejected', async () => {
    const mockSkyflowIdRecord = {
      column: 'mockColumn',
      skyflowID: 'mockSkyflowID',
      table: 'mockTable',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON); 
    jest.spyOn(mockClient, 'request').mockImplementation(() => {
      throw {
        error: {
          code: '500',
          description: 'Internal Server Error',
        }
      };
    });

    await expect(getFileURLFromVaultBySkyflowIDComposable(mockSkyflowIdRecord, mockClient, "token")).rejects.toEqual({
      error: {
        code: '500',
        description: 'Internal Server Error',
      },
    });
  });
});

describe('fetchRecordsByTokenIdComposable', () => {
  it('should resolve with records when all tokens are successfully detokenized', async () => {
    const mockTokenRecords = [
      { token: 'token1', iframeName: 'iframe1', redaction: 'PLAIN_TEXT' },
      { token: 'token2', iframeName: 'iframe2', redaction: 'PLAIN_TEXT' },
    ];

    const mockClient = Client.fromJSON(clientData.clientJSON);
    
    jest.spyOn(mockClient, 'request')
      .mockResolvedValueOnce({ records: [{ token: 'token1', value: 'value1', valueType: 'STRING' }] })
      .mockResolvedValueOnce({ records: [{ token: 'token2', value: 'value2', valueType: 'STRING' }] });

    const result = await fetchRecordsByTokenIdComposable(mockTokenRecords, mockClient, 'mockToken');
    
    expect(result).toBeDefined();
    expect(result.records).toHaveLength(2);
    expect(mockClient.request).toHaveBeenCalledTimes(2);
  });

  it('should reject with errors when all tokens fail to detokenize', async () => {
    const mockTokenRecords = [
      { token: 'token1', iframeName: 'iframe1', redaction: 'PLAIN_TEXT' },
    ];

    const mockClient = Client.fromJSON(clientData.clientJSON);
    
    jest.spyOn(mockClient, 'request').mockRejectedValue({
      error: {
        code: '404',
        description: 'Token not found',
      },
    });

    await expect(fetchRecordsByTokenIdComposable(mockTokenRecords, mockClient, 'mockToken'))
      .rejects.toEqual({
        errors: expect.arrayContaining([
          expect.objectContaining({
            token: 'token1',
            error: expect.any(Object),
          }),
        ]),
      });
  });

  it('should reject with both records and errors when some tokens succeed and some fail', async () => {
    const mockTokenRecords = [
      { token: 'token1', iframeName: 'iframe1', redaction: 'PLAIN_TEXT' },
      { token: 'token2', iframeName: 'iframe2', redaction: 'PLAIN_TEXT' },
    ];

    const mockClient = Client.fromJSON(clientData.clientJSON);
    
    jest.spyOn(mockClient, 'request')
      .mockResolvedValueOnce({ records: [{ token: 'token1', value: 'value1', valueType: 'STRING' }] })
      .mockRejectedValueOnce({
        error: {
          code: '404',
          description: 'Token not found',
        },
      });

    await expect(fetchRecordsByTokenIdComposable(mockTokenRecords, mockClient, 'mockToken'))
      .rejects.toEqual({
        records: expect.any(Array),
        errors: expect.any(Array),
      });
  });

  it('should use default PLAIN_TEXT redaction when redaction is not provided', async () => {
    const mockTokenRecords = [
      { token: 'token1', iframeName: 'iframe1' }, // No redaction
    ];

    const mockClient = Client.fromJSON(clientData.clientJSON);
    
    jest.spyOn(mockClient, 'request').mockResolvedValue({
      records: [{ token: 'token1', value: 'value1', valueType: 'STRING' }],
    });

    await fetchRecordsByTokenIdComposable(mockTokenRecords, mockClient, 'mockToken');
    
    expect(mockClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('PLAIN_TEXT'),
      })
    );
  });

  it('should handle empty token records array', async () => {
    const mockClient = Client.fromJSON(clientData.clientJSON);
    
    const result = await fetchRecordsByTokenIdComposable([], mockClient, 'mockToken');
    
    expect(result).toEqual({ records: [] });
  });

  it('should include frameId in the response', async () => {
    const mockTokenRecords = [
      { token: 'token1', iframeName: 'iframe1', redaction: 'PLAIN_TEXT' },
    ];

    const mockClient = Client.fromJSON(clientData.clientJSON);
    
    jest.spyOn(mockClient, 'request').mockResolvedValue({
      records: [{ token: 'token1', value: 'value1', valueType: 'STRING' }],
    });

    const result = await fetchRecordsByTokenIdComposable(mockTokenRecords, mockClient, 'mockToken');
    
    expect(result.records[0]).toHaveProperty('frameId', 'iframe1');
  });
});
describe("formatRecordsForClient fn test",()=>{
  test("only success records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231", "valueType" : "STRING"}] }
    const fnResponse = formatRecordsForClient(testInput, {"7402-2242-2342-232": "231"});
    expect(fnResponse.success.length).toBe(1);
    expect(fnResponse.errors).toBeUndefined();
  });
  test("both success and error records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231", "valueType" : "STRING"}],"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClient(testInput,{"7402-2242-2342-232": "231"});
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success.length).toBe(1);
  });
  test("only error records",()=>{
    const testInput = {"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClient(testInput);
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success).toBeUndefined();
  });
});

describe('getFileURLForRender', () => {
  it('should return the file URL when the request is successful', async () => {
    const mockSkyflowIdRecord = {
      skyflowID: 'mockSkyflowID',
      column: 'mockColumn',
      table: 'mockTable',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON); 

    mockClient.request = jest.fn().mockResolvedValue('mockResponse');

    expect(getFileURLForRender(mockSkyflowIdRecord, mockClient, 'mockAuthToken')).resolves.toEqual('mockResponse');
});

  it('should throw an error when the request fails', async () => {
    const mockSkyflowIdRecord = {
      skyflowID: 'mockSkyflowID',
      column: 'mockColumn',
      table: 'mockTable',
      token: 'mockToken',
    };

    const mockClient = Client.fromJSON(clientData.clientJSON); 

    mockClient.request = jest.fn().mockRejectedValue(new Error('Mock error message'));

    expect(getFileURLForRender(mockSkyflowIdRecord, mockClient, 'mockAuthToken')).rejects.toThrow();
  });
});
