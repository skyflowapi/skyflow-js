/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevel,Env } from "../../../../src/utils/common";
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_REVEAL, ELEMENT_EVENTS_TO_CONTAINER} from "../../../../src/core/constants";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import SkyflowContainer,{renderFile} from '../../../../src/core/external/skyflow-container';
import Client from '../../../../src/client';
import RevealContainer from "../../../../src/core/external/reveal/reveal-container";
import RevealFrameController from '../../../../src/core/internal/reveal/reveal-frame-controller';

import bus from "framebus";
import { JSDOM } from 'jsdom';

const mockUuid = '1234'; 
const elementId = 'id';
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
}));
// const _on = jest.fn();
// const _off = jest.fn();
// const _emit = jest.fn();
const getBearerToken = jest.fn();

const groupEmittFn = jest.fn();
let groupOnCb;
const groupEmiitter = {
  _emit: groupEmittFn,
  on:jest.fn().mockImplementation((args,cb)=>{
    groupOnCb = cb;
  })
}
jest.mock('../../../../src/libs/jss-styles', () => {
  return {
    __esModule: true,
    default: jest.fn(),
    generateCssWithoutClass: jest.fn(),
    getCssClassesFromJss: jest.fn().mockReturnValue({
      base: { color: 'red' },
      global: { backgroundColor: 'black' }
    })
  };
});
jest.mock('../../../../src/core/external/skyflow-container', () => {
  return {
    __esModule: true,
    default: jest.fn(),
    renderFile: jest.fn(),
  }
})

// bus.on = _on;
// bus.target = jest.fn().mockReturnValue({
//   on: _on,
// });
// bus.off = _off;
// bus.emit = _emit;

const clientDomain = "http://abc.com";
const metaData = {
  uuid: "123",
  config: {
    vaultID: "vault123",
    vaultURL: "https://sb.vault.dev",
    getAccessToken: getBearerToken,
  },
  metaData: {
    vaultID: "vault123",
    vaultURL: "https://sb.vault.dev"
  },
  clientDomain: clientDomain,
};
const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};
let controller = new SkyflowContainer(client,{
  logLevel:LogLevel.DEBUG,
  env:Env.DEV
});

const clientData = {
  uuid: '123',
  client: {
    config: { ...skyflowConfig },
    metadata: { uuid :'123',
    skyflowContainer: controller,
  },
  },
  clientJSON:{
    context: { logLevel: LogLevel.ERROR,env:Env.PROD},
    config:{
      ...skyflowConfig,
      getBearerToken:jest.fn().toString()
    }
  },
  skyflowContainer: {
    renderFile : renderFile
  },
  clientDomain: clientDomain,
}
const client = new Client(clientData.client.config, clientData);

const testRecord = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  // redaction: RedactionType.PLAIN_TEXT,
};
const testRecord2 = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  SkyflowID: 'id',
  column: 'column',
  table: 'table'
};
const on = jest.fn();
const off = jest.fn();
describe("Reveal Element Class", () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off
    });
  });

  const containerId = mockUuid;
  test("constructor", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    expect(testRevealElement).toBeInstanceOf(RevealElement);
  });
  test("Mount Method", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {containerId:containerId,isMounted:true,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
      
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    const eventListenerName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    const emitterCb = jest.fn();
    onCb({
      name:testIframeName,
    },emitterCb);
    expect(emitterCb).toBeCalled();
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });
  test("Mount Method for file render", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: 'column', 
        table: 'table',
        altText:'alt text'
      },
      undefined,
      clientData,
      {containerId:containerId,isMounted:true,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
    
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    const eventListenerName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    const emitterCb = jest.fn();
    onCb({
      name:testIframeName,
    },emitterCb);
    expect(emitterCb).toBeCalled();
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
  });
  test("file render success case", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: 'column', 
        table: 'table',
        altText:'alt text'
      },
      undefined,
      clientData,
      {containerId:containerId,isMounted:true,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
    
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    const eventListenerName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    const emitterCb = jest.fn();
    onCb({
      name:testIframeName,
    },emitterCb);
    expect(emitterCb).toBeCalled();
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    renderFile.mockImplementation(()=>{
      return new Promise((resolve,_)=>{
        resolve({
          fields: {
            file: '123',
            skyflow_id: '1244'
          }
        })
      });
    });
    testRevealElement.renderFile().then(data =>
      expect(data).toEqual({ success: { skyflow_id: '1244', column: 'column' } })
      ).catch (
      error => console.log('error', error)
    );
  });

  test("file render error case", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: 'column', 
        table: 'table',
        altText:'alt text'
      },
      undefined,
      clientData,
      {containerId:containerId,isMounted:true,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
    
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    const eventListenerName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    const emitterCb = jest.fn();
    onCb({
      name:testIframeName,
    },emitterCb);
    expect(emitterCb).toBeCalled();
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    renderFile.mockImplementation(()=>{
      return new Promise((_, reject)=>{
        reject({
          "error": {
              "grpc_code": 5,
              "http_code": 404,
              "message": "No Records Found",
              "http_status": "Not Found",
              "details": []
          }}
      )
      });
    });
    testRevealElement.renderFile().then(
      data => console.log('data', data)
      ).catch (
      (error) => {
        console.log('error', error)
        expect(error).toEqual({
          "error": {
              "grpc_code": 5,
              "http_code": 404,
              "message": "No Records Found",
              "http_status": "Not Found",
              "details": []
          }
      }
    );
    });
  });

  test("Mount Method with ready to mount false", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
      
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    
    groupOnCb({containerId});
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });

  test("Mount Method with ready to mount false", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
      
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    
    groupOnCb({containerId});
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });
  
  test("has token should return false, without token",()=>{
    const testRevealElement = new RevealElement(
      {},
      undefined,
      metaData,
      {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    expect(testRevealElement.hasToken()).toBe(false);
  });
});

describe("Reveal Element Methods",()=>{
  const containerId = mockUuid;
  const testRevealElement = new RevealElement(
    {
      token:"1244",
    },
    undefined,
    metaData,
    {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
    elementId,
    { logLevel: LogLevel.ERROR,env:Env.PROD }
  );
  const testRevealElement2 = new RevealElement(
    {
      skyflowID:"1244",
      column: 'column', 
      table: 'table',
      altText: 'demo',
      inputStyles: {
          base: {
            border: '5px solid orange',
            padding: '10px 10px',
            borderRadius: '10px',
            color: '#1d1d1d',
            marginTop: '4px',
            height: '260px',
            width: '400px'
          },
          global: {
            '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
          }
        },
    errorTextStyles: {
      base: {
        border: '5px solid orange',
        padding: '10px 10px',
        borderRadius: '10px',
        color: '#1d1d1d',
        marginTop: '4px',
        height: '260px',
        width: '400px'
      },
      global: {
        '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      }
    }
    },
    undefined,
    clientData,
    {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
    elementId,
    { logLevel: LogLevel.ERROR,env:Env.PROD }
  );
  it("mount with invalid div",()=>{
    try{
      testRevealElement.mount(null);
    }catch(err){
      expect(err).toBeDefined();
    }   
  });
  it("unmount method",()=>{
      testRevealElement.unmount();
      testRevealElement2.unmount();
  });
  it("check for isSetError False",()=>{
    expect(testRevealElement.isClientSetError()).toBe(false);
  });
  it("setError method",()=>{
    testRevealElement.setError("errorText");
  });
  it("setErrorOverride method",()=>{
    testRevealElement.setErrorOverride("errorText");
  });
  it("check for isSetError True",()=>{
    expect(testRevealElement.isClientSetError()).toBe(true);
  });
  it("resetError method",()=>{
    testRevealElement.resetError();
  });
  it("setAltText method",()=>{
    testRevealElement.setAltText("altText");
  });
  it("clearAltText method",()=>{
    testRevealElement.clearAltText();
  });
  it("getRecord Data",()=>{
    const testRecordData = testRevealElement.getRecordData();
    expect(testRecordData).toStrictEqual({token:"1244",})
  });
  it("setToken method",()=>{
    testRevealElement.setToken("testToken");
  });
  it("getRecord Data",()=>{
    const testRecordData = testRevealElement.getRecordData();
    expect(testRecordData).toStrictEqual({token:"testToken"})
  });
  it('should update the properties of elements', () => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window.document;
    const element = document.createElement('div');
    element.setAttribute('id', '#mockElement');
    const documentElements = document.querySelectorAll('span');
    testRevealElement2.mount('#mockElement');

    const testUpdateOptions = {
      label: 'Updated Label',
      inputStyles: {
        base: {
          borderWitdth: '5px',
        }
      }
    }

    testRevealElement2.update(testUpdateOptions);
  })
});

describe("Render file tests",()=>{
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off
    });
  });
  const containerId = mockUuid;
  const testRevealElement = new RevealElement(
    {
      token:"1244",
    },
    undefined,
    metaData,
    {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
    elementId,
    { logLevel: LogLevel.ERROR,env:Env.PROD }
  );
  const testRevealElement2 = new RevealElement(
    {
      skyflowID:"1244",
      column: 'column', 
      table: 'table',
      altText: 'demo',
      inputStyles: {
          base: {
            border: '5px solid orange',
            padding: '10px 10px',
            borderRadius: '10px',
            color: '#1d1d1d',
            marginTop: '4px',
            height: '260px',
            width: '400px'
          },
          global: {
            '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
          }
        },
    errorTextStyles: {
      base: {
        border: '5px solid orange',
        padding: '10px 10px',
        borderRadius: '10px',
        color: '#1d1d1d',
        marginTop: '4px',
        height: '260px',
        width: '400px'
      },
      global: {
        '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      }
    }
    },
    undefined,
    clientData,
    {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
    elementId,
    { logLevel: LogLevel.ERROR,env:Env.PROD }
  );
  it('render file success case', (done) => {
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    renderFile.mockImplementation(()=>{
      return new Promise((resolve,_)=>{
        resolve({
          fields: {
            file: '123',
            skyflow_id: '1234'
          }
        })
      });
    });   
    testRevealElement2.renderFile()
    const revelRequestEventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+ mockUuid;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName,data,emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  emitSpy.mock.calls[1][2];
    onCb(data,emitterCb);
    setTimeout(()=>{
      expect(emitterCb).toBeCalled();
      done();
    },1000);
  });
  it('render file error case', (done) => {
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    renderFile.mockImplementation(()=>{
      return new Promise((_,reject)=>{
        reject({
          error: 'No records found'
        })
      });
    });    
    testRevealElement2.renderFile().catch(error => console.log(error));
    const revelRequestEventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+ mockUuid;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName,data,emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  emitSpy.mock.calls[1][2];
    onCb(data,emitterCb);
    setTimeout(()=>{
      expect(emitterCb).toBeCalled();
      done();
    },1000);
  });


});