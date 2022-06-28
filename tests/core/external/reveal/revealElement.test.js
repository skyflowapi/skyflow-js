/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevel,Env } from "../../../../src/utils/common";
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_REVEAL } from "../../../../src/core/constants";
import RevealElement from "../../../../src/core/external/reveal/RevealElement";
import bus from "framebus";
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

// bus.on = _on;
// bus.target = jest.fn().mockReturnValue({
//   on: _on,
// });
// bus.off = _off;
// bus.emit = _emit;

const metaData = {
  uuid: "123",
  config: {
    vaultID: "vault123",
    vaultURL: "https://sb.vault.dev",
    getAccessToken: getBearerToken,
  },
  metaData: {
    vaultID: "vault123",
    vaultURL: "https://sb.vault.dev",
    clientDomain: "http://abc.com",
  },
};
const testRecord = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  // redaction: RedactionType.PLAIN_TEXT,
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
      containerId,
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
      containerId,
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
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR`;
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
  test("has token should return false, without token",()=>{
    const testRevealElement = new RevealElement(
      {},
      undefined,
      metaData,
      containerId,
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
    containerId,
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
  });
  it("check for isSetError False",()=>{
    expect(testRevealElement.isClientSetError()).toBe(false);
  });
  it("setError method",()=>{
    testRevealElement.setError("errorText");
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


});
