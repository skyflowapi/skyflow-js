/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import RevealContainer from "../../../../src/core/external/reveal/reveal-container";
import RevealFrameController from '../../../../src/core/internal//reveal/reveal-frame-controller';
import clientModule from '../../../../src/client';
import { ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/core/constants';
import { Env, LogLevel } from '../../../../src/utils/common';
import { fetchRecordsByTokenId, getFileURLFromVaultBySkyflowID, formatRecordsForRender, formatForRenderClient} from '../../../../src/core-utils/reveal';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';
import * as busEvents from '../../../../src/utils/bus-events';
import { JSDOM } from 'jsdom';


const containerId = '1234'; 
const elementId = '1234'; 

const mockUuid = '1234'; 
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
}));
const groupEmittFn = jest.fn();
let groupOnCb;
const groupEmiitter = {
  _emit: groupEmittFn,
  on:jest.fn().mockImplementation((args,cb)=>{
    groupOnCb = cb;
  })
}

jest.mock("../../../../src/core-utils/reveal",()=>({
  __esModule: true,
  fetchRecordsByTokenId :jest.fn(),
  formatRecordsForClient:jest.fn(),
  formatRecordsForIframe:jest.fn(),
  getFileURLFromVaultBySkyflowID: jest.fn(),
  applyFormatRegex:jest.fn(),
  formatRecordsForRender: jest.fn(),
  formatForRenderClient: jest.fn(),
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
      ...skyflowConfig ,
      getBearerToken: jest.fn().toString()
    }
  },
  uuid: mockUuid,
  context: { logLevel: LogLevel.ERROR,env:Env.PROD}, 
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
          records:[{token:"1815-6223-1073-1425",value:"3242", valueType : "STRING"}]
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

describe('test render file request', () => { 
  let emitSpy;
  let targetSpy;
  let onSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    onSpy = jest.spyOn(bus, 'on');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      emit
    });

    busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));

  });

  test("render files",()=>{
    const clientReq = jest.fn(() => Promise.reject({
      errors:[{skyflowID:"1815-6223-1073-1425","error":{"code":404,"description":"id not found"}}]
    }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(); 

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);
  
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName, data, emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  on.mock.calls[1][1];
    onCb(data,emitterCb);
  });


  test("render files 2",()=>{
    const clientReq = jest.fn(() => Promise.resolve({
      accessToken: "access token"
    }));
  
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(mockUuid); 
    getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
      return new Promise((_,reject)=>{
        reject({
          errors:[{skyflowID:"1815-6223-1073-1425", "error":{"code":404,"description":"id not found"}}]
        })
      });
    });
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+mockUuid);
    emitCb(clientData);
  
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName, data, emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  on.mock.calls[1][1];
    onCb(data,emitterCb);
  });


  test("render files error",()=>{
    const clientReq = jest.fn(() => Promise.resolve({
      accessToken: "access token"
    }));
  
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(mockUuid); 
    getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
      return new Promise((resolve,_)=>{
        resolve({
          fields: {
            file: '123',
            skyflow_id: '1234'
          }
        })
      });
    });
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+mockUuid);
    emitCb(clientData);
  
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName, data, emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  on.mock.calls[1][1];
    onCb(data,emitterCb);
  });
  test("render files success",()=>{
    const clientReq = jest.fn(() => Promise.resolve({
      accessToken: "access token"
    }));
  
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(mockUuid); 
    getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
      return new Promise((resolve,_)=>{
        resolve({
          fields: {
            file: '123',
            skyflow_id: '1234'
          }
        })
      });
    });
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+mockUuid);
    emitCb(clientData);
  
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName, data, emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  on.mock.calls[1][1];
    onCb(data,emitterCb);
  });
test("render request success",()=>{
  const clientReq = jest.fn(() => Promise.resolve({
    accessToken: "access token"
  }));
  getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
    return new Promise((_,reject)=>{
      reject({
        fields: {
          file: '123',
          skyflow_id: '1234'
        }
      })
    });
  });
  formatRecordsForRender.mockImplementation(()=>{
    return {fields: { skyflow_id: "1815-6223-1073-1425",
    url: "column",
    column: "column",
    table: "table"}}
  });
  jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
  const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
  let ele = testRevealContainer.create({
    skyflowID: "1815-6223-1073-1425",
    column: "column",
    table: "table"
  });
  const data = {
    skyflowID: "1815-6223-1073-1425",
    column: "column",
    table: "table",
    containerId:mockUuid
  }

  const emitEventName1 = onSpy.mock.calls[0][0];
  const emitCb2 = onSpy.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+ mockUuid);
  emitCb2(clientData, jest.fn());
  const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
  document = window.document;
  const testEmptyDiv = document.createElement("div");
  testEmptyDiv.setAttribute("id", "mockElement");
  document.body.appendChild(testEmptyDiv);
  expect(document.getElementById("mockElement")).not.toBeNull();
    
  ele.mount("#mockElement");
  try{
    ele.renderFile()
    } catch {
    console.log('error')
  }

  const emitEventName = emitSpy.mock.calls[0][0];;
  const emitCb = emitSpy.mock.calls[0][2];
  expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid);
  emitCb({fields: { skyflow_id: "1815-6223-1073-1425",
  url: "column",
  column: "column",
  table: "table"}});
});


test("render request error",()=>{
  const clientReq = jest.fn(() => Promise.resolve({
    accessToken: "access token"
  }));
  getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
    return new Promise((_,reject)=>{
      reject({
        errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
      })
    });
  });
  formatRecordsForRender.mockImplementation(()=>{
    return {
      errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
    }
  });
  jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
  const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
  let ele = testRevealContainer.create({
    skyflowID: "1815-6223-1073-1425",
    column: "column",
    table: "table"
  });
  const data = {
    skyflowID: "1815-6223-1073-1425",
    column: "column",
    table: "table",
    containerId:mockUuid
  }

  const emitEventName1 = onSpy.mock.calls[0][0];
  const emitCb2 = onSpy.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+ mockUuid);
  emitCb2(clientData, jest.fn());
  const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
  document = window.document;
  const testEmptyDiv = document.createElement("div");
  testEmptyDiv.setAttribute("id", "mockElement");
  document.body.appendChild(testEmptyDiv);
  expect(document.getElementById("mockElement")).not.toBeNull();
    
  ele.mount("#mockElement");
  try{
    ele.renderFile().catch(error => console.log(error))
    } catch {
    console.log('error')
  }
  console.log('loggggg', emitSpy.mock.calls);

  const emitEventName = emitSpy.mock.calls[0][0];;
  const emitCb = emitSpy.mock.calls[0][2];
  console.log(emitCb);
  expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid);
  emitCb({
    errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
  });
});

test("render request case 2",()=>{
  const clientReq = jest.fn(() => Promise.resolve({
    accessToken: "access token"
  }));
  getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
    return new Promise((_,reject)=>{
      reject({
        errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
      })
    });
  });
  formatRecordsForRender.mockImplementation(()=>{
    return {
      errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
    }
  });
  jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
  const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
  let ele = testRevealContainer.create({
    skyflowID: "1815-6223-1073-1425",
    column: "column",
    table: "table"
  });
  const data = {
    skyflowID: "1815-6223-1073-1425",
    column: "column",
    table: "table",
    containerId:mockUuid
  }

  const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
  document = window.document;
  const testEmptyDiv = document.createElement("div");
  testEmptyDiv.setAttribute("id", "mockElement");
  document.body.appendChild(testEmptyDiv);
  expect(document.getElementById("mockElement")).not.toBeNull();
    
  ele.mount("#mockElement");
  try{
    ele.renderFile().catch(error => console.log(error))
    } catch {
    console.log('error')
  }
  const emitEventName1 = onSpy.mock.calls[0][0];
  const emitCb2 = onSpy.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+ mockUuid);
  emitCb2(clientData, jest.fn());
});
})
})
