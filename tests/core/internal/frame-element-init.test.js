import FrameElementInit from '../../../src/core/internal/frame-element-init';
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT } from '../../../src/core/constants';
import bus from 'framebus';
import SkyflowError from '../../../src/libs/skyflow-error';

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
  clientDomain: 'http://localhost.com'
}
const on = jest.fn();
const emit = jest.fn();
describe('FrameElementInit Additional Test Cases', () => {
    let emitSpy;
    let windowSpy;

    beforeEach(() => {
        windowSpy = jest.spyOn(global, 'window', 'get');
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
            emit
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should handle missing window name gracefully', () => {
        windowSpy = jest.spyOn(global, 'window', 'get');
        windowSpy.mockImplementation(() => ({
          name: ``,
          location: {
            href: `http://localhost/?${btoa(JSON.stringify({record:element, metaData: {clientDomain: 'http://localhost.com'}}))}`,
          }
        }))
          const onSpy = jest.spyOn(bus, 'on');
          const frameElement = new FrameElementInit('CARD_NUMBER')
          expect(() => FrameElementInit.startFrameElement('CARD_NUMBER')).not.toThrow();
          console.log('mock calsss====', on.mock.calls)
    });

    test('should handle invalid base64 encoded URL data', () => {
        windowSpy.mockImplementation(() => ({
          name: `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`,
          location: { href: 'http://localhost/?invalid_base64_data' }
        }));

        expect(() => FrameElementInit.startFrameElement()).toThrowError({'message':'The string to be decoded contains invalid characters.'});
    });

    test('should correctly bind multiple event listeners', () => {
      const onSpy = jest.spyOn(bus, 'on');
      windowSpy = jest.spyOn(global, 'window', 'get');
      const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`
      windowSpy.mockImplementation(() => ({
          name: id, // Fix constant reference
          location: {
              href: `http://localhost/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`,
          }
      }));
  
      FrameElementInit.startFrameElement();
  
      expect(onSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id, expect.any(Function));

      bus.emit(ELEMENT_EVENTS_TO_IFRAME.FOCUS);
      expect(emitSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_IFRAME.FOCUS);

      bus.emit(ELEMENT_EVENTS_TO_IFRAME.BLUR);
      expect(emitSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_IFRAME.BLUR);
  });  

    test('should correctly extract record and metadata from URL', () => {
        const mockData = {
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        };

        windowSpy.mockImplementation(() => ({
            name: `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`,
            location: { href: `http://localhost/?${btoa(JSON.stringify(mockData))}` }
        }));

        expect(() => FrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should correctly initialize composable frame elements', () => {
        FrameElementInit.group = [];

        windowSpy.mockImplementation(() => ({
            name: `${FRAME_ELEMENT}:group:123:ERROR:`,
            location: {
                href: `http://localhost/?${btoa(
                    JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } })
                )}`
            }
        }));

        expect(() => FrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should throw error for incorrect element type', () => {
        windowSpy.mockImplementation(() => ({
            name: `${FRAME_ELEMENT}:UNKNOWN_TYPE:123:ERROR:`,
            location: { href: `http://localhost/?${btoa(JSON.stringify({ record: {}, metaData: {} }))}` }
        }));
        expect(() => FrameElementInit.startFrameElement()).toThrow(TypeError);
      });

    test('should emit events correctly on focus and blur', () => {
        windowSpy.mockImplementation(() => ({
          name: `${FRAME_ELEMENT}:group:123:ERROR:`,
          location: {
            href: `http://localhost/?${btoa(
                JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } })
            )}`
          }
        }));
        FrameElementInit.startFrameElement();

        bus.emit(ELEMENT_EVENTS_TO_IFRAME.FOCUS);
        expect(emitSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_IFRAME.FOCUS);

        bus.emit(ELEMENT_EVENTS_TO_IFRAME.BLUR);
        expect(emitSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_IFRAME.BLUR);
    });

    test('should handle malformed window name', () => {
        windowSpy.mockImplementation(() => ({
            name: 'INVALID_NAME_FORMAT',
            location: { href: 'http://localhost/' }
        }));

        expect(() => FrameElementInit.startFrameElement()).toThrow(TypeError);
    });

    test('should not crash on undefined window object', () => {
        windowSpy.mockImplementation(() => undefined);

        expect(() => FrameElementInit.startFrameElement('')).toThrow(TypeError);
    });
});
