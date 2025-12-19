/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevel,Env } from "../../../../src/utils/common";
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_REVEAL, ELEMENT_EVENTS_TO_CLIENT, REVEAL_TYPES, REVEAL_ELEMENT_OPTIONS_TYPES, CUSTOM_ERROR_MESSAGES} from "../../../../src/core/constants";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import SkyflowContainer from '../../../../src/core/external/skyflow-container';
import Client from '../../../../src/client';

import * as busEvents from '../../../../src/utils/bus-events';



import bus from "framebus";
import { JSDOM } from 'jsdom';

busEvents.getAccessToken = jest.fn(() => Promise.reject('access token'));

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
  skyflowContainer: {
    isControllerFrameReady: true,
  },
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
  options: { trackMetrics: true, trackingKey: "key" }
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
    isControllerFrameReady: true
  },
  clientDomain: clientDomain,
}
const clientData2 = {
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
    isControllerFrameReady: false
  },
  clientDomain: clientDomain,
}
const getBearerToken2 = jest.fn().mockImplementation(() => Promise.reject());
const client = new Client(clientData.client.config, clientData);

const testRecord = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  // redaction: RedactionType.PLAIN_TEXT,
};
const on = jest.fn();
const off = jest.fn();
let skyflowContainer;
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
    const client = new Client(clientData.client.config, clientData);
    skyflowContainer = new SkyflowContainer(client, { logLevel: LogLevel.DEBUG, env: Env.PROD });
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
    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testIframeName,
    });
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
    
    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testIframeName,
    });
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
  });
  test("file render success case", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: 'column', 
        table: 'table',
        altText:'alt text',
      },
      {} ,
      clientData2,
      {containerId:containerId,isMounted:true,eventEmitter:groupEmiitter, isControllerFrameReady: false},
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
    
    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testIframeName,
    });
    
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);

    testRevealElement.renderFile().then(data =>
      expect(data).toEqual({ success: { skyflow_id: '1244', column: 'column' } })
      ).catch (
      error => console.log('error', error)
    );
    const frameReadyEvent = on.mock.calls[1][0];
    expect(frameReadyEvent).toBe(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + '123');
    const onCallback = on.mock.calls[1][1];
    const cb = jest.fn();
    onCallback({}, cb);
    expect(emitSpy.mock.calls[3][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + '123');
    expect(emitSpy.mock.calls[3][1])
    .toEqual({type: REVEAL_TYPES.RENDER_FILE, records: {altText: "alt text", skyflowID: '1244', column: 'column', table: 'table' },
      containerId: mockUuid, iframeName: testIframeName, "errorMessages": {}});
    const emitCb = emitSpy.mock.calls[3][2];
    emitCb({ success: { skyflow_id: '1244', column: 'column' } });
  });
  test("renderFile when SKYFLOW_FRAME_CONTROLLER_READY is not triggered success case", (done) => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      undefined,
      clientData2,
      { containerId: containerId, isMounted: true, eventEmitter: groupEmiitter, isControllerFrameReady: true },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
  
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
  
    expect(testRevealElement.isMounted()).toBe(false);
  
    // Call renderFile before triggering SKYFLOW_FRAME_CONTROLLER_READY
    const renderPromise = testRevealElement.renderFile();

    // Verify that the else block is executed
    const frameReadyEventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + '123';
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(frameReadyEventName);
  
    // Simulate the SKYFLOW_FRAME_CONTROLLER_READY event
    const onCb = on.mock.calls[1][1];
    const cb = jest.fn();
    onCb({}, cb);
  
    const emitCb = emitSpy.mock.calls[0][2];
    emitCb({ success: { skyflow_id: "1244", column: "column" } });
  
    // Verify the renderFile promise resolves correctly
    renderPromise
      .then((data) => {
        expect(data).toEqual({});
        done();
      })
      .catch((error) => {
        console.error("Error:", error);
        done(error);
      });
  });
  test("renderFile when SKYFLOW_FRAME_CONTROLLER_READY is not triggered error case", (done) => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      undefined,
      clientData,
      { containerId: containerId, isMounted: true, eventEmitter: groupEmiitter, isControllerFrameReady: false },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
  
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
  
    expect(testRevealElement.isMounted()).toBe(false);
  
    // Call renderFile before triggering SKYFLOW_FRAME_CONTROLLER_READY
    const renderPromise = testRevealElement.renderFile();

    // Verify that the else block is executed

    // const frameReadyEventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + '123';
    // const onCbName = on.mock.calls[2][0];
    // expect(onCbName).toBe(frameReadyEventName);
  
    // Simulate the SKYFLOW_FRAME_CONTROLLER_READY event
    // const onCb = on.mock.calls[2][1];
    // const cb = jest.fn();
    // onCb({}, cb);
  
    const emitCb = emitSpy.mock.calls[0][2];
    emitCb({ errors: { column: "column", skyflowId: "1244", error: { code: 400, description: "No Records Found" }}});
    
    // emitCb({ errors: { grpc_code: 5, http_code: 404, message: "No Records Found", http_status: "Not Found", details: [] } });
  
    // Verify the renderFile promise resolves correctly
    renderPromise
      .catch((error) => {
        expect(error).toEqual({
          "errors": {
              "column": "column",
              "skyflowId": "1244",
              "error": {
                "code": 400,
                "description": "No Records Found",
              },
          }
      }
    );
    done();
      });
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
      {containerId:containerId,isMounted:true,eventEmitter:groupEmiitter, isControllerFrameReady: true},
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
    
    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testIframeName,
    });
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    testRevealElement.renderFile().then(
      data => console.log('data', data)
      ).catch (
      (error) => {
        expect(error).toEqual({ errors: { skyflowId:'1244', error: "No Records Found", column: "Not column" } });
    });

    expect(emitSpy.mock.calls[3][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + '123');
    expect(emitSpy.mock.calls[3][1])
     .toEqual({type: REVEAL_TYPES.RENDER_FILE, records: {altText: "alt text", skyflowID: '1244', column: 'column', table: 'table' }, containerId: mockUuid,
      iframeName: testIframeName, "errorMessages": {}});
    const emitCb = emitSpy.mock.calls[3][2];
    emitCb({ errors: { skyflowId:'1244', error: "No Records Found", column: "Not column" } });
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
    
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });

  test("Mount Method with ready to mount false case 2", () => {
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
    testRevealElement.mount("#testDiv");
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });
    testRevealElement.setError("errorText");
    groupEmiitter._emit(`${CUSTOM_ERROR_MESSAGES}:${containerId}`, {
      errorMessages: { GENERIC_ERROR: "errorText" }
    });
    expect(testRevealElement.isClientSetError()).toBe(true);
    expect(emitSpy.mock.calls[1][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[1][1]).toEqual({name: testRevealElement.iframeName(), clientErrorText: "errorText", isTriggerError: true});
    expect(emitSpy).toBeCalled();
  });
  it("when element is not mounted then setError method",()=>{
    testRevealElement.unmount();
    testRevealElement.setError("errorText");

    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });
    expect(testRevealElement.isClientSetError()).toBe(true);
    expect(emitSpy).toBeCalled();
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), clientErrorText: "errorText", isTriggerError: true});
    expect(emitSpy).toBeCalled();
    testRevealElement.mount('123');
  });

  it("setErrorOverride method",()=>{
    testRevealElement.setErrorOverride("errorText");
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), clientErrorText: "errorText", isTriggerError: true});
    expect(emitSpy).toBeCalled();
  });
  it("setErrorOverride method when element is not mounted",()=>{
    testRevealElement.unmount();
    testRevealElement.setErrorOverride("errorText");
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), clientErrorText: "errorText", isTriggerError: true});
    expect(emitSpy).toBeCalled();
    testRevealElement.mount('123');
  });
  it("check for isSetError True",()=>{
    expect(testRevealElement.isClientSetError()).toBe(true);
  });
  it("resetError method",()=>{
    testRevealElement.resetError();
  });
  it("resetError method when element is not mounted",()=>{
    testRevealElement.unmount();
    testRevealElement.resetError();
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });
    expect(testRevealElement.isClientSetError()).toBe(false);
    expect(emitSpy).toBeCalled();
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), isTriggerError: false});
    expect(emitSpy).toBeCalled();
    testRevealElement.mount('123');
  });
  it("setAltText method",()=>{
    testRevealElement.setAltText("altText");
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT, updatedValue: "altText"});
    expect(emitSpy).toBeCalled(); 
  });
  
  it("setAltText method when element is not mounted",()=>{
    testRevealElement.unmount();
    testRevealElement.setAltText("altText");
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT, updatedValue: "altText"});
    expect(emitSpy).toBeCalled(); 
    testRevealElement.mount('123');
  });
  it("clearAltText method",()=>{
    testRevealElement.clearAltText();
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT, updatedValue: null});
    expect(emitSpy).toBeCalled();
  });
  it("clearAltText method when element is not mounted",()=>{
    testRevealElement.unmount();

    testRevealElement.clearAltText();
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + testRevealElement.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement.iframeName(), updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT, updatedValue: null});
    expect(emitSpy).toBeCalled();
    testRevealElement.mount('123');
  });
  it("getRecord Data",()=>{
    const testRecordData = testRevealElement.getRecordData();
    expect(testRecordData).toStrictEqual({token:"1244",})
  });
  it("setToken method",()=>{
    testRevealElement.setToken("testToken");

  });
  it("setToken method when mount event not happen",()=>{
    testRevealElement.unmount();
    testRevealElement.setToken("testToken");

    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement.iframeName(),
    });

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
    testRevealElement2.mount('#mockElement');

    const testUpdateOptions = {
      label: 'Updated Label',
      inputStyles: {
        base: {
          borderWitdth: '5px',
        }
      }
    }
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement2.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement2.iframeName(),
    });
    testRevealElement2.update(testUpdateOptions);
    expect(emitSpy.mock.calls[2][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + testRevealElement2.iframeName());
    expect(emitSpy.mock.calls[2][1]).toEqual({name: testRevealElement2.iframeName(), updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS, updatedValue: {'label': 'Updated Label', inputStyles: { base: { borderWitdth: '5px' } }}});
    expect(emitSpy).toBeCalled();
  })
  it('should update the properties of elements', () => {
    testRevealElement2.unmount('#mockElement');

    const testUpdateOptions = {
      label: 'Updated Label',
      inputStyles: {
        base: {
          borderWitdth: '5px',
        }
      }
    }
    testRevealElement2.update(testUpdateOptions);
    const mountedEventName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement2.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name:testRevealElement2.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + testRevealElement2.iframeName());
    expect(emitSpy.mock.calls[0][1]).toEqual({name: testRevealElement2.iframeName(), updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS, updatedValue: {'label': 'Updated Label', inputStyles: { base: { borderWitdth: '5px' } }}});
    expect(emitSpy).toBeCalled();
  })
});
