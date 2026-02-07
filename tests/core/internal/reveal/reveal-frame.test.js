/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from "framebus";
import RevealFrame from "../../../../src/core/internal/reveal/reveal-frame";
import { DEFAULT_FILE_RENDER_ERROR, ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, REVEAL_ELEMENT_ERROR_TEXT, REVEAL_ELEMENT_OPTIONS_TYPES, REVEAL_TYPES } from "../../../../src/core/constants";
import { Env, LogLevel, RedactionType } from "../../../../src/utils/common";
import getCssClassesFromJss from "../../../../src/libs/jss-styles";
import { getFileURLFromVaultBySkyflowIDComposable } from "../../../../src/core-utils/reveal";
import properties from "../../../../src/properties";

// / mock the getFileURLFromVaultBySkyflowIDComposable function and keep original other things
// Dynamic mock for getFileURLFromVaultBySkyflowIDComposable allowing per-test resolve/reject setup
const mockGetFileURLFromVaultBySkyflowIDComposable = jest.fn();
jest.mock('../../../../src/core-utils/reveal', () => {
  const original = jest.requireActual('../../../../src/core-utils/reveal');
  return {
    ...original,
    getFileURLFromVaultBySkyflowIDComposable: (...args) => mockGetFileURLFromVaultBySkyflowIDComposable(...args),
  };
});
properties.IFRAME_SECURE_ORIGIN = "http://localhost";

// Helper to configure success response; override can include fields/fileMetadata partials
const setFileURLResolve = (override = {}) => {
  mockGetFileURLFromVaultBySkyflowIDComposable.mockReset().mockImplementation(() => Promise.resolve({
    fields: {
      primary_card_file: 'https://cdn.example.com/assets/whatever?response-content-disposition=logo.png',
      skyflow_id: 'abc123',
      ...(override.fields || {}),
    },
    fileMetadata: {
      contentType: 'image/png',
      ...(override.fileMetadata || {}),
    },
  }));
};

// Helper to configure rejection response; pass an error object/string
const setFileURLReject = (error = { code: 'GENERIC_ERROR', description: 'failed to fetch file URL' }) => {
  mockGetFileURLFromVaultBySkyflowIDComposable.mockReset().mockImplementation(() => Promise.reject(error));
};

// Default to success for tests that don't explicitly set behavior
beforeAll(() => {
  setFileURLResolve();
});



const testRecord = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  // redaction: RedactionType.DEFAULT,
  label: "date_of_birth",
  inputStyles: {
    base: {
      color: "#ef3214",
      fontSize: 20,
    },
  },
};

global.window = Object.create(window);
const listen = jest.fn()
const defineUrl = (url) => {
  Object.defineProperty(window, "location", {
    value: {
      href: url,
    },
    writable: true,
  });

  const base64Domain = btoa('http://localhost');
  Object.defineProperty(window, "name", {
    value: `reveal:container123:frame123:meta:${base64Domain}`,
    writable: true,
  });
  Object.defineProperty(window, "parent", {
    value: {
      frames: {
        "element:CARD_NUMBER:${tableCol}": {
          document: {
            getElementById: () => ({ value: testValue }),
          },
        },
      },
      postMessage: jest.fn(),
      addEventListener: listen,
    },
    writable: true,
  });
};
// Match the constructed window.name so event names align
const elementName = `reveal:container123:frame123:meta:${btoa('http://localhost')}`

// Provide a localStorage mock for Node/JSDOM environment where it's undefined
if (typeof global.localStorage === 'undefined') {
  const storage = {};
  global.localStorage = {
    getItem: jest.fn((key) => (key in storage ? storage[key] : null)),
    setItem: jest.fn((key, value) => { storage[key] = String(value); }),
    removeItem: jest.fn((key) => { delete storage[key]; }),
    clear: jest.fn(() => { Object.keys(storage).forEach((k) => delete storage[k]); }),
  };
  // attach to window as well for code expecting window.localStorage
  Object.defineProperty(window, 'localStorage', { value: global.localStorage, writable: false });
}

const on = jest.fn();
const off = jest.fn();
describe("Reveal Frame Class",()=>{
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

  test("init callback before reveal : without path",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    defineUrl('http://localhost');
    try{
      RevealFrame.init()
    }catch(e){
      expect(e).toBeDefined()
    }
  });

  test("init callback before reveal",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    console.log("testFrame===>",emitSpy.mock.calls);
    const emittedEventName = emitSpy.mock.calls[0][0];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
  });

  test("init callback after reveal with response value",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    // 

    // reveal response ready
    const onRevealResponseName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+ 'frame123');
    const onRevealResponseCb = on.mock.calls[1][1];
    onRevealResponseCb({"1815-6223-1073-1425":"card_value"})

  });
    test("update element props", () => {
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        altText: 'xxxx-xxxx-xxxx-xxxx',
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + elementName,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS, 
          iframeName: elementName, 
          updatedValue: {redaction: RedactionType.DEFAULT} },
    }));
  });

  test("init callback after reveal with response value with mask value",()=>{
    const data = {
      record:{
        token:"1815",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        mask:['XX-XX',null,{X:'0-9'}]
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    // reveal response ready
    const onRevealResponseName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+'frame123');
    const onRevealResponseCb = on.mock.calls[1][1];
    onRevealResponseCb({"1815":"1234"})
  });
  test("init callback after reveal without value",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    // reveal response ready
    const onRevealResponseName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+ 'frame123');
    const onRevealResponseCb = on.mock.calls[1][1];
    onRevealResponseCb({});

  });

  test("reveal set error",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          },
          global:{
            '@import':'https://font-url.com'
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);
    

    const onSetErrorName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onSetErrorName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR+ elementName);
    const onSetErrorCb = on.mock.calls[2][1];
    onSetErrorCb({
      name:elementName,
      isTriggerError: true,
      clientErrorText:"errorText",
    });
    
  });

  test("reveal reset error",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    // reveal response ready
    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR+ elementName);;
    const onRevealResponseCb = on.mock.calls[2][1];
    onRevealResponseCb({
      name: elementName,
      isTriggerError: false,
    });
    
  });
  test("reveal set token",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    
    const onRevealResponseName = on.mock.calls[3][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[3][1];
    onRevealResponseCb({
      name: elementName,
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
      updatedValue:"121-43sfsdaf31-3sa1a321"
    });
    
  });
  test("reveal set altText",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const onRevealResponseName = on.mock.calls[3][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[3][1];
    onRevealResponseCb({
      name: elementName,
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue:"test_altText"
    });
    
  });
  test("reveal clearAltText",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const onRevealResponseName = on.mock.calls[3][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[3][1];
    onRevealResponseCb({
      name: elementName,
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue:null
    });
    
  });
  test("copy icon in reveal elements",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          },
          copyIcon: {
            position: "absolute",
            right: "8px",
            top:"calc(50% - 16px)",
            cursor: "pointer",
            border: "1px solid red",
            backgroundColor:"black",
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        },
        enableCopy: true
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    
  })

  test("global style variant in reveal elements",()=>{
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          },
          global:{
            '@import':'https://font-url.com'
          }
        },
        labelStyles:{
          base:{
            color:"black"
          },
          global:{
            '@import':'https://font-url.com'
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          },
          global:{
            '@import':'https://font-url.com'
          }
        },
        enableCopy: true
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
      name: elementName,
    }
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    
  })

  test('update reveal element props', () => {
    const testFrame = RevealFrame.init();
    // const onCb = jest.fn();
    const data = {
      record:{
        token:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        },
        errorTextStyles:{
          base:{
            color:"red"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }

    const testUpdateOptions = {
      label: 'Updated Label',
      altText: 'updated alt',
      token: 'test-token-re-1',
      inputStyles: {
        base: {
          borderWitdth: '5px',
        },
        global: {
          '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
        }
      },
      labelStyles: {
        base: {
          color: 'red'
        },
        global: {
          '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
        }
      },
      errorTextStyles: {
        base: {
          backgroundColor: 'black'
        },
        global: {
          '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
        }
      }
    }

    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const onRevealResponseName = on.mock.calls[3][0];
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[3][1];
    onRevealResponseCb({
      name: elementName,
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      updatedValue:testUpdateOptions,
    });
  });
  test('render success response event for img tag', (done) => {
    const testFrame = RevealFrame.init();
    const data = {
      record:{
        skyflowID:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }

    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const eventRenderResponse = on.mock.calls[0][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[0][1];
    callback(
      { url: "https://fileurl?response-content-disposition=inline%3B%20filename%3Ddummylicence.png&X-Amz-Signature=4a19c53917cc21df2bd05bc28e4e316ffc36c208d005d8f3f50631",
      iframeName: elementName,
  });

  const heightRequest = ELEMENT_EVENTS_TO_CLIENT.HEIGHT
  const emitterCb = jest.fn();
  bus.emit(heightRequest,data,emitterCb);
  const onCbName = emitSpy.mock.calls[1][0];
  expect(onCbName).toBe(heightRequest);
  const onCb =  emitSpy.mock.calls[1][2];
  onCb({}, emitterCb);
  setTimeout(()=>{
    expect(emitterCb).toBeCalled();
    done();
  },1000);
  })
  test('render success response event for embed tag', () => {
    const testFrame = RevealFrame.init();
    // const onCb = jest.fn();
    const data = {
      record:{
        skyflowID:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const eventRenderResponse = on.mock.calls[0][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[0][1];
    callback({
      url:  "https://url?response-content-disposition=inline%3B%20filename%3Ddummylicence.pdf&X-Amz-Signature=4a19c53917cc21df2bd05bc28e4e316ffc36c208d005d8f3f50631",
      iframeName: elementName,
  });
  })
  test('render success response event for img tag when input style not passed', () => {
    const testFrame = RevealFrame.init();
    // const onCb = jest.fn();
    const data = {
      record:{
        skyflowID:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const eventRenderResponse = on.mock.calls[0][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[0][1];
    callback({
      url:  "https://fileurl?response-content-disposition=inline%3B%20filename%3Ddummylicence.png&X-Amz-Signature=4a19c53917cc21df2bd05bc28e4e316ffc36c208d005d8f3f50631",
      iframeName: elementName,
  });
  })
  test('render success response event for embed tag', () => {
    const testFrame = RevealFrame.init();
    // const onCb = jest.fn();
    const data = {
      record:{
        skyflowID:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const eventRenderResponse = on.mock.calls[0][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[0][1];
    callback({
      url: "https://fileurl?filename%3Ddummylicence.pdf&X-Amz-Signature=4a19c53917cc21df2bd05bc28e4e316ffc36c208d005d8f3f50631",
      iframeName: elementName,
    });
  })

  test('render error response event', () => {
    const testFrame = RevealFrame.init();
    // const onCb = jest.fn();
    const data = {
      record:{
        skyflowID:"1815-6223-1073-1425",
        label:"Card Number",
        altText:"xxxx-xxxx-xxxx-xxxx",
        inputStyles:{
          base:{
            color:"red"
          }
        },
        labelStyles:{
          base:{
            color:"black"
          }
        }
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD},
name: elementName,
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    

    const eventRenderResponse = on.mock.calls[0][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[0][1];
    callback({
      error: DEFAULT_FILE_RENDER_ERROR,
      iframeName: elementName,
    }
    );
  })

});

describe("Reveal Frame Class", () => {
  let emitSpy;
  let targetSpy;
  let onMock;
  let offMock;

  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    onMock = jest.fn();
    offMock = jest.fn();
    targetSpy.mockReturnValue({
      on: onMock,
      off: offMock,
    });
  });

  test("init callback before reveal without path", () => {
    const data = {
      record: {
        token: "1815-6223-1073-1425",
        label: "Card Number",
        altText: "xxxx-xxxx-xxxx-xxxx",
        inputStyles: {
          base: {
            color: "red",
          },
        },
        labelStyles: {
          base: {
            color: "black",
          },
        },
      },
      clientJSON:{
        metaData: {
          uuid: '1234',
        }
      },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl("http://localhost");
    try {
      RevealFrame.init();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test("init callback before reveal with valid data", () => {
    const data = {
      record: {
        token: "1815-6223-1073-1425",
        label: "Card Number",
        altText: "xxxx-xxxx-xxxx-xxxx",
        inputStyles: {
          base: {
            color: "red",
          },
        },
        labelStyles: {
          base: {
            color: "black",
          },
        },
      },
      clientJSON: {
        metaData: {
          uuid: "1234",
        },
      },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    expect(emitSpy).toHaveBeenCalled();
    const emittedEventName = emitSpy.mock.calls[0][0];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
  });

  test("init callback after reveal with response value", () => {
    const data = {
      record: {
        token: "1815-6223-1073-1425",
        label: "Card Number",
        altText: "xxxx-xxxx-xxxx-xxxx",
        inputStyles: {
          base: {
            color: "red",
          },
        },
        labelStyles: {
          base: {
            color: "black",
          },
        },
      },
      clientJSON: {
        metaData: {
          uuid: "1234",
        },
      },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    console.log('======>>>>>>>>>', emitSpy.mock.calls, onMock.mock.calls);
    // Verify reveal response ready
    const onRevealResponseName = onMock.mock.calls[1][0];
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+'frame123');
    const onRevealResponseCb = onMock.mock.calls[1][1];
    onRevealResponseCb({ "1815-6223-1073-1425": "card_value" });
  });

  test("render error response event", () => {
    const data = {
      record: {
        skyflowID: "1815-6223-1073-1425",
        label: "Card Number",
        altText: "xxxx-xxxx-xxxx-xxxx",
        inputStyles: {
          base: {
            color: "red",
          },
        },
        labelStyles: {
          base: {
            color: "black",
          },
        },
      },
      clientJSON: {
        metaData: {
          uuid: "1234",
        },
      },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    const eventRenderResponse = onMock.mock.calls[0][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY + elementName);
    const callback = onMock.mock.calls[0][1];
    callback({
      error: DEFAULT_FILE_RENDER_ERROR,
      iframeName: elementName,
    });
  });

  test("copy icon in reveal elements", () => {
    const data = {
      record: {
        token: "1815-6223-1073-1425",
        label: "Card Number",
        altText: "xxxx-xxxx-xxxx-xxxx",
        inputStyles: {
          base: {
            color: "red",
          },
          copyIcon: {
            position: "absolute",
            right: "8px",
            top: "calc(50% - 16px)",
            cursor: "pointer",
            border: "1px solid red",
            backgroundColor: "black",
          },
        },
        labelStyles: {
          base: {
            color: "black",
          },
        },
        enableCopy: true,
      },
      clientJSON: {
        metaData: {
          uuid: "1234",
        },
      },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    const testFrame = RevealFrame.init();
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emittedData = emitSpy.mock.calls[0][1];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    expect(emittedData).toEqual({name : elementName})
  });
  test("render success response event (file render request message)", async () => {
    // Cover THEN block: successful resolve posts REVEAL_CALL_RESPONSE and HEIGHT_CALLBACK_COMPOSABLE
    setFileURLResolve({
      fields: { primary_card_file: 'https://cdn.example.com/file?response-content-disposition=inline%3B%20filename%3Dsuccess.png' },
      fileMetadata: { contentType: 'image/png' }
    });
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { base: { color: 'red' } },
        labelStyles: { base: { color: 'black' } },
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + elementName,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: elementName },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    await new Promise(r => setTimeout(r, 0));

    const parentCalls = window.parent.postMessage.mock.calls;
    const successCall = parentCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + elementName));
    expect(successCall).toBeTruthy();
    expect(successCall[0].data.type).toBe(REVEAL_TYPES.RENDER_FILE);
    expect(successCall[0].data.result).toBeDefined();
    // Height callback
    const windowCalls = window.postMessage.mock.calls;
    const heightCall = windowCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window.name));
    expect(heightCall).toBeTruthy();
  });

  test("render error response event (file render request message)", async () => {
    // Cover CATCH block: rejection posts REVEAL_CALL_RESPONSE with errors and HEIGHT_CALLBACK_COMPOSABLE
    const mockError = { code: 'GENERIC_ERROR', description: 'mock failure for test' };
    setFileURLReject(mockError);
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { base: { color: 'red' } },
        labelStyles: { base: { color: 'black' } },
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + elementName,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: elementName },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    await new Promise(r => setTimeout(r, 0));

    const parentCalls = window.parent.postMessage.mock.calls;
    const errorCall = parentCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + elementName));
    expect(errorCall).toBeTruthy();
    expect(errorCall[0].data.type).toBe(REVEAL_TYPES.RENDER_FILE);
    expect(errorCall[0].data.result.errors).toEqual(mockError);
    // Height callback
    const windowCalls = window.postMessage.mock.calls;
    const heightCall = windowCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window.name));
    expect(heightCall).toBeTruthy();
  });

  test("responseUpdate with signed token and mask applies both correctly", () => {
    const actualToken = "response-update-with-mask";
    const payload = JSON.stringify({ tok: actualToken });
    const encodedPayload = btoa(payload);
    const signedToken = `signed_token_header.${encodedPayload}.signature`;

    const record = {
      name: elementName,
      token: signedToken,
      mask: ['XXX-XX-XXXX', null, { X: '0-9' }],
      inputStyles: { base: { color: "green" } },
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    testFrame.responseUpdate({ frameId: elementName, 0: { token: actualToken, value: "12345678901" } });
    const dataElement = document.getElementById(elementName);

    const maskedValue = dataElement?.innerText;
    expect(maskedValue).toBeTruthy();
    expect(maskedValue).toContain('-');

    document.body.removeChild(rootDiv);
  });

  test("sub function (REVEAL_RESPONSE_READY) with regular token decodes and applies value", () => {
    const uniqueElementName = "reveal:container200:frame200:meta:" + btoa('http://localhost');
    const token = "test-token-123";
    const responseValue = "4111111111111111";

    const data = {
      record: {
        name: uniqueElementName,
        token,
        label: "Card Number",
        // No altText so it shows the actual value after reveal
        inputStyles: { base: { color: "red" } },
        labelStyles: { base: { color: "black" } },
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    // Get the sub callback for REVEAL_RESPONSE_READY
    const onRevealResponseName = onMock.mock.calls[1][0];
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + "frame200");
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger the sub function with response
    onRevealResponseCb({ [token]: responseValue });

    // Verify the value was applied
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe(responseValue);
  });

  test("sub function (REVEAL_RESPONSE_READY) with signed token decodes tok field correctly", () => {
    const uniqueElementName = "reveal:container201:frame201:meta:" + btoa('http://localhost');
    const actualToken = "actual-token-456";
    const payload = JSON.stringify({ tok: actualToken });
    const encodedPayload = btoa(payload);
    const signedToken = `signed_token_header.${encodedPayload}.signature`;
    const responseValue = "sensitive-data-value";

    const data = {
      record: {
        name: uniqueElementName,
        token: signedToken,
        label: "Card Number",
        // No altText so it shows the actual value after reveal
        inputStyles: { base: { color: "blue" } },
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    // Get the sub callback
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger with the decoded token (actual token, not signed)
    onRevealResponseCb({ [actualToken]: responseValue });

    // Verify the value was applied
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe(responseValue);
  });

  test("sub function (REVEAL_RESPONSE_READY) with signed token and mask applies both correctly", () => {
    const uniqueElementName = "reveal:container202:frame202:meta:" + btoa('http://localhost');
    const actualToken = "actual-token-789";
    const payload = JSON.stringify({ tok: actualToken });
    const encodedPayload = btoa(payload);
    const signedToken = `signed_token_header.${encodedPayload}.signature`;
    const responseValue = "1234567890";

    const data = {
      record: {
        name: uniqueElementName,
        token: signedToken,
        label: "Phone Number",
        mask: ["XXX-XXX-XXXX", null, { X: "0-9" }],
        inputStyles: { base: { color: "green" } },
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    // Get the sub callback
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger with the decoded token
    onRevealResponseCb({ [actualToken]: responseValue });

    // Verify the masked value was applied
    const dataElement = document.getElementById(uniqueElementName);
    const maskedValue = dataElement?.innerText;
    expect(maskedValue).toBeTruthy();
    expect(maskedValue).toContain("-"); // Mask format includes dashes
    expect(maskedValue.length).toBeGreaterThan(0);
  });

  test("sub function (REVEAL_RESPONSE_READY) shows error when token not found in response", () => {
    const uniqueElementName = "reveal:container203:frame203:meta:" + btoa('http://localhost');
    const token = "missing-token-999";

    const data = {
      record: {
        name: uniqueElementName,
        token,
        label: "Card Number",
        inputStyles: { base: { color: "red" } },
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    // Get the sub callback
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger with empty response (token not found)
    onRevealResponseCb({});

    const errorElements = document.getElementsByClassName(`SkyflowElement-${uniqueElementName}-error-base`);
    expect(errorElements.length).toBeGreaterThan(0);
    expect(errorElements[0]?.innerText).toBe(REVEAL_ELEMENT_ERROR_TEXT);
  });

  test("sub function (REVEAL_RESPONSE_READY) does not show error for skyflowID records when token missing", () => {
    const uniqueElementName = "reveal:container204:frame204:meta:" + btoa('http://localhost');
    const token = "test-token-skyflow";

    const data = {
      record: {
        name: uniqueElementName,
        token,
        skyflowID: "sky-123-456", // Has skyflowID, so should not show error
        label: "Card Number",
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    // Get the sub callback
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger with empty response (token not found)
    onRevealResponseCb({});

    const errorElements = document.getElementsByClassName(`SkyflowElement-${uniqueElementName}-error-base`);
    if (errorElements.length > 0) {
      expect(errorElements[0].innerText).toBe("");
    }
  });

  test("sub function (REVEAL_RESPONSE_READY) with invalid signed token falls back to original token", () => {
    const uniqueElementName = "reveal:container205:frame205:meta:" + btoa('http://localhost');
    const invalidSignedToken = "signed_token_invalid_format";
    const responseValue = "fallback-value";

    const data = {
      record: {
        name: uniqueElementName,
        token: invalidSignedToken,
        label: "Card Number",
        // No altText
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    // Get the sub callback
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger with the original (invalid) signed token as key
    onRevealResponseCb({ [invalidSignedToken]: responseValue });

    // Verify the value was applied using fallback token
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe(responseValue);
  });

});