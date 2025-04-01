/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from "framebus";
import RevealFrame from "../../../../src/core/internal/reveal/reveal-frame";
import { DEFAULT_FILE_RENDER_ERROR, ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, REVEAL_ELEMENT_OPTIONS_TYPES } from "../../../../src/core/constants";
import { Env, LogLevel } from "../../../../src/utils/common";
import getCssClassesFromJss from "../../../../src/libs/jss-styles";

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
// const _on = jest.fn();
// const _emit = jest.fn();
// bus.target = jest.fn().mockReturnValue({
//   on: _on,
// });
// bus.emit = _emit;

// describe("Reveal Frame Class ", () => {
//   test("init method should emit an event", () => {
//     RevealFrame.init();
//     expect(_emit).toBeCalledTimes(1);
//   });
//   test("constructor should create Span Element with recordId", () => {
//     const frame = new RevealFrame(testRecord, { logLevel: 'PROD' });
//     const testSpanEle = document.querySelector("span");
//     expect(testSpanEle).toBeTruthy();
//     // expect(testSpanEle?.innerText).toBe(testRecord.id);
//     const expectedClassName = getCssClassesFromJss(
//       testRecord.styles,
//       btoa(testRecord.label || testRecord.id)
//     )["base"];
//     // expect(testSpanEle?.classList.contains(expectedClassName)).toBe(true);
//     expect(_on).toHaveBeenCalledTimes(4);
//   });
// });

global.window = Object.create(window);
const defineUrl = (url) => {
  Object.defineProperty(window, "location", {
    value: {
      href: url,
    },
    writable: true,
  });
  Object.defineProperty(window, "name", {
    value: "reveal:1234",
    writable: true,
  });
};
const elementName = "reveal:1234"

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
    const onRevealResponseName = on.mock.calls[0][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY);
    const onRevealResponseCb = on.mock.calls[0][1];
    onRevealResponseCb({"1815-6223-1073-1425":"card_value"})

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
    const onRevealResponseName = on.mock.calls[0][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY);
    const onRevealResponseCb = on.mock.calls[0][1];
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
    const onRevealResponseName = on.mock.calls[0][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY);
    const onRevealResponseCb = on.mock.calls[0][1];
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
    

    const onSetErrorName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onSetErrorName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR+ elementName);
    const onSetErrorCb = on.mock.calls[1][1];
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
    const onRevealResponseName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR+ elementName);;
    const onRevealResponseCb = on.mock.calls[1][1];
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
    
    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[2][1];
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
    

    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[2][1];
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
    

    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[2][1];
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
    

    const onRevealResponseName = on.mock.calls[2][0];
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS+ elementName);
    const onRevealResponseCb = on.mock.calls[2][1];
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
    

    const eventRenderResponse = on.mock.calls[3][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[3][1];
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
    

    const eventRenderResponse = on.mock.calls[3][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[3][1];
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
    

    const eventRenderResponse = on.mock.calls[3][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[3][1];
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
    

    const eventRenderResponse = on.mock.calls[3][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[3][1];
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
    

    const eventRenderResponse = on.mock.calls[3][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY+ elementName);
    const callback = on.mock.calls[3][1];
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
    const onRevealResponseName = onMock.mock.calls[0][0];
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY);
    const onRevealResponseCb = onMock.mock.calls[0][1];
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
    const eventRenderResponse = onMock.mock.calls[3][0];
    expect(eventRenderResponse).toBe(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY + elementName);
    const callback = onMock.mock.calls[3][1];
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
    console.log("testFrame===>", emitSpy.mock.calls);
    const emittedData = emitSpy.mock.calls[0][1];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED+ elementName);;
    expect(emittedData).toEqual({name : elementName})
  });
});