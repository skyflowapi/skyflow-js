/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import RevealContainer from "../../../../src/core/external/reveal/reveal-container";
import RevealFrameController from '../../../../src/core/internal//reveal/reveal-frame-controller';
import clientModule from '../../../../src/client';
import { ELEMENT_EVENTS_TO_IFRAME , DEFAULT_FILE_RENDER_ERROR} from '../../../../src/core/constants';
import { Env, LogLevel } from '../../../../src/utils/common';
import { fetchRecordsByTokenId, getFileURLFromVaultBySkyflowID, formatRecordsForRender, formatForRenderClient} from '../../../../src/core-utils/reveal';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';
import * as busEvents from '../../../../src/utils/bus-events';
import { JSDOM } from 'jsdom';
import SkyflowContainer from '../../../../src/core/external/skyflow-container';
import Client from '../../../../src/client';
import RevealFrame from "../../../../src/core/internal/reveal/reveal-frame";

// global.ResizeObserver = jest.fn(() => ({
//   observe: jest.fn(),
//   disconnect: jest.fn(),
// }));

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
    metadata: {
      uuid: mockUuid,
    },
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
const client = new Client(clientData.client.config, clientData);
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
  let controller = new SkyflowContainer(client,{
    logLevel:LogLevel.DEBUG,
    env:Env.DEV
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


  test("render files 2", ()=>{
    const clientReq = jest.fn(() => Promise.resolve({
      accessToken: "access token"
    }));
  
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(mockUuid); 
    getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
      return new Promise((resolve,_)=>{
        resolve({
          fields: {
            column: 'url',
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
      "records":
        {
          skyflowID: "1815-6223-1073-1425",
          column: 'colum',
          table:'table'
        },
      "containerId": mockUuid
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName, data, emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  on.mock.calls[1][1];
    onCb(data,emitterCb);

    const responseEvent = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY
    bus.emit(responseEvent, {url: "url"}, emitterCb);
    const emitEventName2 = emitSpy.mock.calls[2][0];
    const emitCb2 = emitSpy.mock.calls[2][2];
    expect(emitEventName2).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY);
    emitCb2(clientData);
  });


  test("render files error",()=>{
    const clientReq = jest.fn(() => Promise.resolve({
      accessToken: "access token"
    }));
  
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(mockUuid); 
    getFileURLFromVaultBySkyflowID.mockImplementation(()=>{
      return new Promise((_,reject)=>{
        reject({
          error: DEFAULT_FILE_RENDER_ERROR
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

    const responseEvent = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY
    bus.emit(responseEvent, DEFAULT_FILE_RENDER_ERROR, emitterCb);

    const emitEventName2 = emitSpy.mock.calls[2][0];
    const emitCb2 = emitSpy.mock.calls[2][2];
    expect(emitEventName2).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY);
    emitCb2({DEFAULT_FILE_RENDER_ERROR});
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
  let controller = new SkyflowContainer(client,{
    logLevel:LogLevel.DEBUG,
    env:Env.DEV
  });
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
  const emitEventName1 = on.mock.calls[0][0];
  const emitCb2 = on.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+mockUuid);
  emitCb2(clientData, jest.fn());
  const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
  document = window.document;
  const testEmptyDiv = document.createElement("div");
  testEmptyDiv.setAttribute("id", "mockElement");
  document.body.appendChild(testEmptyDiv);
  expect(document.getElementById("mockElement")).not.toBeNull();
    
  ele.mount("#mockElement");
  try{
    controller.renderFile(ele.getRecordData(), clientData)
    } catch {
    // console.log('error')
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
  let controller = new SkyflowContainer(client,{
    logLevel:LogLevel.DEBUG,
    env:Env.DEV
  });
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

  const emitEventName1 = on.mock.calls[0][0];
  const emitCb2 = on.mock.calls[0][1];
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
    controller.renderFile(ele.getRecordData(), clientData)
    .catch(error => console.log(error))
    } catch {
    // console.log('error')
  }

  const emitEventName = emitSpy.mock.calls[0][0];;
  const emitCb = emitSpy.mock.calls[0][2];
  console.log(emitCb);
  expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid);
  emitCb({
    errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
  });
});

test("render request success case 2",()=>{
  let controller = new SkyflowContainer(client,{
    logLevel:LogLevel.DEBUG,
    env:Env.DEV
  });
  const clientReq = jest.fn(() => Promise.resolve({
    accessToken: "access token"
  }));
  jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
  const emitEventName1 = on.mock.calls[0][0];
  const emitCb2 = on.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+ mockUuid);
  emitCb2(clientData, jest.fn());
  try{
    controller.renderFile({
      skyflowID: "1815-6223-1073-1425",
      column: "column",
      table: "table"
    }, clientData)
    .catch(error => console.log(error))
    } catch {
    console.log('error')
  }
  const emitEventName = emitSpy.mock.calls[0][0];
  const emitCb = emitSpy.mock.calls[0][2];
  expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid);
  emitCb({success : { skyflow_id: "1815-6223-1073-1425",
  url: "column",
  column: "column",
  table: "table"}});
});

test("render request error case 2",()=>{
  let controller = new SkyflowContainer(client,{
    logLevel:LogLevel.DEBUG,
    env:Env.DEV
  });
  const clientReq = jest.fn(() => Promise.resolve({
    accessToken: "access token"
  }));
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

  const emitEventName1 = on.mock.calls[0][0];
  const emitCb2 = on.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+ mockUuid);
  emitCb2(clientData, jest.fn());
  try{
    controller.renderFile(ele.getRecordData(), clientData)
    .catch(error => console.log(error))
    } catch {
    console.log('error')
  }
  const emitEventName = emitSpy.mock.calls[0][0];
  const emitCb = emitSpy.mock.calls[0][2];
  expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid);
  emitCb({
    errors:[{skyflow_id:"1815-6223-1073-1425","error":{"code":404,"description":"token not found"}}]
  });
});
test("render request error case2",()=>{
  const clientReq = jest.fn(() => Promise.resolve({
    accessToken: "access token"
  }));
  jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
  let controller = new SkyflowContainer(client, {
    logLevel:LogLevel.DEBUG,
    env:Env.DEV
  });
  const emitEventName1 = on.mock.calls[0][0];
  const emitCb2 = on.mock.calls[0][1];
  expect(emitEventName1).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY+ mockUuid);
  emitCb2(clientData, jest.fn());
  try{
    controller.renderFile({
      column: "column",
      table: "table"
    }, clientData).then((data) => console.log('data', data)).catch((error) => console.log('error', error));
    } catch(err) {
      expect(err).toBeDefined();
  }
});
})
})
