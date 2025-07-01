/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import FrameElementInit from './../../../src/core/internal/frame-element-init';
import {
    FRAME_ELEMENT,
    ELEMENT_EVENTS_TO_IFRAME
} from '../../../src/core/constants';

const stylesOptions = {
    inputStyles: {
      base: {
        border: "1px solid #eae8ee",
        padding: "10px 16px",
        borderRadius: "4px",
        color: "#1d1d1d",
        marginTop: "4px"
      },
      complete: {
        color: "#4caf50"
      },
      empty: {},
      focus: {},
      invalid: {
        color: "#f44336"
      },
      cardIcon: {
        position: "absolute",
        left: "8px",
        top: "calc(50% - 10px)",
      },
      copyIcon: {
        position: "absolute",
        right: "8px",
         top:"calc(50% - 10px)",
        cursor: "pointer",
      }
    },
    labelStyles: {
      base: {
        fontSize: "16px",
        fontWeight: "bold"
      }
    },
    errorTextStyles: {
      base: {
        color: "#f44336"
      }
    }
  };
const element = {
    elementName: `element:CARD_NUMBER:123`,
    rows: [{
        elements: [
            {
                elementType: 'CARD_NUMBER',
                elementName: `element:CARD_NUMBER:123`,
                table: 'patients',
                column: 'card_number',
                ...stylesOptions
            }
        ]
    }],
    errorTextStyles:{
      base: {
        color: "#f44336",
        fontFamily:'Inter',
      },
      global:{
        '@import':'https://font-url.com/Inter'
      }
    },
    clientDomain: 'https://demo.com'
}
describe('test frame elements', () => {
    let emitSpy;
    let windowSpy;
    beforeEach(() => {
        windowSpy = jest.spyOn(global, 'window', 'get');
        windowSpy.mockImplementation(() => ({
            name: `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`,
            location: {
              href: `http://localhost/?${btoa(JSON.stringify({record:element, metaData: {clientDomain: 'https://demo.com'}}))}`,
            },
            addEventListener: jest.fn(),
        }));

        emitSpy = jest.spyOn(bus, 'emit');
    })
    test('FrameElementInit constructor : empty path', () => {
      windowSpy = jest.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(() => ({
        name: `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`,
        location: {
          href: `http://localhost/?${btoa(JSON.stringify({record:element, metaData: {clientDomain: 'https://demo.com'}}))}`,
        },
        addEventListener: jest.fn(),
      }))
        const onSpy = jest.spyOn(bus, 'on');
        FrameElementInit.startFrameElement('123')
        const mockCreateElement = jest.fn().mockImplementation(()=>{
            return {
                resetEvents: jest.fn(),
                on: jest.fn(),
                getStatus: jest.fn(()=>({
                    isFocused: false,
                    isValid: false,
                    isEmpty: true,
                    isComplete: false,
                })),
                fieldType: 'CARD_NUMBER',
                state:{name:''},
                setValidation:jest.fn(),
                setReplacePattern: jest.fn(),
                setMask:jest.fn(),
                getValue: jest.fn(),
                setValue: jest.fn(),
            }
        })
        const frameElement = new FrameElementInit(mockCreateElement, {}, 'ERROR')
    })
    test('FrameElementInit constructor', () => {
      const onSpy = jest.spyOn(bus, 'on');

        FrameElementInit.startFrameElement()
        const mockCreateElement = jest.fn().mockImplementation(()=>{
            return {
                resetEvents: jest.fn(),
                on: jest.fn(),
                getStatus: jest.fn(()=>({
                    isFocused: false,
                    isValid: false,
                    isEmpty: true,
                    isComplete: false,
                })),
                fieldType: 'CARD_NUMBER',
                state:{name:''},
                setValidation:jest.fn(),
                setReplacePattern: jest.fn(),
                setMask:jest.fn(),
                getValue: jest.fn(),
                setValue: jest.fn(),
            }
        })
        const frameElement = new FrameElementInit(mockCreateElement, {}, 'ERROR')
    })

})

describe('test composable frame elements', () => {
  let emitSpy;
  let windowSpy;
  beforeEach(() => {
      windowSpy = jest.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(() => ({
          name: `${FRAME_ELEMENT}:group:${btoa('123')}:ERROR:`,
          location: {
            href: `http://localhost/?${btoa(JSON.stringify({record:element, metaData: {clientDomain: 'https://demo.com'}}))}`,
          },
          addEventListener: jest.fn(),
      }));

      emitSpy = jest.spyOn(bus, 'emit');
  });

  test('FrameElementInit constructor with composable elements : empty path', () => {
    windowSpy.mockImplementation(() => ({
      name: `${FRAME_ELEMENT}:CARD_NUMBER:${btoa('123')}:ERROR:`,
      location: {
        href: `http://localhost/?${btoa(JSON.stringify({record:element, metaData: {clientDomain: 'https://demo.com'}}))}`,
      },
      addEventListener: jest.fn(),
    }))
      const onSpy = jest.spyOn(bus, 'on');
      FrameElementInit.group = [];

      FrameElementInit.startFrameElement()
      const mockCreateElement = jest.fn().mockImplementation(()=>{
          return {
              resetEvents: jest.fn(),
              on: jest.fn(),
              getStatus: jest.fn(()=>({
                  isFocused: false,
                  isValid: false,
                  isEmpty: true,
                  isComplete: false,
              })),
              fieldType: 'CARD_NUMBER',
              state:{name:''},
              setValidation:jest.fn(),
              setReplacePattern: jest.fn(),
              setMask:jest.fn(),
              getValue: jest.fn(),
              setValue: jest.fn(),
          }
      })
      const frameElement = new FrameElementInit(mockCreateElement, {}, 'ERROR')
  })

    
  test('FrameElementInit init', () => {
    FrameElementInit.startFrameElement()

    const mockCreateElement = jest.fn().mockImplementation(()=>{
        return {
            resetEvents: jest.fn(),
            on: jest.fn(),
            getStatus: jest.fn(()=>({
                isFocused: false,
                isValid: false,
                isEmpty: true,
                isComplete: false,
            })),
            fieldType: 'CARD_NUMBER',
            state:{name:''},
            setValidation:jest.fn(),
            setReplacePattern: jest.fn(),
            setMask:jest.fn(),
            getValue: jest.fn(),
            setValue: jest.fn(),
        }
    })
    const frameElement = new FrameElementInit(mockCreateElement, {}, 'ERROR')
  });

})