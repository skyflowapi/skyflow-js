import bus from 'framebus';
import FrameElements from './../../../src/core/internal/FrameElements';
import {
    FRAME_ELEMENT,
    ELEMENT_EVENTS_TO_IFRAME
} from './../../../src/core/constants';

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
    elementName: `element:CVV:${btoa('123')}`,
    rows: [{
        elements: [
            {
                elementType: 'CVV',
                table: 'patients',
                column: 'cvv',
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
            name: `${FRAME_ELEMENT}:CVV:${btoa('123')}:ERROR`,
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
                fieldType: 'CVV'
            }
        })
        const frameElement = new FrameElements(mockCreateElement, {}, 'ERROR')
        // console.log(frameElement.)
    })

})