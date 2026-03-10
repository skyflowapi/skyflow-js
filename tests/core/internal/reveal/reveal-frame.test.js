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
      primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png',
      skyflow_id: 'abc123',
      ...(override.fields || {}),
    },
    fileMetadata: {
      contentType: 'image/jpeg',
      ...(override.fileMetadata || {}),
    },
  }));
};

// Helper to configure rejection response; pass an error object/string
const setFileURLReject = (error = { code: 'GENERIC_ERROR', description: 'failed to fetch file URL' }) => {
  mockGetFileURLFromVaultBySkyflowIDComposable.mockReset().mockImplementation(() => Promise.reject(error));
};

// Global variables that will be initialized in beforeAll
let testRecord;
let defineUrl;
let elementName;
let elementNameComposable;
let listen;
let on;
let off;

describe("Reveal Frame Class",()=>{
  beforeAll(() => {
    // Set default file URL resolve behavior
    setFileURLResolve();

    // Initialize test record
    testRecord = {
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

    // Setup global window
    global.window = Object.create(window);
    listen = jest.fn();
    
    // Define URL helper function
    defineUrl = (url) => {
      Object.defineProperty(window, "location", {
        value: {
          href: url,
        },
        writable: true,
      });

      const base64Domain = btoa('http://localhost');
      // Set both normal and composable window.name for test coverage
      Object.defineProperty(window, "name", {
        value: `reveal:container123:frame123:meta:${base64Domain}`,
        writable: true,
      });
      // For composable container scenario, you can set as below in relevant tests:
      // Object.defineProperty(window, "name", {
      //   value: `reveal-composable:container123:frame123:meta:${base64Domain}`,
      //   writable: true,
      // });
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
    elementName = `reveal:container123:frame123:meta:${btoa('http://localhost')}`;
    elementNameComposable = `reveal-composable:container123:frame123:meta:${btoa('http://localhost')}`;

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

    // Initialize mock functions
    on = jest.fn();
    off = jest.fn();
  });
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
          borderWidth: '5px',
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

  beforeAll(() => {
    // Set default file URL resolve behavior
    setFileURLResolve();

    // Initialize test record
    testRecord = {
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

    // Setup global window
    global.window = Object.create(window);
    listen = jest.fn();
    
    // Define URL helper function
    defineUrl = (url) => {
      Object.defineProperty(window, "location", {
        value: {
          href: url,
        },
        writable: true,
      });

      const base64Domain = btoa('http://localhost');
      // Set both normal and composable window.name for test coverage
      Object.defineProperty(window, "name", {
        value: `reveal:container123:frame123:meta:${base64Domain}`,
        writable: true,
      });
      // For composable container scenario, you can set as below in relevant tests:
      // Object.defineProperty(window, "name", {
      //   value: `reveal-composable:container123:frame123:meta:${base64Domain}`,
      //   writable: true,
      // });
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
    elementName = `reveal:container123:frame123:meta:${btoa('http://localhost')}`;
    elementNameComposable = `reveal-composable:container123:frame123:meta:${btoa('http://localhost')}`;

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

    // Initialize mock functions
    on = jest.fn();
    off = jest.fn();
  });

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
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
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

  test("render success response event (file render request message when style have overflow)", async () => {
    // Cover THEN block: successful resolve posts REVEAL_CALL_RESPONSE and HEIGHT_CALLBACK_COMPOSABLE
    setFileURLResolve({
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
    });
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { base: { color: 'red', overflow: 'auto' } },
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
    const uniqueElementName = "reveal:container300:frame300:meta:" + btoa('http://localhost');
    const actualToken = "response-update-with-mask";
    const payload = JSON.stringify({ tok: actualToken });
    const encodedPayload = btoa(payload);
    const signedToken = `signed_token_header.${encodedPayload}.signature`;

    const record = {
      name: uniqueElementName,
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

    // Call responseUpdate with proper data structure
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      0: { token: actualToken, value: "12345678901" } 
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    const maskedValue = dataElement?.innerText;
    expect(maskedValue).toBeTruthy();
    expect(maskedValue).toContain('-');

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with regular token applies value correctly", () => {
    const uniqueElementName = "reveal:container301:frame301:meta:" + btoa('http://localhost');
    const token = "regular-token-123";
    const responseValue = "test-value-12345";

    const record = {
      name: uniqueElementName,
      token,
      inputStyles: { base: { color: "blue" } },
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call responseUpdate with proper data structure
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      0: { token, value: responseValue } 
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe(responseValue);

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with signed token without mask applies value correctly", () => {
    const uniqueElementName = "reveal:container302:frame302:meta:" + btoa('http://localhost');
    const actualToken = "decoded-token-456";
    const payload = JSON.stringify({ tok: actualToken });
    const encodedPayload = btoa(payload);
    const signedToken = `signed_token_header.${encodedPayload}.signature`;
    const responseValue = "sensitive-data";

    const record = {
      name: uniqueElementName,
      token: signedToken,
      inputStyles: { base: { color: "red" } },
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call responseUpdate with decoded token
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      0: { token: actualToken, value: responseValue } 
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe(responseValue);

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with error shows error message", () => {
    const uniqueElementName = "reveal:container303:frame303:meta:" + btoa('http://localhost');
    const token = "error-token-789";

    const record = {
      name: uniqueElementName,
      token,
      inputStyles: { base: { color: "orange" } },
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call responseUpdate with error
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      error: "Token not found" 
    });
    
    const errorElements = document.getElementsByClassName(`SkyflowElement-${uniqueElementName}-error-base`);
    expect(errorElements.length).toBeGreaterThan(0);
    expect(errorElements[0]?.innerText).toBe(REVEAL_ELEMENT_ERROR_TEXT);

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with error on skyflowID record does not show error", () => {
    const uniqueElementName = "reveal:container304:frame304:meta:" + btoa('http://localhost');
    const token = "skyflow-token-999";

    const record = {
      name: uniqueElementName,
      token,
      skyflowID: "sky-123-456", // Has skyflowID
      inputStyles: { base: { color: "purple" } },
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call responseUpdate with error
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      error: "Token not found" 
    });
    
    const errorElements = document.getElementsByClassName(`SkyflowElement-${uniqueElementName}-error-base`);
    // Should not show error for skyflowID records
    if (errorElements.length > 0) {
      expect(errorElements[0]?.innerText).toBe("");
    }

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with mismatched token does nothing", () => {
    const uniqueElementName = "reveal:container305:frame305:meta:" + btoa('http://localhost');
    const recordToken = "expected-token-111";
    const responseToken = "different-token-222";
    const initialText = "initial-value";

    const record = {
      name: uniqueElementName,
      token: recordToken,
      altText: initialText,
      inputStyles: { base: { color: "gray" } },
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call responseUpdate with different token
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      0: { token: responseToken, value: "should-not-appear" } 
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    // Should still show initial altText, not the response value
    expect(dataElement?.innerText).toBe(initialText);

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

    // Trigger with the original (invalid) signed token as key
    onRevealResponseCb({ [invalidSignedToken]: responseValue });

    // Verify the value was applied using fallback token
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe(responseValue);
  });

  test("decodeSignedToken with malformed JWT triggers catch block", () => {
    const uniqueElementName = "reveal:container206:frame206:meta:" + btoa('http://localhost');
    const malformedJWT = "signed_token_header.INVALID_BASE64!!!.signature";

    const record = {
      name: uniqueElementName,
      token: malformedJWT,
      label: "Card Number",
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call decodeSignedToken - it should handle the error and return original token
    const result = testFrame.decodeSignedToken(malformedJWT);
    
    // Should return the original token when decoding fails
    expect(result).toBe(malformedJWT);

    document.body.removeChild(rootDiv);
  });

  test("decodeSignedToken with JWT missing tok field returns token without modification", () => {
    const uniqueElementName = "reveal:container207:frame207:meta:" + btoa('http://localhost');
    const payload = JSON.stringify({ sub: "user123", iat: 1234567890 }); // No 'tok' field
    const encodedPayload = btoa(payload);
    const signedToken = `signed_token_header.${encodedPayload}.signature`;

    const record = {
      name: uniqueElementName,
      token: signedToken,
      label: "Card Number",
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call decodeSignedToken - should return original since no 'tok' field
    const result = testFrame.decodeSignedToken(signedToken);
    
    // Should return the original token when tok field is missing
    expect(result).toBe(signedToken);

    document.body.removeChild(rootDiv);
  });

  test("decodeSignedToken with JWT having only 2 parts returns original token", () => {
    const uniqueElementName = "reveal:container208:frame208:meta:" + btoa('http://localhost');
    const signedToken = "signed_token_header.payload"; // Only 2 parts, missing signature

    const record = {
      name: uniqueElementName,
      token: signedToken,
      label: "Card Number",
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    // Call decodeSignedToken - should return original since parts.length !== 3
    const result = testFrame.decodeSignedToken(signedToken);
    
    // Should return the original token when parts length is not 3
    expect(result).toBe(signedToken);

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with mismatched frameId does nothing", () => {
    const uniqueElementName = "reveal:container209:frame209:meta:" + btoa('http://localhost');
    const token = "test-token-mismatch";
    const responseValue = "should-not-appear";

    const record = {
      name: uniqueElementName,
      token,
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    const dataElement = document.getElementById(uniqueElementName);
    const initialValue = dataElement?.innerText;

    // Call responseUpdate with different frameId
    testFrame.responseUpdate({ 
      frameId: "different-frame-id", 
      0: { token, value: responseValue } 
    });
    
    // Value should not change since frameId doesn't match
    expect(dataElement?.innerText).toBe(initialValue);
    expect(dataElement?.innerText).not.toBe(responseValue);

    document.body.removeChild(rootDiv);
  });

  test("responseUpdate with mismatched token does nothing", () => {
    const uniqueElementName = "reveal:container210:frame210:meta:" + btoa('http://localhost');
    const actualToken = "actual-token-xyz";
    const wrongToken = "wrong-token-abc";
    const responseValue = "should-not-appear";

    const record = {
      name: uniqueElementName,
      token: actualToken,
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    const dataElement = document.getElementById(uniqueElementName);
    const initialValue = dataElement?.innerText;

    // Call responseUpdate with wrong token
    testFrame.responseUpdate({ 
      frameId: uniqueElementName, 
      0: { token: wrongToken, value: responseValue } 
    });
    
    // Value should not change since token doesn't match
    expect(dataElement?.innerText).toBe(initialValue);
    expect(dataElement?.innerText).not.toBe(responseValue);

    document.body.removeChild(rootDiv);
  });

  test("sub function with wrong token in response does not update value", () => {
    const uniqueElementName = "reveal:container211:frame211:meta:" + btoa('http://localhost');
    const actualToken = "expected-token-123";
    const wrongToken = "unexpected-token-456";
    const responseValue = "should-not-appear";

    const data = {
      record: {
        name: uniqueElementName,
        token: actualToken,
        label: "Card Number",
        inputStyles: { base: { color: "red" } },
      },
      clientJSON: { metaData: { uuid: "1234" } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    defineUrl("http://localhost/?" + btoa(JSON.stringify(data)));
    Object.defineProperty(window, "name", { value: uniqueElementName, writable: true });
    
    const testFrame = RevealFrame.init();

    const dataElement = document.getElementById(uniqueElementName);
    const initialValue = dataElement?.innerText;

    // Get the sub callback
    const onRevealResponseCb = onMock.mock.calls[1][1];

    // Trigger with wrong token (not the expected one)
    onRevealResponseCb({ [wrongToken]: responseValue });

    // Value should not change and error should be shown
    expect(dataElement?.innerText).toBe(initialValue);
    expect(dataElement?.innerText).not.toBe(responseValue);
  });

  test("responseUpdate without data[0] does nothing", () => {
    const uniqueElementName = "reveal:container212:frame212:meta:" + btoa('http://localhost');
    const token = "test-token-no-data";

    const record = {
      name: uniqueElementName,
      token,
    };
    const context = { logLevel: LogLevel.ERROR, env: Env.PROD };
    const rootDiv = document.createElement('div');
    document.body.appendChild(rootDiv);
    
    window.parent.postMessage = jest.fn();
    window.postMessage = jest.fn();
    
    const testFrame = new RevealFrame(record, context, '1234', rootDiv);

    const dataElement = document.getElementById(uniqueElementName);
    const initialValue = dataElement?.innerText;

    // Call responseUpdate without data[0]
    testFrame.responseUpdate({ 
      frameId: uniqueElementName
    });
    
    // Value should not change
    expect(dataElement?.innerText).toBe(initialValue);

    document.body.removeChild(rootDiv);
  });

});

describe("Reveal Frame Class - Additional Tests", () => {
  let emitSpy;
  let targetSpy;
  let onMock;
  let offMock;

  beforeAll(() => {
    // Set default file URL resolve behavior
    setFileURLResolve();

    // Initialize test record
    testRecord = {
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

    // Setup global window
    global.window = Object.create(window);
    listen = jest.fn();
    
    // Define URL helper function
    defineUrl = (url) => {
      Object.defineProperty(window, "location", {
        value: {
          href: url,
        },
        writable: true,
      });

      const base64Domain = btoa('http://localhost');
      // Set both normal and composable window.name for test coverage
      Object.defineProperty(window, "name", {
        value: `reveal-composable:container123:frame123:meta:${base64Domain}`,
        writable: true,
      });
      // For composable container scenario, you can set as below in relevant tests:
      // Object.defineProperty(window, "name", {
      //   value: `reveal-composable:container123:frame123:meta:${base64Domain}`,
      //   writable: true,
      // });
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
    elementName = `reveal:container123:frame123:meta:${btoa('http://localhost')}`;
    elementNameComposable = `reveal-composable:container123:frame123:meta:${btoa('http://localhost')}`;

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

    // Initialize mock functions
    on = jest.fn();
    off = jest.fn();
  });

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
    
    // Clean up DOM between tests to avoid interference
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  // Add your additional tests here
    test("render success response event (file render request message)", async () => {
    // Cover THEN block: successful resolve posts REVEAL_CALL_RESPONSE and HEIGHT_CALLBACK_COMPOSABLE
    setFileURLResolve({
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
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
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + elementNameComposable,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: elementNameComposable },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    await new Promise(r => setTimeout(r, 0));

    const parentCalls = window.parent.postMessage.mock.calls;
    const successCall = parentCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + elementNameComposable));
    expect(successCall).toBeTruthy();
    expect(successCall[0].data.type).toBe(REVEAL_TYPES.RENDER_FILE);
    expect(successCall[0].data.result).toBeDefined();
    // Height callback
    const windowCalls = window.postMessage.mock.calls;
    const heightCall = windowCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window.name));
    expect(heightCall).toBeTruthy();
  });
  test("fileElement.onload callback is triggered and sets dimensions correctly for composable container", async () => {
    // Cover the fileElement.onload callback for image with overflow in composable container
    setFileURLResolve({
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
    });
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { 
          base: { 
            color: 'red', 
            overflow: 'auto',
            width: '300px',
            height: '200px'
          } 
        },
        labelStyles: { base: { color: 'black' } },
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    // Set composable container name
    const composableElementName = `reveal-composable:container123:frame123:meta:${btoa('http://localhost')}`;
    Object.defineProperty(window, "name", { value: composableElementName, writable: true });
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + composableElementName,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: composableElementName },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    // Wait for async operations to complete (Promise resolution and DOM updates)
    await new Promise(r => setTimeout(r, 0));

    // Get the created image element
    const imgElement = document.querySelector('img');
    expect(imgElement).toBeTruthy();

    // Wait for onload handler to be attached
    await new Promise(r => setTimeout(r, 0));

    if (imgElement) {
      Object.defineProperty(imgElement, 'naturalWidth', { value: 800, writable: true });
      Object.defineProperty(imgElement, 'naturalHeight', { value: 600, writable: true });
      imgElement.setAttribute('naturalWidth', '800');
      imgElement.setAttribute('naturalHeight', '600');
      console.log('Simulated natural dimensions:', imgElement.getAttribute('naturalWidth'), imgElement.getAttribute('naturalHeight'));
      // imgElement.naturalHeight = 600;
      
      // Manually trigger onload callback if it exists (since it's set as a property, not event listener)
      if (imgElement.onload) {
        imgElement.onload(new Event('load'));
      }
      
      // Verify dimensions were set
      expect(imgElement?.style?.width).toBe('800px');
      expect(imgElement?.style?.height).toBe('600px');
      
      // Verify height callback was posted
      const windowCalls = window.postMessage.mock.calls;
      const heightCall = windowCalls.find(c => c[0]?.type?.includes('HEIGHT_CALLBACK_COMPOSABLE'));
      expect(heightCall).toBeTruthy();
    }
  });
  test("fileElement.onload callback is triggered and sets dimensions correctly for composable container when overflow is not defined", async () => {
    // Cover the fileElement.onload callback for image with overflow in composable container
    setFileURLResolve({
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
    });
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { 
          base: { 
            color: 'red', 
          } 
        },
        labelStyles: { base: { color: 'black' } },
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    // Set composable container name
    const composableElementName = `reveal-composable:container123:frame123:meta:${btoa('http://localhost')}`;
    Object.defineProperty(window, "name", { value: composableElementName, writable: true });
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + composableElementName,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: composableElementName },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    // Wait for async operations to complete (Promise resolution and DOM updates)
    await new Promise(r => setTimeout(r, 0));

    // Get the created image element
    const imgElement = document.querySelector('img');
    expect(imgElement).toBeTruthy();

    // Wait for onload handler to be attached
    await new Promise(r => setTimeout(r, 0));

    if (imgElement) {      
      // Manually trigger onload callback if it exists (since it's set as a property, not event listener)
      if (imgElement.onload) {
        imgElement.onload(new Event('load'));
      }
      
      // Verify dimensions were set
      expect(imgElement?.style?.width).toBe('');
      expect(imgElement?.style?.height).toBe('');
      
      // Verify height callback was posted
      const windowCalls = window.postMessage.mock.calls;
      const heightCall = windowCalls.find(c => c[0]?.type?.includes('HEIGHT_CALLBACK_COMPOSABLE'));
      expect(heightCall).toBeTruthy();
    }
  });
  test("fileElement.onload callback is triggered and sets dimensions correctly for composable container when base styles are not present", async () => {
    // Cover the fileElement.onload callback for image with overflow in composable container
    setFileURLResolve({
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
    });
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { 
          base: { 
            color: 'red', 
            overflow: 'auto',
          } 
        },
        labelStyles: { base: { color: 'black' } },
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };

    // Set composable container name
    const composableElementName = `reveal-composable:container123:frame123:meta:${btoa('http://localhost')}`;
    Object.defineProperty(window, "name", { value: composableElementName, writable: true });
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + composableElementName,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: composableElementName },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    // Wait for async operations to complete (Promise resolution and DOM updates)
    await new Promise(r => setTimeout(r, 0));

    // Get the created image element
    const imgElement = document.querySelector('img');
    expect(imgElement).toBeTruthy();

    // Wait for onload handler to be attached
    // await new Promise(r => setTimeout(r, 0));

    if (imgElement) {      
      // Manually trigger onload callback if it exists (since it's set as a property, not event listener)
      if (imgElement.onload) {
        imgElement.onload(new Event('load'));
      }
      
      // Verify dimensions were set
      expect(imgElement?.style?.width).toBe('');
      expect(imgElement?.style?.height).toBe('');
      
      // Verify height callback was posted
      const windowCalls = window.postMessage.mock.calls;
      const heightCall = windowCalls.find(c => c[0]?.type?.includes('HEIGHT_CALLBACK_COMPOSABLE'));
      expect(heightCall).toBeTruthy();
    }
  });
  test("render success response event (file render request message when style have overflow)", async () => {
    // Cover THEN block: successful resolve posts REVEAL_CALL_RESPONSE and HEIGHT_CALLBACK_COMPOSABLE
    setFileURLResolve({
      fields: { primary_card_file: 'https://shorthand.com/the-craft/types-of-image-file-formats/assets/UPhtO6IIvn/sh-unsplash_4qgbmezb56c-4096x2731.jpeg?response-content-disposition=logo.png' },
      fileMetadata: { contentType: 'image/jpeg' }
    });
    window.postMessage = jest.fn();

    const data = {
      record: {
        skyflowID: '1815-6223-1073-1425',
        table: 'pii_fields',
        column: 'primary_card_file',
        label: 'Card Number',
        altText: 'xxxx-xxxx-xxxx-xxxx',
        inputStyles: { base: { color: 'red', overflow: 'auto' } },
        labelStyles: { base: { color: 'black' } },
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    RevealFrame.init();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + elementNameComposable,
        data: { type: REVEAL_TYPES.RENDER_FILE, iframeName: elementNameComposable },
        clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' }
      }
    }));

    await new Promise(r => setTimeout(r, 0));

    const parentCalls = window.parent.postMessage.mock.calls;
    const successCall = parentCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + elementNameComposable));
    expect(successCall).toBeTruthy();
    expect(successCall[0].data.type).toBe(REVEAL_TYPES.RENDER_FILE);
    expect(successCall[0].data.result).toBeDefined();
    // Height callback
    const windowCalls = window.postMessage.mock.calls;
    const heightCall = windowCalls.find(c => c[0]?.type === (ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window.name));
    expect(heightCall).toBeTruthy();
  });

  test('sub function handles array response and matches by redaction type', () => {
    const token = 'test-token-' + Date.now();
    const uniqueElementName = 'reveal:container400:frame400:meta:' + btoa('http://localhost');
    
    const data = {
      record: {
        name: uniqueElementName,
        token,
        redaction: 'MASKED',
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    Object.defineProperty(window, 'name', {
      value: uniqueElementName,
      writable: true,
    });
    
    const testFrame = RevealFrame.init();
    const onRevealResponseCb = onMock.mock.calls[1][1];
    
    onRevealResponseCb({
      [token]: [
        { value: '4111-1111-1111-1111', redaction: 'PLAIN_TEXT' },
        { value: '4111-****-****-1111', redaction: 'MASKED' },
        { value: '****-****-****-1111', redaction: 'REDACTED' },
      ],
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe('4111-****-****-1111');
  });

  test('sub function handles array response and falls back to first element when no redaction match', () => {
    const token = 'test-token-' + Date.now();
    const uniqueElementName = 'reveal:container401:frame401:meta:' + btoa('http://localhost');
    
    const data = {
      record: {
        name: uniqueElementName,
        token,
        redaction: 'CUSTOM_REDACTION', // This won't match any in array
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    Object.defineProperty(window, 'name', {
      value: uniqueElementName,
      writable: true,
    });
    
    const testFrame = RevealFrame.init();
    const onRevealResponseCb = onMock.mock.calls[1][1];
    
    onRevealResponseCb({
      [token]: [
        { value: '4111-1111-1111-1111', redaction: 'PLAIN_TEXT' },
        { value: '4111-****-****-1111', redaction: 'MASKED' },
      ],
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    // Should fall back to first element
    expect(dataElement?.innerText).toBe('4111-1111-1111-1111');
  });

  test('sub function handles array response without redaction field in record', () => {
    const token = 'test-token-' + Date.now();
    const uniqueElementName = 'reveal:container402:frame402:meta:' + btoa('http://localhost');
    
    const data = {
      record: {
        name: uniqueElementName,
        token,
        // No redaction field
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    Object.defineProperty(window, 'name', {
      value: uniqueElementName,
      writable: true,
    });
    
    const testFrame = RevealFrame.init();
    const onRevealResponseCb = onMock.mock.calls[1][1];
    
    onRevealResponseCb({
      [token]: [
        { value: 'john@example.com', redaction: 'PLAIN_TEXT' },
        { value: 'j***@example.com', redaction: 'MASKED' },
      ],
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    // Should fall back to first element when redaction is undefined
    expect(dataElement?.innerText).toBe('john@example.com');
  });

  test('sub function handles object response with value property', () => {
    const token = 'test-token-' + Date.now();
    const uniqueElementName = 'reveal:container403:frame403:meta:' + btoa('http://localhost');
    
    const data = {
      record: {
        name: uniqueElementName,
        token,
        redaction: 'PLAIN_TEXT',
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    Object.defineProperty(window, 'name', {
      value: uniqueElementName,
      writable: true,
    });
    
    const testFrame = RevealFrame.init();
    const onRevealResponseCb = onMock.mock.calls[1][1];
    
    onRevealResponseCb({
      [token]: { value: 'Test Value 123', redaction: 'PLAIN_TEXT' },
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe('Test Value 123');
  });

  test('sub function handles string response for backward compatibility', () => {
    const token = 'test-token-' + Date.now();
    const uniqueElementName = 'reveal:container404:frame404:meta:' + btoa('http://localhost');
    
    const data = {
      record: {
        name: uniqueElementName,
        token,
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    Object.defineProperty(window, 'name', {
      value: uniqueElementName,
      writable: true,
    });
    
    const testFrame = RevealFrame.init();
    const onRevealResponseCb = onMock.mock.calls[1][1];
    
    onRevealResponseCb({
      [token]: 'Plain String Value',
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe('Plain String Value');
  });

  test('sub function handles array with 5 items and finds correct REDACTED match', () => {
    const token = 'test-token-' + Date.now();
    const uniqueElementName = 'reveal:container405:frame405:meta:' + btoa('http://localhost');
    
    const data = {
      record: {
        name: uniqueElementName,
        token,
        redaction: 'REDACTED',
      },
      clientJSON: { metaData: { uuid: '1234' } },
      context: { logLevel: LogLevel.ERROR, env: Env.PROD },
    };
    
    defineUrl('http://localhost/?' + btoa(JSON.stringify(data)));
    Object.defineProperty(window, 'name', {
      value: uniqueElementName,
      writable: true,
    });
    
    const testFrame = RevealFrame.init();
    const onRevealResponseCb = onMock.mock.calls[1][1];
    
    onRevealResponseCb({
      [token]: [
        { value: '5555-5555-5555-4444', redaction: 'PLAIN_TEXT' },
        { value: '5555-****-****-4444', redaction: 'MASKED' },
        { value: '****-****-****-4444', redaction: 'REDACTED' },
        { value: 'custom-format', redaction: 'CUSTOM' },
        { value: 'another-format', redaction: 'OTHER' },
      ],
    });
    
    const dataElement = document.getElementById(uniqueElementName);
    expect(dataElement?.innerText).toBe('****-****-****-4444');
  });
});