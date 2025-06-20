/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { COLLECT_TYPES, ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/core/constants';
import clientModule from '../../../../src/client';
import * as busEvents from '../../../../src/utils/bus-events';
import { LogLevel, Env } from '../../../../src/utils/common';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';
import SkyflowError from '../../../../src/libs/skyflow-error';
busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
const on = jest.fn();
const emit = jest.fn();
jest.mock('../../../../src/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => (mockUuid)),
}));
const mockUuid = '1244'
const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientData = {
  client: {
    config: { ...skyflowConfig },
    metadata: {
      uuid: mockUuid,
    },
  },
  context: { logLevel: LogLevel.ERROR, env: Env.PROD },
};


const toJson = jest.fn(() => ({
    config: {},
    metaData: {
      uuid: '',
      sdkVersion:'skyflow-react-js@1.2.3'
    }
  }))

describe('Uploading files to the vault', () => {
    let emitSpy;
    let targetSpy;
    let windowSpy;
    let testValue;
  
    beforeEach(() => {
      emitSpy = jest.spyOn(bus, 'emit');
      targetSpy = jest.spyOn(bus, 'target');
      targetSpy.mockReturnValue({
        on,
      });
  
      testValue = {
        iFrameFormElement: {
          fieldType: 'FILE_INPUT',
          state: {
            value: {
              type: 'file',
              name: 'test-file.txt',
              size: 1024,
            },
            isFocused: false,
            isValid: false,
            isEmpty: true,
            isComplete: false,
            name: 'test-name',
            isRequired: true,
            isTouched: false,
            selectedCardScheme: '',
          },
          tableName: 'test-table-name',
          preserveFileName: true,
          onFocusChange: jest.fn()
        }
      }
      windowSpy = jest.spyOn(window,'parent','get');
      windowSpy.mockImplementation(() => ({
        frames: {},
      }));
      busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
    });
  
    afterEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      jest.restoreAllMocks();
      delete window.parent.frames;
      if (windowSpy) {
        windowSpy.mockRestore();
      }
    });
  
    test('should successfully handle FILE_UPLOAD event and upload files', (done) => {
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
      const clientReq = jest.fn(() => Promise.resolve({
        fileUploadResponse: [
          {skyflow_id:"file-upload-skyflow-id"}
        ]
      }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        expect(cb2.mock.calls[0][0].fileUploadResponse).toBeDefined();
        expect(cb2.mock.calls[0][0].fileUploadResponse.length).toBe(1);
        done();
      }, 1000);
    });
    test('should successfully handle FILE_UPLOAD validation', (done) => {
          testValue.iFrameFormElement.state.value.name = 'test file.txt';
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        console.log(cb2.mock.calls[0][0].error.errorResponse[0]);
        done();
      }, 1000);
    });
    test('should successfully handle FILE_UPLOAD validation case 2', (done) => {
          testValue.iFrameFormElement.state.value.name = 'test-file.txt';
      testValue.iFrameFormElement.state.value.size = 1024 * 1024 * 32;
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        console.log(cb2.mock.calls[0][0].error.errorResponse[0]);
        done();
      }, 1000);
    });
    test('should successfully handle FILE_UPLOAD validation case 3', (done) => {
          testValue.iFrameFormElement.state.value.name = 'test-file.txt';
      testValue.iFrameFormElement.state.value.size = 0;
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
      const clientReq = jest.fn();
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        console.log(cb2.mock.calls[0][0].error.errorResponse[0]);
        done();
      }, 1000);
    });

    test('should handle partial error FILE_UPLOAD event and upload files', (done) => {
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
      const clientReq = jest.fn(() => Promise.resolve({
        fileUploadResponse: [
          {skyflow_id:"file-upload-skyflow-id"}
        ],
        error: "error"
      }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);

      setTimeout(() => {
        expect(cb2).toHaveBeenCalled();
        done();
      }, 1000);
    });
    test('should fail upload files', (done) => {
      const clientReq = jest.fn(() => Promise.resolve({
        fileUploadResponse: [
          {skyflow_id:"file-upload-skyflow-id"}
        ]
      }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        expect(cb2).toHaveBeenCalled();
  
        const firstCallArg = cb2.mock.calls[0][0];
        expect(firstCallArg).toBeDefined();
        expect(firstCallArg).toHaveProperty('error');
        expect(firstCallArg.error).toEqual(expect.any(Object));
  
        done();
      }, 1000);
    });
    test('should fail upload files when client is reject', (done) => {
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
      const clientReq = jest.fn(() => Promise.reject({
        error: "error"
      }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        expect(cb2).toHaveBeenCalled();
        const firstCallArg = cb2.mock.calls[0][0];
        expect(firstCallArg).toBeDefined();
        expect(firstCallArg).toEqual({"error": {"errorResponse": [{"error": "error"}]}});

        done();
      }, 1000);
    });
        
    test('should fail upload files when client is null', (done) => {
      windowSpy.mockImplementation(()=>({
        frames:{
          'element:FILE_INPUT:ID:CONTAINER-ID:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => null);
  
      SkyflowFrameController.init();
      
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);    
      
      const onCb = on.mock.calls[1][1];
      const data = {
        type: COLLECT_TYPES.FILE_UPLOAD,
        elementIds: [
          "element:FILE_INPUT:ID"
      ],
      containerId: "CONTAINER-ID"
      };
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        expect(cb2).toHaveBeenCalled();
        const firstCallArg = cb2.mock.calls[0][0];
        expect(firstCallArg).toBeDefined();
        done();
      }, 1000);
    });
});
  
describe('SkyflowFrameController - tokenize function', () => {
  let emitSpy;
  let targetSpy;
  let windowSpy;
  let testValue;
  let testValue2;

  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });

    testValue = {
      iFrameFormElement: {
        fieldType: 'TEXT_INPUT',
        state: {
          value: 'test-value',
          isFocused: false,
          isValid: true,
          isEmpty: false,
          isComplete: true,
          name: 'test-name',
          isRequired: true,
          isTouched: false,
        },
        tableName: 'test-table-name',
        onFocusChange: jest.fn(),
        getUnformattedValue: jest.fn(() => 'unformatted-value'),
      },
    };
    testValue2 = {
      iFrameFormElement: {
        fieldType: 'TEXT_INPUT',
        state: {
          value: 'test-value2',
          isFocused: false,
          isValid: true,
          isEmpty: false,
          isComplete: true,
          name: 'test-name2',
          isRequired: true,
          isTouched: false,
        },
        tableName: 'test-table-name2',
        skyflowID: 'id',
        onFocusChange: jest.fn(),
        getUnformattedValue: jest.fn(() => 'unformatted-value2'),
      },
    };


    windowSpy = jest.spyOn(window, 'parent', 'get');
    windowSpy.mockImplementation(() => ({
      frames: {},
    }));
    busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetModules();
    delete window.parent.frames;
    if (windowSpy) {
      windowSpy.mockRestore();
    }
  });


  test('should fail tokenize when client is null', async () => {
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => null);


    const controller = SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };

    const cb2 = jest.fn();

    try {
      onCb(data, cb2);
    } catch (err) {
      expect(err).toBeInstanceOf(SkyflowError);
    }
  });

  test('should tokenize data successfully', async () => {
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
        'frameId2:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue2),
          },
        },
      },
    }));

    const insertResponse = {
      responses: [
        { records: [{ skyflow_id: 'id1' }] },
        { fields: { card_number: 'token1', '*': 'ignored' } },
        // { records: [{ skyflow_id: 'id' }] }, 
        // { fields: { card_number: 'token1', '*': 'ignored' } },
      ]
    };
    const updateError = { 
      errors: [{ error: { code: 404, description: 'Record not found' } }]
    };
    
    let requestCount = 0;
    const clientReq = jest.fn((arg) => {
      requestCount++;
      if (arg.requestMethod === 'PUT') {
        return Promise.reject(updateError);
      }
      if (arg.requestMethod === 'POST' && !arg.url.includes('/files')) {
        return Promise.resolve(insertResponse);
      }
      return Promise.resolve(insertResponse);
    });
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
        {
          frameId: 'frameId2',
          elementId: 'elementId2',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      console.log('=======================>>>', cb2.mock.calls);
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });
  test('should tokenize data successfully case 2', async () => {
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
        'frameId2:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue2),
          },
        },
      },
    }));

    const insertResponse = {
      responses: [
        { records: [{ skyflow_id: 'id1' }] },
        { fields: { card_number: 'token1', '*': 'ignored' } },
      ]
    };
    const updateRes = { records: [{ skyflow_id: 'id',
      fields: {
        card_number: '4111-xxxx-xxxx-1111',
        cvv: '123',
      },     
    }] }
    
    let requestCount = 0;
    const clientReq = jest.fn((arg) => {
      // console.log('Request Count:', requestCount, 'Arg:', arg);
      requestCount++;
      if (arg.requestMethod === 'PUT') {
        return Promise.resolve(updateRes);
      }
      if (arg.requestMethod === 'POST' && !arg.url.includes('/files')) {
        return Promise.resolve(insertResponse);
      }
      return Promise.resolve(insertResponse);
    });
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
        {
          frameId: 'frameId2',
          elementId: 'elementId2',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });
  test('should tokenize data successfully case 3', async () => {
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId2:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue2),
          },
        },
      },
    }));

    const insertResponse = {
      responses: [
        { records: [{ skyflow_id: 'id1' }] },
        { fields: { card_number: 'token1', '*': 'ignored' } },
      ]
    };
    const updateRes = { records: [{ skyflow_id: 'id',
      fields: {
        card_number: '4111-xxxx-xxxx-1111',
        cvv: '123',
      },     
    }] }
    
    let requestCount = 0;
    const clientReq = jest.fn((arg) => {
      console.log('Request Count:', requestCount, 'Arg:', arg);
      requestCount++;
      if (arg.requestMethod === 'PUT') {
        return Promise.resolve(updateRes);
      }
      if (arg.requestMethod === 'POST' && !arg.url.includes('/files')) {
        return Promise.resolve(insertResponse);
      }
      return Promise.resolve(insertResponse);
    });
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId2',
          elementId: 'elementId2',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });
  test('should tokenize data error case 1', async () => {
    testValue2.iFrameFormElement.skyflowID = '';
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId2:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue2),
          },
        },
      },
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId2',
          elementId: 'elementId2',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].errors).toBeDefined();
    }, 1000);
  });
  test('should tokenize data error case 2', async () => {
    testValue2.iFrameFormElement.skyflowID = null;
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId2:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue2),
          },
        },
      },
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId2',
          elementId: 'elementId2',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].errors).toBeDefined();
    }, 1000);
  });
  test('should tokenize data error case 2', async () => {
    testValue2.iFrameFormElement.skyflowID = 'null';
    testValue2.iFrameFormElement.state.isValid = false;
    testValue2.iFrameFormElement.state.isRequired = false;
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId2:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue2),
          },
        },
      },
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId2',
          elementId: 'elementId2',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].errors).toBeDefined();
    }, 1000);
  });
  test('should tokenize data partial successfully', async () => {
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve(
      {
      responses: [
        { records: [{ skyflow_id: 'id1' }] },
        { fields: { card_number: 'token1', '*': 'ignored' } },
      ]
    }
    ));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });
  test('should tokenize data partial successfully case 2', async () => {
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));
    const mockResponseBody = {
      responses: [
        { records: [{ skyflow_id: 'id1' }] },
        { fields: { card_number: 'token1', '*': 'ignored' } },
      ]
    };
    let requestCount = 0;
    const clientReq = jest.fn((arg) => {
      console.log('Request Count:', requestCount, 'Arg:', arg);
      requestCount++;
      // if (arg.requestMethod === 'PUT') {
      //   return Promise.resolve(updateRes);
      // }
      if (arg.requestMethod === 'POST' && !arg.url.includes('/files')) {
        return Promise.resolve(mockResponseBody);
      }
      // return Promise.resolve(insertResponse);
    });

    // const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }], error: 'Partial error' }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });

  test('should handle validations and set value when all conditions are met', async () => {
    testValue.iFrameFormElement.validations = [{ rule: 'regex', value: '.*' }];
    testValue.iFrameFormElement.state.isValid = true;
    testValue.iFrameFormElement.state.isComplete = true;
    const setValueMock = jest.fn();
    const onFocusChangeMock = jest.fn();
    testValue.iFrameFormElement.setValue = setValueMock;
    testValue.iFrameFormElement.onFocusChange = onFocusChangeMock;
  
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));
  
    jest.spyOn(require('../../../../src/core-utils/collect'), 'checkForElementMatchRule').mockReturnValue(true);
    jest.spyOn(require('../../../../src/core-utils/collect'), 'checkForValueMatch').mockReturnValue(true);

    jest.spyOn(require('../../../../src/core-utils/collect'), 'constructElementsInsertReq').mockImplementation(() => {
        return [
          { records: [] }, 
          { updateRecords: [{ table: 'testTable', fields: { key: 'value' }, skyflowID: '123' }] },
        ];
      });
  
    const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson,
    }));
  
    SkyflowFrameController.init();
  
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
  
    const onCb = on.mock.calls[1][1];
  
    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };
  
    const cb2 = jest.fn();
  
    onCb(data, cb2);
  
    setTimeout(() => {
      expect(setValueMock).toHaveBeenCalledWith(testValue.iFrameFormElement.state.value);
      expect(onFocusChangeMock).toHaveBeenCalledWith(false);
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
});

  test('successful insert and update requests', async () => {
    testValue.iFrameFormElement.skyflowID = 'test-id'
      windowSpy.mockImplementation(()=>({
        frames:{
          'frame1:container123:ERROR:':{document:{
              getElementById:()=>(testValue)
          }},
          'frame2:container123:ERROR:':{document:{
              getElementById:()=>(testValue)
          }}
        }
      }));
    const insertResponse = {
      records: [{ skyflow_id: 'inserted-id' }],
    };
    const updateResponse =  {
      tokens: {
        card_number: 'token123',
        cvv: 'token456'
      }
    };

    const clientReq = jest.fn((arg) => {
      return Promise.resolve(updateResponse);
    });

    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[1][1];
    const data = {
      type: 'COLLECT',
      elementIds: [
        { frameId: 'frame1', elementId: 'element1' },
        { frameId: 'frame2', elementId: 'element2' },
      ],
      containerId: 'container123',
    };
    const cb2 = jest.fn();
    onCb(data, cb2);
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBeDefined()
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
    }, 1000);
  });

  test('should successfully tokenize data when fieldType is checkbox', async () => {
      testValue.iFrameFormElement.fieldType = 'checkbox';
      windowSpy.mockImplementation(() => ({
        frames: {
          'frameId:containerId:ERROR:': {
            document: {
              getElementById: jest.fn(() => testValue),
            },
          },
        },
      }));
  
      const clientReq = jest.fn(() => Promise.resolve({
        responses: [
          {
            records: [
              {
                skyflow_id: 'test-id-1',
              },
            ],
          },
          {
            fields: {
              '*': 'some-random',
              card_number: '4111-xxxx-xxxx-1111',
              cvv: '123',
            },
          },
        ],
      }
      ));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
  
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);
      
      const onCb = on.mock.calls[1][1];
  
      const data = {
        containerId: 'containerId',
        tokens: true,
        type: 'COLLECT',
        elementIds: [
          {
            frameId: 'frameId',
            elementId: 'elementId',
          },
          {
            frameId: 'frameId',
            elementId: 'elementId',
          }
        ],
      };
  
      const cb2 = jest.fn();
  
      onCb(data, cb2);
  
      setTimeout(() => {
        expect(cb2.mock.calls[0][0].records).toBeDefined();
      }, 1000);
  });

  test('should successfully tokenize data when fieldType is not checkbox', async () => {
    testValue.iFrameFormElement.skyflowID = undefined
    testValue.iFrameFormElement.fieldType = 'textarea';
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve({
      responses: [
        {
          records: [
            {
              skyflow_id: 'test-id-1',
            },
          ],
        },
        {
          fields: {
            '*': 'some-random',
            card_number: '4111-xxxx-xxxx-1111',
            cvv: '123',
          },
        },
      ],
    }
    ));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
        {
          frameId: 'frameId',
          elementId: 'elementId',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });

  test('should successfully tokenize data when fieldType is not checkbox and validation exist', async () => {
    testValue.iFrameFormElement.skyflowID = undefined
    testValue.iFrameFormElement.fieldType = 'textarea';
    testValue.iFrameFormElement.validations = [
      {
        rule: 'regex',
        value: '.*',
        type: 'ELEMENT_VALUE_MATCH_RULE',
      }
    ];
    testValue.iFrameFormElement.isMatchEqual = jest.fn(() => true);
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve({
      responses: [
        {
          records: [
            {
              skyflow_id: 'test-id-1',
            },
          ],
        },
        {
          fields: {
            '*': 'some-random',
            card_number: '4111-xxxx-xxxx-1111',
            cvv: '123',
          },
        },
      ],
    }
    ));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
        {
          frameId: 'frameId',
          elementId: 'elementId',
        }
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });


  test('should fail tokenize data when doesClientHasError is true', async () => {
      testValue.iFrameFormElement.state.isValid = false;
      testValue.iFrameFormElement.doesClientHasError = true;
      windowSpy.mockImplementation(() => ({
        frames: {
          'frameId:containerId:ERROR:': {
            document: {
              getElementById: jest.fn(() => testValue),
            },
          },
        },
      }));
  
      const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
  
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);
      
      const onCb = on.mock.calls[1][1];
  
      const data = {
        containerId: 'containerId',
        tokens: true,
        type: 'COLLECT',
        elementIds: [
          {
            frameId: 'frameId',
            elementId: 'elementId',
          },
        ],
      };
  
      const cb2 = jest.fn();
  
      onCb(data, cb2);

      setTimeout(() => {
      expect(cb2).toHaveBeenCalled();
      
      const firstArg = cb2.mock.calls[0][0];
      expect(firstArg).toBeDefined();
      expect(firstArg).toHaveProperty('error');
      done();
      }, 1000);
  });
  test('should fail tokenize data when doesClientHasError is false', async () => {
      testValue.iFrameFormElement.state.isValid = false;
      testValue.iFrameFormElement.doesClientHasError = false;
      windowSpy.mockImplementation(() => ({
        frames: {
          'frameId:containerId:ERROR:': {
            document: {
              getElementById: jest.fn(() => testValue),
            },
          },
        },
      }));
  
      const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
  
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);
      
      const onCb = on.mock.calls[1][1];
  
      const data = {
        containerId: 'containerId',
        tokens: true,
        type: 'COLLECT',
        elementIds: [
          {
            frameId: 'frameId',
            elementId: 'elementId',
          },
        ],
      };
  
      const cb2 = jest.fn();
  
      onCb(data, cb2);

      setTimeout(() => {
      expect(cb2).toHaveBeenCalled();
      
      const firstArg = cb2.mock.calls[0][0];
      expect(firstArg).toBeDefined();
      expect(firstArg).toHaveProperty('error');
      done();
      }, 1000);
  });

  test('should fail tokenize data when skyflowID is null or empty', async () => {
      testValue.iFrameFormElement.state.isValid = false;
      testValue.iFrameFormElement.doesClientHasError = false;
      windowSpy.mockImplementation(() => ({
        frames: {
          'frameId:containerId:ERROR:': {
            document: {
              getElementById: jest.fn(() => testValue),
            },
          },
        },
      }));
  
      const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
      jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
        ...clientData.client,
        request: clientReq,
        toJSON: toJson
      }));
  
      SkyflowFrameController.init();
  
      const emitEventName = emitSpy.mock.calls[1][0];
      const emitCb = emitSpy.mock.calls[1][2];
      expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
      emitCb(clientData);
      
      const onCb = on.mock.calls[1][1];
  
      const data = {
        containerId: 'containerId',
        tokens: true,
        type: 'COLLECT',
        elementIds: [
          {
            frameId: 'frameId',
            elementId: 'elementId',
          },
        ],
      };
  
      const cb2 = jest.fn();
  
      onCb(data, cb2);

      setTimeout(() => {
      expect(cb2).toHaveBeenCalled();
      
      const firstArg = cb2.mock.calls[0][0];
      expect(firstArg).toBeDefined();
      expect(firstArg).toHaveProperty('error');
      done();
      }, 1000);
  });

  test('should  tokenize data when skyflowID is null or empty and not checkbox', async () => {
    testValue.iFrameFormElement.fieldType = 'textarea';
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });

  test('should  tokenize data when skyflowID is null or empty and not checkbox', async () => {
    testValue.iFrameFormElement.fieldType = 'textarea';
    testValue.iFrameFormElement.skyflowID = 'test-skyflow-id';
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });

  test('should  tokenize data when skyflowID is undefined and not checkbox', async () => {
    testValue.iFrameFormElement.fieldType = 'textarea';
    testValue.iFrameFormElement.skyflowID = undefined;
    windowSpy.mockImplementation(() => ({
      frames: {
        'frameId:containerId:ERROR:': {
          document: {
            getElementById: jest.fn(() => testValue),
          },
        },
      },
    }));

    const clientReq = jest.fn(() => Promise.resolve({responses: [{ records: [{ skyflow_id: 'id1' }] },{ fields: { card_number: 'token1' } }] }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({
      ...clientData.client,
      request: clientReq,
      toJSON: toJson
    }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY);
    emitCb(clientData);
    
    const onCb = on.mock.calls[1][1];

    const data = {
      containerId: 'containerId',
      tokens: true,
      type: 'COLLECT',
      elementIds: [
        {
          frameId: 'frameId',
          elementId: 'elementId',
        },
      ],
    };

    const cb2 = jest.fn();

    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeDefined();
    }, 1000);
  });
});
