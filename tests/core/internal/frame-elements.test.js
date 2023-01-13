/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import FrameElements from './../../../src/core/internal/frame-elements';
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
    elementName: `element:CARD_NUMBER:${btoa('123')}`,
    rows: [{
        elements: [
            {
                elementType: 'CARD_NUMBER',
                table: 'patients',
                column: 'card_number',
                ...stylesOptions
            }
        ]
    }]
}
describe('test frame elements', () => {
    let emitSpy;
    let windowSpy;
    beforeEach(() => {
        windowSpy = jest.spyOn(global, 'window', 'get');
        windowSpy.mockImplementation(() => ({
            name: `${FRAME_ELEMENT}:CARD_NUMBER:${btoa('123')}:ERROR`,
        }));

        emitSpy = jest.spyOn(bus, 'emit');
    })
    test('FrameElements constructor', () => {
        FrameElements.start()

        const emitEventName = emitSpy.mock.calls[0][0];
        const emitCb = emitSpy.mock.calls[0][2];
        expect(emitEventName.includes(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY)).toBeTruthy()
        emitCb(element);

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
                fieldType: 'CARD_NUMBER'
            }
        })
        const frameElement = new FrameElements(mockCreateElement, {}, 'ERROR')
        // console.log(frameElement.)
    })

})