/*
Copyright (c) 2022 Skyflow, Inc.
*/
import RevealContainer from "../../../../src/core/external/reveal/reveal-container";
import { ComposableRevealContainer, ComposableRevealElement } from "../../../../src/index-node";
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER, REVEAL_TYPES } from "../../../../src/core/constants";
import bus from "framebus";
import { LogLevel,Env } from "../../../../src/utils/common";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import SKYFLOW_ERROR_CODE from "../../../../src/utils/constants";
import { parameterizedString } from "../../../../src/utils/logs-helper";
import SkyflowError from "../../../../src/libs/skyflow-error";
import logs from "../../../../src/utils/logs";

iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));
const mockUuid = '1234'; 
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
}));

const on = jest.fn();
const off = jest.fn();
jest.setTimeout(40000);
describe("Reveal Composable Container Class", () => {
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
  const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve('token'));
  const testMetaData = {
    getSkyflowBearerToken: getBearerToken,
     skyflowContainer: {
        isControllerFrameReady: true,
      },
    uuid: "123",
    config: {
      vaultID: "vault123",
      vaultURL: "https://sb.vault.dev.com",
      getBearerToken,
    },
    metaData: {
      clientDomain: "http://abc.com",
    },
  };
   const testRevealContainer = new ComposableRevealContainer(testMetaData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
});
  const skyflowConfig = {
    vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
    vaultURL: 'https://testurl.com',
    getBearerToken,
  };
  
  const clientData = {
    getSkyflowBearerToken: getBearerToken,
      skyflowContainer: {
        isControllerFrameReady: false,
      },
    uuid: '1234',
    client: {
      config: { ...skyflowConfig },
      metaData: {
        uuid: "1234",
      },
    },
    clientJSON: {
        config: {
            vaultID: 'vault123',
            vaultURL: 'https://sb.vault.dev',
            getBearerToken,
        },
    },
  }
    
  const clientData2 = {
      skyflowContainer: {
        isControllerFrameReady: true,
      },
    uuid: '1234',
    client: {
      config: { ...skyflowConfig },
      metaData: {
        uuid: "1234",
      },
    },
    clientJSON:{
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      metaData: {
        uuid: "1234",
      },
      config:{
        ...skyflowConfig,
        getBearerToken
      }
    } 
  }

  const testRecord = {
    token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
    // redaction: RedactionType.PLAIN_TEXT,
    label: "",
    styles: {
      base: {
        color: "#32ce21",
      },
    },
  };
  test("reveal should throw error with no elements", (done) => {
    const container = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD });
    container.reveal().catch((error) => {
      done();
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(SkyflowError);
      expect(error.error.code).toEqual(400);
      expect(error.error.description).toEqual(logs.errorLogs.NO_ELEMENTS_IN_COMPOSABLE);
    })
  });

  test("constructor", () => {
    expect(testRevealContainer).toBeInstanceOf(ComposableRevealContainer);
    expect(testRevealContainer).toBeInstanceOf(Object);
    expect(testRevealContainer).toHaveProperty("create");
    expect(testRevealContainer).toHaveProperty("reveal");
    expect(testRevealContainer).toHaveProperty("type");
  });
  test("create() will return a Reveal composable element", () => {
    const testRevealElement = testRevealContainer.create(testRecord);
    expect(testRevealElement).toBeInstanceOf(ComposableRevealElement);
  });
  test("create() will throw error if record id invalid", () => {
    try {
      testRevealContainer.create({
        token: "",
        // redaction: RedactionType.REDACTED,
      });
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id ");
    }
    try {
      testRevealContainer.create({
        token: true,
        // redaction: RedactionType.PLAIN_TEXT,
      });
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id true");
    }
  });

  test('create()  will throw error for invalid input format options',(done)=>{
    try {
      testRevealContainer.create({
        token: "1244",
      },{
        format:undefined
      });
      done('should throw error');
    } catch (error) {
      expect(error.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_FORMAT.description));
      done();
    }
  });

  test("on container mounted call back",()=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    const div = document.createElement('div');
    div.id = 'container';
    document.body.appendChild(div);
    testRevealContainer.mount('#container');
  });
//   test("on container mounted call back 5",()=>{
//     const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
//     testRevealContainer.create({
//       token: "token",
//     });
//     const data = {
//       token: "1815-6223-1073-1425",
//       containerId:mockUuid
//     }
//     const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
//     bus.emit(eventName,data);
//     const onCbName = on.mock.calls[0][0];
//     expect(onCbName).toBe(eventName);
//     const onCb = on.mock.calls[0][1];
//     onCb(data);
//     testRevealContainer.reveal();
//     const frameEventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
//     const onframeEvent = on.mock.calls[1][0];
//     expect(frameEventName).toBe(onframeEvent);
//     const onCbFrame = on.mock.calls[1][1];
//     onCbFrame({});
//     const emitEventName = emitSpy.mock.calls[1][0];
//     const emitCb = emitSpy.mock.calls[1][2];
//     expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
//     emitCb({"success":[{token:"1815-6223-1073-1425"}]});
//   });

//   test("on container mounted else call back",()=>{
//     const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
//     testRevealContainer.create({
//       token: "1815-6223-1073-1425",
//     });
//     const data = {
//       token: "1815-6223-1073-1425",
//       containerId:mockUuid
//     }
    
//     testRevealContainer.reveal().catch(err => {
//       console.log(err);
//     });
//     const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
//     bus.emit(eventName,data);
//     const onCbName = on.mock.calls[0][0];
//     expect(onCbName).toBe(eventName);
//     const onCb = on.mock.calls[0][1];
//     onCb(data);

//     const frameEventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
//     const onframeEvent = on.mock.calls[1][0];
//     expect(frameEventName).toBe(onframeEvent);
//     const onCbFrame = on.mock.calls[1][1];
//     onCbFrame({});

//     const emitEventName = emitSpy.mock.calls[1][0];
//     const emitCb = emitSpy.mock.calls[1][2];
//     expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
//     emitCb({error:{code:404,description:"Not Found"}});
//   });
//   test("on container mounted else call back 1",()=>{
//     const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
//     testRevealContainer.create({
//       token: "1815-6223-1073-1425",
//     });
//     const data = {
//       token: "1815-6223-1073-1425",
//       containerId:mockUuid
//     }
  

//     testRevealContainer.reveal();
//     const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
//     bus.emit(eventName,data);

//     const onCbName = on.mock.calls[0][0];
//     expect(onCbName).toBe(eventName);
//     const onCb = on.mock.calls[0][1];
//     onCb(data);
//     const frameEventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
//     const onframeEvent = on.mock.calls[1][0];
//     expect(frameEventName).toBe(onframeEvent);
//     const onCbFrame = on.mock.calls[1][1];
//     onCbFrame({});

//     const emitEventName = emitSpy.mock.calls[1][0];
//     const emitCb = emitSpy.mock.calls[1][2];
//     expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
//     emitCb({"success":[{token:"1815-6223-1073-1425"}]});
//   });
  test("reveal before skyflow frame ready event",async ()=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
     testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  
    const res = testRevealContainer.reveal();
    await Promise.resolve('token');
    expect(res).toBeInstanceOf(Promise); //ELEMENT_EVENTS_TO_CLIENT.MOUNTED
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + mockUuid,
        data: data
      }
    }));
    await Promise.resolve();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + mockUuid,
        data: {"success":[{token:"1815-6223-1073-1425"}]}
      }
    }));

    await expect(res).resolves.toEqual({"success":[{token:"1815-6223-1073-1425"}]});
  });
  test("reveal before skyflow frame ready event, Error case",async ()=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
     testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  
    const res = testRevealContainer.reveal();
    await Promise.resolve('token');
    expect(res).toBeInstanceOf(Promise); //ELEMENT_EVENTS_TO_CLIENT.MOUNTED
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + mockUuid,
        data: data
      }
    }));
    await Promise.resolve();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + mockUuid,
        data: {"errors":{
            code:404,
            description:"Not Found"
        }}
      }
    }));

    await expect(res).rejects.toEqual({"errors":{code:404,description:"Not Found"}});
  });
  test("reveal before skyflow frame ready event, Error case when bearer token step failed",async ()=>{
    // Create a mock that rejects for bearer token
    const getBearerTokenFail = jest.fn().mockRejectedValue({
      errors: {
        code: 400,
        description: "Failed to fetch bearer token"
      }
    });
    
    const clientDataFail = {
      ...clientData,
      getSkyflowBearerToken: getBearerTokenFail,
    };
    
    const testRevealContainer = new ComposableRevealContainer(clientDataFail, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
     testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  
    const res = testRevealContainer.reveal();
    
    await expect(res).rejects.toEqual({errors:{code:400,description:"Failed to fetch bearer token"}});
  });

  /// frame ready event
  test("reveal before skyflow frame ready event",async ()=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + mockUuid,
        data: data
      }
    }));
     testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  
    const res = testRevealContainer.reveal();
    await Promise.resolve('token');
    expect(res).toBeInstanceOf(Promise); //ELEMENT_EVENTS_TO_CLIENT.MOUNTED
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + mockUuid,
        data: {"success":[{token:"1815-6223-1073-1425"}]}
      }
    }));

    await expect(res).resolves.toEqual({"success":[{token:"1815-6223-1073-1425"}]});
  });
  test("reveal before skyflow frame ready event, Error case",async ()=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + mockUuid,
        data: data
      }
    }));
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  
    const res = testRevealContainer.reveal();
    await Promise.resolve('token');
    expect(res).toBeInstanceOf(Promise); //ELEMENT_EVENTS_TO_CLIENT.MOUNTED

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + mockUuid,
        data: {"errors":{
            code:404,
            description:"Not Found"
        }}
      }
    }));

    await expect(res).rejects.toEqual({"errors":{code:404,description:"Not Found"}});
  });
  test("reveal before skyflow frame ready event, Error case when bearer token step failed",async ()=>{
    // Create a mock that rejects for bearer token
    const getBearerTokenFail = jest.fn().mockRejectedValue({
      errors: {
        code: 400,
        description: "Failed to fetch bearer token"
      }
    });
    
    const clientDataFail = {
      ...clientData,
      getSkyflowBearerToken: getBearerTokenFail,
    };
    
    const testRevealContainer = new ComposableRevealContainer(clientDataFail, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
        window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + mockUuid,
        data: data
      }
    }));
     testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  
    const res = testRevealContainer.reveal();
    
    await expect(res).rejects.toEqual({errors:{code:400,description:"Failed to fetch bearer token"}});
  });

  test("reveal when elment is empty when skyflow ready",(done)=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });

            window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + mockUuid,
        data: 'data'
      }
    }));
    testRevealContainer.reveal().catch((error) => {
      done();
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(SkyflowError);
      expect(error.error.code).toEqual(400);
      expect(error.error.description).toEqual(logs.errorLogs.NO_ELEMENTS_IN_COMPOSABLE);
    })
  });
  test("reveal when elment is empty when skyflow frame not ready",(done)=>{
    const testRevealContainer = new ComposableRevealContainer(clientData, [], { logLevel: LogLevel.ERROR,env:Env.PROD }, {
        layout:[1]
    });
    testRevealContainer.reveal().catch((error) => {
      done();
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(SkyflowError);
      expect(error.error.code).toEqual(400);
      expect(error.error.description).toEqual(logs.errorLogs.NO_ELEMENTS_IN_COMPOSABLE);
    })
  });
});
