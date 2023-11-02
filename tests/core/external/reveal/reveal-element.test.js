/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevel,Env } from "../../../../src/utils/common";
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_REVEAL, STYLE_TYPE} from "../../../../src/core/constants";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import bus from "framebus";
import { JSDOM } from 'jsdom';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../../../src/libs/jss-styles'

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
const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientData = {
  uuid: '123',
  client: {
    config: { ...skyflowConfig },
    metadata: { uuid :'123'},
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
  test("Mount Method for file render", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: 'column', 
        table: 'table'
      },
      undefined,
      clientData,
      {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
      elementId,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window.document;
    const data =  testRevealElement.getRecordData()
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
      
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    

    expect(document.querySelector("span")).toBeTruthy();
    testRevealElement.renderFile();
    const testIframeName = `${FRAME_REVEAL}:${btoa(mockUuid)}:${containerId}:ERROR`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    testRevealElement.unmount();
    expect(testRevealElement.isMounted()).toBe(false); 
    expect(document.querySelector("span")).toBeFalsy(); 
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
  it('should add render file pre-elements to the DOM', () => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window.document;
    testRevealElement2.metaData = clientData
    testRevealElement2.mount("#mockElement")
    testRevealElement2.renderFile();
    const documentElements = document.querySelectorAll('*');
    const elementsArray = Array.from(documentElements);
  });
  it('should add render file pre-elements to the DOM', () => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window.document;
    let ele = document.createElement('div');
    ele.setAttribute('id', '#mockElement');
    testRevealElement2.addRenderFilePreElement('#mockElement');
    testRevealElement2.domSelecter = '#mockElement';
    testRevealElement2.isRenderFileCalled = true;
    testRevealElement2.removeFilePreElement("demo")
    const documentElements = document.querySelectorAll('span');
    testRevealElement2.mount('#mockElement');
    console.log(documentElements.length);
  });
  it('should update render file pre-elements to the DOM', () => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window.document;
    let ele = document.createElement('div');
    ele.setAttribute('id', '#mockElement');
    testRevealElement2.addRenderFilePreElement('#mockElement');
    testRevealElement2.domSelecter = '#mockElement';
    testRevealElement2.isRenderFileCalled = true;
    testRevealElement2.updateErrorText("demo")
    const documentElements = document.querySelectorAll('span');
    testRevealElement2.mount('#mockElement');
  });
  it('should update the error text with the provided string', () => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window.document;
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "mockElement");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("mockElement")).not.toBeNull();
      
    testRevealElement2.mount("#mockElement");
    testRevealElement2.metaData = clientData
    testRevealElement2.renderFile();
    // Mock data
    testRevealElement2.domSelecter = '#mockElement';
    testRevealElement2.isRenderFileCalled = true;
    const error = 'Test error message';
    const elementId = 'testElementId';

    testRevealElement2.elementId = elementId
    testRevealElement2.addRenderFilePreElement('#mockElement');

    testRevealElement2.updateErrorText(error);

    expect(testRevealElement2.renderFileErrorText.innerText).toEqual(error);
    expect(testRevealElement2.renderFileAltText.innerText).toEqual("demo");
    expect(generateCssWithoutClass).toHaveBeenCalled();
    expect(getCssClassesFromJss).toHaveBeenCalled();

    testRevealElement2.removeFilePreElement("demo")   

    expect(generateCssWithoutClass).toHaveBeenCalled();
    expect(getCssClassesFromJss).toHaveBeenCalled();
  });
  
describe('RevealElement', () => {
  let testRevealElement = new RevealElement(
    {
      skyflowID:"12445",
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
    },
    undefined,
    clientData,
    {containerId:containerId,isMounted:false,eventEmitter:groupEmiitter},
    elementId,
    { logLevel: LogLevel.ERROR,env:Env.PROD }
  );
  let ele;
  beforeEach(() => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    global.document = window.document;
    ele = document.createElement('div');
    ele.setAttribute('id', '#mockElement');
    testRevealElement.metaData = clientData
    testRevealElement.mount("#mockElement")
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('renderFile', () => {
    it('should update the file rendering alt text and error text when the frame is ready', () => {
      const mockResponse = {};
      const mockFormattedResult = { "success":{
        skyflow_id: '1234',
        column : 'col'
      } };
      testRevealElement.removeFilePreElement = jest.fn().mockImplementation("http://demo.com");
      testRevealElement.formatForRenderClient = jest.fn().mockReturnValue(mockFormattedResult);

      const result = testRevealElement.renderFile();
      expect(result).toBeInstanceOf(Promise);
      expect(testRevealElement.renderFileAltText.innerText).toEqual('loading...');
      expect(testRevealElement.renderFileErrorText.innerText).toEqual('');
    });

    it('should handle the case when the frame is not ready', () => {

      const result = testRevealElement.renderFile();

      expect(testRevealElement.renderFileAltText.innerText).toEqual('loading...');
      expect(testRevealElement.renderFileErrorText.innerText).toEqual('');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle errors appropriately', async () => {
      const mockError = new Error('Test error message');
      testRevealElement.printLog = jest.fn();
      testRevealElement.formatForRenderClient = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      expect(testRevealElement.renderFile()).rejects.toThrowError(mockError);
    });
    it('should emit the appropriate bus events when rendering the file', () => {
      const busEmitSpy = jest.spyOn(bus, 'emit');

      const mockRevealData = { "success":{
        skyflow_id: '1234',
        column : 'col'
      } };
      testRevealElement.elementId = '123'
      testRevealElement.formatForRenderClient = jest.fn().mockReturnValue(mockRevealData);

      let result = testRevealElement.renderFile();
      expect(busEmitSpy).toHaveBeenCalledWith(
        'RENDER_FILE_REQUEST' + '123',
        {
          records: testRevealElement.getRecordData(),
          metaData: clientData.clientJSON,
        },
        expect.any(Function)
      );

      expect(result).resolves.toEqual(mockRevealData);
    });
  });

});
});
