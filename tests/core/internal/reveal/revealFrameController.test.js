import bus from 'framebus';
import RevealFrameController from '../../../../src/core/internal/reveal/RevealFrameController';
import clientModule from '../../../../src/client';
import { ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/core/constants';
import { Env, LogLevel } from '../../../../src/utils/common';
import { fetchRecordsByTokenId} from '../../../../src/core-utils/reveal';

const mockUuid = '1234'; 
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
}));

jest.mock("../../../../src/core-utils/reveal",()=>({
  __esModule: true,
  fetchRecordsByTokenId :jest.fn(),
  formatRecordsForClient:jest.fn(),
  formatRecordsForIframe:jest.fn(),
  applyFormatRegex:jest.fn()
}));

const on = jest.fn();
const off = jest.fn();
const emit = jest.fn();
const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientData = {
  client: {
    config: { ...skyflowConfig },
    metadata: {},
  },
  clientJSON:{
    context: { logLevel: LogLevel.ERROR,env:Env.PROD},
    config:{
      getBearerToken:jest.fn().toString()
    }
  } 
}
describe('RevealFrameController Class', () => {
  
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off,
      emit
    });
  });

  test('init method', () => {
    const testFrameController = RevealFrameController.init(mockUuid);
    expect(testFrameController).toBeInstanceOf(RevealFrameController);
  });

  test('init method 2', () => {
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client}));
    const testFrameController = RevealFrameController.init(mockUuid);
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY+mockUuid);
    emitCb(clientData);
  });

  test("reveal request listener success call back",(done)=>{
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client}));
    fetchRecordsByTokenId.mockImplementation(()=>{
      return new Promise((resolve,)=>{
        resolve({
          records:[{token:"1815-6223-1073-1425",value:"3242"}]
        })
      });
    })
    const testFrameController = RevealFrameController.init(mockUuid);  
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY+mockUuid);
    emitCb(clientData);
    
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid;
    const data = {
      "records":[
        {
          token: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName,data,emitterCb);
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[0][1];
    onCb(data,emitterCb);
  
    const responseEventName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+ mockUuid;
    bus.emit(responseEventName,{});
    setTimeout(()=>{
      expect(emitterCb).toBeCalled();
      done();
    },1000);  
  });

  test("reveal request listener success failure call back",()=>{
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client}));
    fetchRecordsByTokenId.mockImplementation(()=>{
      return new Promise((_,reject)=>{
        reject({
          errors:[{token:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
        })
      });
    });
    const testFrameController = RevealFrameController.init(mockUuid); 
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY+mockUuid);
    emitCb(clientData);
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid;
    const data = {
      "records":[
        {
          token: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName,data,emitterCb);
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[0][1];
    onCb(data,emitterCb);
  
    const responseEventName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+ mockUuid;
    bus.emit(responseEventName,{});
    setTimeout(()=>{
      expect(emitterCb).toBeCalled();
      done();
    },1000); 

  });
  
});