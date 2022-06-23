/*
Copyright (c) 2022 Skyflow, Inc.
*/
import RevealContainer from "../../../../src/core/external/reveal/RevealContainer";
import { ELEMENT_EVENTS_TO_CONTAINER, ELEMENT_EVENTS_TO_IFRAME, REVEAL_FRAME_CONTROLLER } from "../../../../src/core/constants";
import bus from "framebus";
import { LogLevel,Env } from "../../../../src/utils/common";
import RevealElement from "../../../../src/core/external/reveal/RevealElement";
import * as iframerUtils from '../../../../src/iframe-libs/iframer';

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
  const testMetaData = {
    uuid: "123",
    config: {
      vaultID: "vault123",
      vaultURL: "sb.vault.dev",
      getBearerToken: jest.fn(),
    },
    metaData: {
      clientDomain: "http://abc.com",
    },
  };
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
        ...skyflowConfig,
        getBearerToken:jest.fn().toString()
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
    expect(document.querySelector("iframe")).toBeTruthy();
    expect(
      document.querySelector("iframe")?.name.includes(REVEAL_FRAME_CONTROLLER)
    ).toBe(true);
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

  test("on reveal frame ready call back",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    const data = {
      name:REVEAL_FRAME_CONTROLLER,
    };
    const emitterCb = jest.fn();
    const eventName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY+mockUuid
    bus.emit(eventName,data,emitterCb);
  
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[0][1];
    onCb(data, emitterCb);
    expect(emitterCb).toBeCalledTimes(1);
    expect(emitterCb).toBeCalledWith(clientData);
  });

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
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
    onCb(data);

    testRevealContainer.reveal();
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid);
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
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
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
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
    onCb(data);

    testRevealContainer.reveal();
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid);
    emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });
  test("on container mounted call back 4",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    // const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    // bus.emit(eventName,data);
    // const onCbName = on.mock.calls[1][0];
    // expect(onCbName).toBe(eventName);
    // const onCb = on.mock.calls[1][1];
    // onCb(data);

    testRevealContainer.reveal();
    // const emitEventName = emitSpy.mock.calls[1][0];
    // const emitCb = emitSpy.mock.calls[1][2];
    // expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid);
    // emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });
  test("on container mounted call back 5",()=>{
    const testRevealContainer = new RevealContainer(clientData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    testRevealContainer.create({
      token: "",
    });
    const data = {
      token: "1815-6223-1073-1425",
      containerId:mockUuid
    }
    const eventName = ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED+mockUuid
    bus.emit(eventName,data);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
    onCb(data);

    testRevealContainer.reveal();
    // const emitEventName = emitSpy.mock.calls[1][0];
    // const emitCb = emitSpy.mock.calls[1][2];
    // expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid);
    // emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });

  // test("timeout",(done)=>{
  //   const testRevealContainer = new RevealContainer(clientData, { logLevel: LogLevel.ERROR,env:Env.PROD });
  //   testRevealContainer.create({
  //     token: "1815-6223-1073-1425",
  //   });
  //   const res = testRevealContainer.reveal();
  //   res.catch((err)=>{
  //     expect(err).toBeDefined();
  //     done();
  //   });
  // });
  test("on container mounted else call back",()=>{
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
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
    onCb(data);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid);
    emitCb({error:{code:404,description:"Not Found"}});
  });
  test("on container mounted else call back ",()=>{
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
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(eventName);
    const onCb = on.mock.calls[1][1];
    onCb(data);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST+mockUuid);
    emitCb({"success":[{token:"1815-6223-1073-1425"}]});
  });
});
