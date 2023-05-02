/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from "framebus";
import RevealFrame from "../../../../src/core/internal/reveal/reveal-frame";
import { COPY_UTILS, ELEMENT_EVENTS_TO_IFRAME, REVEAL_ELEMENT_OPTIONS_TYPES } from "../../../../src/core/constants";
import { Env, LogLevel } from "../../../../src/utils/common";

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
//     expect(_on).toHaveBeenCalledTimes(2);
//   });
// });
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

  test("init callback before reveal",()=>{
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
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

  });

  test("init callback after reveal with response value",()=>{
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
        }
      },
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    // reveal response ready
    const onRevealResponseName = on.mock.calls[0][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+undefined);
    const onRevealResponseCb = on.mock.calls[0][1];
    onRevealResponseCb({"1815-6223-1073-1425":"card_value"})

  });

  test("init callback after reveal with response value with mask value",()=>{
    const testFrame = RevealFrame.init();
    // const onCb = jest.fn();
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    // reveal response ready
    const onRevealResponseName = on.mock.calls[0][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+undefined);
    const onRevealResponseCb = on.mock.calls[0][1];
    onRevealResponseCb({"1815":"1234"})
    

  });
  test("init callback after reveal without value",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    // reveal response ready
    const onRevealResponseName = on.mock.calls[0][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY+undefined);
    const onRevealResponseCb = on.mock.calls[0][1];
    onRevealResponseCb({});

  });

  test("reveal set error",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    const onSetErrorName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onSetErrorName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR);
    const onSetErrorCb = on.mock.calls[1][1];
    onSetErrorCb({
      name:"",
      isTriggerError: true,
      clientErrorText:"errorText",
    });
    
  });

  test("reveal reset error",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    // reveal response ready
    const onRevealResponseName = on.mock.calls[1][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR);
    const onRevealResponseCb = on.mock.calls[1][1];
    onRevealResponseCb({
      name: "",
      isTriggerError: false,
    });
    
  });
  test("reveal set token",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);
    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS);
    const onRevealResponseCb = on.mock.calls[2][1];
    onRevealResponseCb({
      name: "",
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
      updatedValue:"121-43sfsdaf31-3sa1a321"
    });
    
  });
  test("reveal set altText",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS);
    const onRevealResponseCb = on.mock.calls[2][1];
    onRevealResponseCb({
      name: "",
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue:"test_altText"
    });
    
  });
  test("reveal clearAltText",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);

    const onRevealResponseName = on.mock.calls[2][0];
    // undefined since with jest window.name will be emptyString("") 
    expect(onRevealResponseName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS);
    const onRevealResponseCb = on.mock.calls[2][1];
    onRevealResponseCb({
      name: "",
      updateType:REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue:null
    });
    
  });
  test("copy icon in reveal elements",()=>{
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
      context: { logLevel: LogLevel.ERROR,env:Env.PROD}
    }
    const emittedEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emittedEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY);
    emitCb(data);
  })

});
