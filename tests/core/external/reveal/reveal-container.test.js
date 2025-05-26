/*
Copyright (c) 2022 Skyflow, Inc.
*/
import RevealContainer from "../../../../src/core/external/reveal/reveal-container";
import { ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER, REVEAL_TYPES } from "../../../../src/core/constants";
import bus from "framebus";
import { LogLevel,Env } from "../../../../src/utils/common";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import SKYFLOW_ERROR_CODE from "../../../../src/utils/constants";
import { parameterizedString } from "../../../../src/utils/logs-helper";

iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));
const mockUuid = '1234'; 
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
}));

const on = jest.fn();
const off = jest.fn();
jest.setTimeout(40000);
describe("Reveal Container Class", () => {
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
  const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());
  const testMetaData = {
  skyflowContainer: {
        isControllerFrameReady: true,
      },
    uuid: "123",
    config: {
      vaultID: "vault123",
      vaultURL: "sb.vault.dev",
      getBearerToken,
    },
    metaData: {
      clientDomain: "http://abc.com",
    },
  };
  const skyflowConfig = {
    vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
    vaultURL: 'https://testurl.com',
    getBearerToken,
  };
  
  const clientData = {
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
  const testRevealContainer = new RevealContainer(testMetaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
  test("constructor", () => {
    expect(testRevealContainer).toBeInstanceOf(RevealContainer);
    expect(testRevealContainer).toBeInstanceOf(Object);
    expect(testRevealContainer).toHaveProperty("create");
    expect(testRevealContainer).toHaveProperty("reveal");
    expect(testRevealContainer).toHaveProperty("type");
  });

  test("create() will return a Reveal Element", () => {
    const testRevealElement = testRevealContainer.create(testRecord);
    expect(testRevealElement).toBeInstanceOf(RevealElement);
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

  // test.only("on skyflow frame ready call back",()=>{
  //   const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
  //   const data = {
  //     name:REVEAL_FRAME_CONTROLLER,
  //   };
  //   const emitterCb = jest.fn();
  //   console.log('data is on.mock.calls', on.mock.calls);
  //   const eventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY+mockUuid
  //   const onCbName = on.mock.calls[1][0];
  //   expect(onCbName).toBe(eventName);
  //   const onCb = on.mock.calls[1][1];
  //   onCb(data, emitterCb);
  //   bus.emit(eventName,data,emitterCb);
  //   const data1 =   {
  //     "client": {
  //       "config": {
  //         "vaultID": "e20afc3ae1b54f0199f24130e51e0c11",
  //         "vaultURL": "https://testurl.com",
  //         "getBearerToken": getBearerToken,
  //         "options": {}
  //       },
      
  //     "metaData": {
  //       "uuid": "1234",
  //     },
  //     "context": {
  //       "env": "PROD",
  //       "logLevel": "ERROR"
  //     },
  //   }, 
  //   "context": {
  //     "env": "PROD",
  //     "logLevel": "ERROR"
  //   },
  // }
    
  //   expect(emitterCb).toBeCalledTimes(1);
  //   expect(emitterCb).toBeCalledWith(data1);
  // });

  test("on container mounted call back",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);

    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data);


    testRevealContainer.reveal().catch(error => {
      expect(error).toBeDefined()
      expect(error.code).toEqual(404);
      expect(error.description).toEqual('Not Found');
    });
    const eventName1 = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY+mockUuid

    const onCbName1 = on.mock.calls[1][0];
    expect(onCbName1).toBe(eventName1);
    const onCb1 = on.mock.calls[1][1];
    onCb1({}, jest.fn());
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
    emitCb({error:{code:404,description:"Not Found"}});
  });
  test("on container mounted call back 2",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }

    testRevealContainer.reveal();

    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data);
  });
  test("on container mounted call back 3",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data);
    testRevealContainer.reveal().then(res => {
      expect(res).toBeDefined()
      expect(res).toEqual({"success":[{token:"1815-6223-1073-1425"}]});
      expect(res.success[0].token).toEqual("1815-6223-1073-1425");
      expect(res.success[0].token).toEqual(data.token);
    }).catch(error => {
      console.log('error is here', error);
    });
    const eventName1 = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY+mockUuid

    const onCbName1 = on.mock.calls[1][0];
    expect(onCbName1).toBe(eventName1);
    const onCb1 = on.mock.calls[1][1];
    onCb1({}, jest.fn());

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
    emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });
  test("on container mounted call back 4",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "123",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }

    const mountEventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(mountEventName,data);
    const onCbName1 = on.mock.calls[0][0];
    expect(onCbName1).toBe(mountEventName);
    const onCb1 = on.mock.calls[0][1];
    onCb1(data);


    testRevealContainer.reveal().then((data) => {
      console.log('data is here', data);
    }).catch(error => console.log('error is here', error));

    const eventName = ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY+mockUuid
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
    onCb({}, jest.fn());
    bus.emit(eventName,data);
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitData = emitSpy.mock.calls[1][1];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
    expect(emitData).toEqual({type: REVEAL_TYPES.REVEAL, containerId: '1234', records :[{token:"123"}]});
    emitCb({"success":[{token:"1815-6223-1073-1425"}]}); 
});
  test("on container mounted call back 5",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "token",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data);

    testRevealContainer.reveal();
    // const emitEventName = emitSpy.mock.calls[1][0];
    // const emitCb = emitSpy.mock.calls[1][2];
    // expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
    // emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });

  test("on container mounted else call back",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    
    testRevealContainer.reveal().catch(err => {
      console.log(err);
    });
    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
    emitCb({error:{code:404,description:"Not Found"}});
  });
  test("on container mounted else call back 1",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
  

    testRevealContainer.reveal();
    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);

    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS+mockUuid);
    emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });
  // test("file render call",async ()=>{
  //   const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
  //   const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
  //   global.document = window.document;
  //   let ele = document.createElement('div');
  //   ele.setAttribute('id', '#mockElement');

  //   let element = testRevealContainer.create({
  //     skyflowID: "1244",
  //     column: 'column', 
  //     table: 'table'
  //   },);
  //   const data = {
  //     skyflowID: "1244",
  //     column: 'column', 
  //     table: 'table',      
  //     containerId:mockUuid
  //   }
  //   element.mount("#mockElement")
  //   try {
  //     const result  = await element.renderFile().then((data) => {
  //       console.log('data is here', data);
  //     }).catch(error => console.log('error is here', error));
  //   } catch(error) {
  //     console.log(error);
  //   }
  //   expect(result).toBeInstanceOf(Promise);
  //   element.metaData = clientData
  //   const eventName = ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY  + mockUuid
  //   bus.emit(eventName,data);
  //   const onCbName = on.mock.calls[1][0];
  //   expect(onCbName).toBe(eventName);
  //   const onCb = on.mock.calls[1][1];
  //   onCb(data);



  //   const emitEventName = emitSpy.mock.calls[1][0];
  //   const emitCb = emitSpy.mock.calls[1][2];
  //   expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST+mockUuid);
  //   emitCb({"success":[{skyflow_id:"1244"}]});
  // });

});
