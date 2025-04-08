/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { COLLECT_TYPES, ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/core/constants';
import clientModule from '../../../../src/client';
import * as busEvents from '../../../../src/utils/bus-events';
import { LogLevel, Env } from '../../../../src/utils/common';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';
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
            value: 'test',
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
  });
  
  describe('SkyflowFrameController - tokenize function', () => {
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
          skyflowID: '',
          onFocusChange: jest.fn(),
          getUnformattedValue: jest.fn(() => 'unformatted-value'),
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
  
    test('should successfully tokenize data', async () => {
      windowSpy.mockImplementation(() => ({
        frames: {
          'frameId:containerId:ERROR:': {
            document: {
              getElementById: jest.fn(() => testValue),
            },
          },
        },
      }));
  
      const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }] }));
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
    
        const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }] }));
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
    
        const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }] }));
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
    
        const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }] }));
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
    
        const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }] }));
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
              { updateRecords: [{ table: 'testTable', fields: { key: 'value' }, skyflowID: '123' }] }, // Mocked update records
            ];
          });
      
        const clientReq = jest.fn(() => Promise.resolve({ records: [{ skyflow_id: 'test-id' }] }));
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
  });