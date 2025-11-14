/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevel,Env } from "../../../../src/utils/common";
import { ELEMENT_EVENTS_TO_IFRAME, COMPOSABLE_REVEAL, ELEMENT_EVENTS_TO_CLIENT, REVEAL_TYPES, REVEAL_ELEMENT_OPTIONS_TYPES} from "../../../../src/core/constants";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import SkyflowContainer from '../../../../src/core/external/skyflow-container';
import Client from '../../../../src/client';
import ComposableRevealInternalElement from "../../../../src/core/external/reveal/composable-reveal-internal";
import * as busEvents from '../../../../src/utils/bus-events';
import bus from "framebus";
import { JSDOM } from 'jsdom';
import EventEmitter from "../../../../src/event-emitter";
import { error } from "console";

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
const getBearerToken = jest.fn().mockResolvedValue('token');

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
  getSkyflowBearerToken: getBearerToken,
  clientJSON:{
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      config:{
        ...skyflowConfig,
        getBearerToken:jest.fn().toString()
      }
    },
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
  getSkyflowBearerToken: getBearerToken,
}
const client = new Client(clientData?.client?.config, clientData);

const on = jest.fn();
const off = jest.fn();
let skyflowContainer;
describe("Reveal Element Class", () => {
  let emitSpy;
  let targetSpy;
  let windowSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off
    });
    windowSpy = jest.spyOn(window, "window", "get");
    const client = new Client(clientData.client.config, clientData);
    skyflowContainer = new SkyflowContainer(client, { logLevel: LogLevel.DEBUG, env: Env.PROD });
  });
  afterEach(() => {
    windowSpy.mockRestore();
  });

  const containerId = mockUuid;
  test("constructor", () => {
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        [],
        metaData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    expect(testRevealElement).toBeInstanceOf(ComposableRevealInternalElement);
  });
  test("Mount Method", () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element1"
            }]
        }]
    };
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        metaData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element1",
            containerId: mockUuid,
        }
    }));
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
  });
  test("file render call success case", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element1",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element1",
            containerId: mockUuid,
        }
    }));
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element1", {}, (response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({ success: { skyflow_id: '1244', column: 'file' } });
    });
    await Promise.resolve('token');
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + "element1",
            containerId: mockUuid,
            data: {
                result: { success: { skyflow_id: '1244', column: 'file' } },
                type: REVEAL_TYPES.RENDER_FILE,
            }
        }
    }));
  });
  test("file render call error case", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element1",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element1",
            containerId: mockUuid,
        }
    }));
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element1", {}, (response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({ error: { skyflow_id: '1244', column: 'file', error:{code : 400, description: "No Records Found"} } });
    });
    await Promise.resolve('token');
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + "element1",
            containerId: mockUuid,
            data: {
                result: { errors: { skyflow_id: '1244', column: 'file', error:{
                    code: 400,
                    description: "No Records Found",
                } } },
                type: REVEAL_TYPES.RENDER_FILE,
            }
        }
    }));
  });
  test("file render call error case", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element1",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element1",
            containerId: mockUuid,
        }
    }));
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element1", {}, (response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({ error: { skyflow_id: '1244', column: 'file', error:{code : 400, description: "No Records Found"} } });
    });
    await Promise.resolve('token');
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + "element1",
            containerId: mockUuid,
            data: {
                result: { errors: { skyflow_id: '1244', column: 'file', error:{
                    code: 400,
                    description: "No Records Found",
                } } },
                type: REVEAL_TYPES.RENDER_FILE,
            }
        }
    }));
  });
 test("file render call success case when mount event not happened ", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element2",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element2", {}, (response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({ success: { skyflow_id: '1244', column: 'file' } });
    });
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element2",
            containerId: mockUuid,
        }
    }));
    await Promise.resolve('token');
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + "element2",
            containerId: mockUuid,
            data: {
                result: { success: { skyflow_id: '1244', column: 'file' } },
                type: REVEAL_TYPES.RENDER_FILE,
            }
        }
    }));
  });
 test("file render call error case when mount event not happened ", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element2",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element2", {}, (response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({ error: { skyflow_id: '1244', column: 'file', error:{code : 400, description: "No Records Found"} } });
    });
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element2",
            containerId: mockUuid,
        }
    }));
    await Promise.resolve('token');
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + "element2",
            containerId: mockUuid,
            data: {
                result: { errors: { skyflow_id: '1244', column: 'file', error:{code : 400, description: "No Records Found"} } },
                type: REVEAL_TYPES.RENDER_FILE,
            }
        }
    }));
  }); 
 test("file render call error case when mount event not happened when bearer token call rejected", async () => {
    // Mock the bearer token to reject
    const getBearerTokenFail = jest.fn().mockRejectedValue({
      error: {code: 400, description: "BEARER TOKEN FAILED"}
    });
    
    const clientDataFail = {
      ...clientData,
      getSkyflowBearerToken: getBearerTokenFail,
    };
    
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element2",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientDataFail,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    // Capture the callback response
    let callbackResponse;
    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element2", {}, (response) => {
        callbackResponse = response;
    });
    
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element2",
            containerId: mockUuid,
        }
    }));
    
    // Wait for the async bearer token call to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Assert the callback was called with the error
    expect(callbackResponse).toBeDefined();
    expect(callbackResponse).toEqual({error: {error: {code: 400, description: "BEARER TOKEN FAILED"}}});
  });
 test("file render call error case when bearer token call rejected", async () => {
    // Mock the bearer token to reject
    const getBearerTokenFail = jest.fn().mockRejectedValue({
      error: {code: 400, description: "BEARER TOKEN FAILED"}
    });
    
    const clientDataFail = {
      ...clientData,
      getSkyflowBearerToken: getBearerTokenFail,
    };
    
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element2",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientDataFail,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element2",
            containerId: mockUuid,
        }
    }));
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    // Capture the callback response
    let callbackResponse;
    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ":element2", {}, (response) => {
        callbackResponse = response;
    });
    
    
    // Wait for the async bearer token call to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Assert the callback was called with the error
    expect(callbackResponse).toBeDefined();
    expect(callbackResponse).toEqual({error: {error: {code: 400, description: "BEARER TOKEN FAILED"}}});
  });
 test("update call error case when container is mounted", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element2",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + ":element2", {
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
        options: { altText: "Updated Alt Text" }
    });  
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element2",
            containerId: mockUuid,
        }
    }));
 });
 test("update call error case when container is not mounted", async () => {
    const elementArray = {
        rows:[{
            elements : [{
            "column": "file",
            "table": "table6",
            "altText": "Alt text 1",
            "name": "element2",
            "skyflowID": "id1"
            }]
        }]
    };
    const groupEmiitter = new EventEmitter();
    const testRevealElement = new ComposableRevealInternalElement(
        elementId,
        elementArray,
        clientData,
        {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
        { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    window.dispatchEvent(new MessageEvent('message', {
        data: {
            type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + "element2",
            containerId: mockUuid,
        }
    }));
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();  
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${COMPOSABLE_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    // Mock iframe postMessage to prevent CI errors
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage = jest.fn();
    }

    groupEmiitter._emit(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + ":element2", {
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
        options: { altText: "Updated Alt Text" }
    });
    
    
 });
}); 