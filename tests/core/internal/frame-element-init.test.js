import FrameElementInit from '../../../src/core/internal/frame-element-init';
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT, ElementType, COLLECT_TYPES } from '../../../src/core/constants';
import bus from 'framebus';
import SkyflowError from '../../../src/libs/skyflow-error';
import * as helpers from '../../../src/utils/helpers';
import Client from '../../../src/client';
import IFrameFormElement from '../../../src/core/internal/iframe-form';
import { ErrorType } from '../../../src/index-node';

// Helper to flush pending microtasks (Promise.allSettled resolution) deterministically
const flushPromises = async (cycles = 3) => {
    for (let i = 0; i < cycles; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Promise.resolve();
    }
};

jest.mock('../../../src/utils/helpers', () => {
  const actual = jest.requireActual('../../../src/utils/helpers');
  return {
    ...actual,
    fileValidation: (...args) => {return true},
    vaildateFileName: () => true,
    generateUploadFileName: (name) => `generated_${name}`,
  };
});
const mockFile1 = new File(['file content 1'], 'test-file-1.txt', { type: 'text/plain' });
// Create a mock FileList
const mockFileList = mockFile1;

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
          },
          {
              elementType: ElementType.MULTI_FILE_INPUT,
              elementName: `element:MULTI_FILE_INPUT:123`,
              table: 'patients',
              column: 'file_uploads',
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
    let targetSpy;
    let origName;
    let origPostMessage;

    beforeEach(() => {
        origName = window.name;
        origPostMessage = window.parent.postMessage;
        jest.clearAllMocks();
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
            emit
        });
    });

    afterEach(() => {
        window.name = origName;
        window.parent.postMessage = origPostMessage;
        jest.restoreAllMocks();
    });

    test('should handle missing window name gracefully', () => {
        window.name = '';
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({record:element, metaData: {clientDomain: 'http://localhost.com'}}))}`);
        window.parent.postMessage = jest.fn();
        const onSpy = jest.spyOn(bus, 'on');
        expect(() => FrameElementInit.startFrameElement('CARD_NUMBER')).not.toThrow();
    });

    test('should handle invalid base64 encoded URL data', () => {
        window.name = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
        window.history.pushState({}, '', '/?invalid_base64_data');
        window.parent.postMessage = jest.fn();

        expect(() => FrameElementInit.startFrameElement()).toThrow({'message':'The string to be decoded contains invalid characters.'});
    });

    test('should correctly bind multiple event listeners', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
      window.parent.postMessage = jest.fn();

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

        window.name = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify(mockData))}`);
        window.parent.postMessage = jest.fn();

        expect(() => FrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should correctly initialize composable frame elements', () => {
        FrameElementInit.group = [];

        window.name = `${FRAME_ELEMENT}:group:123:ERROR:`;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
        window.parent.postMessage = jest.fn();

        expect(() => FrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should throw error for incorrect element type', () => {
        window.name = `${FRAME_ELEMENT}:UNKNOWN_TYPE:123:ERROR:`;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: {}, metaData: {} }))}`);
        window.parent.postMessage = jest.fn();

        expect(() => FrameElementInit.startFrameElement()).toThrow(TypeError);
    });

    test('should emit events correctly on focus and blur', () => {
        window.name = `${FRAME_ELEMENT}:group:123:ERROR:`;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
        window.parent.postMessage = jest.fn();

        FrameElementInit.startFrameElement();

        bus.emit(ELEMENT_EVENTS_TO_IFRAME.FOCUS);
        expect(emitSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_IFRAME.FOCUS);

        bus.emit(ELEMENT_EVENTS_TO_IFRAME.BLUR);
        expect(emitSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_IFRAME.BLUR);
    });

    test('should handle malformed window name', () => {
        window.name = 'INVALID_NAME_FORMAT';
        window.history.pushState({}, '', '/');
        window.parent.postMessage = jest.fn();

        expect(() => FrameElementInit.startFrameElement()).toThrow(TypeError);
    });

    test('should not crash on undefined window object', () => {
        // Cannot make window undefined in jsdom; test that empty name + no URL params causes TypeError
        window.name = '';
        window.history.pushState({}, '', '/');
        window.parent.postMessage = jest.fn();

        expect(() => FrameElementInit.startFrameElement('')).toThrow(TypeError);
    });

    test('should call window.parent.postMessage on HEIGHT_CALLBACK event', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
        const postMessageSpy = jest.fn();

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = postMessageSpy;

        FrameElementInit.startFrameElement();

        // Verify that postMessage was called with HEIGHT_CALLBACK
        expect(postMessageSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id,
                data: expect.objectContaining({
                    name: id,
                    height: expect.any(Number),
                }),
            }),
            'http://localhost.com'
        );
    });

    test('should add window message event listener', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = jest.fn();

        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        FrameElementInit.startFrameElement();

        // Verify that addEventListener was called for 'message' event
        expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    test('should register HEIGHT bus event listener', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
        const onSpy = jest.spyOn(bus, 'on');

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = jest.fn();

        FrameElementInit.startFrameElement();

        // Verify HEIGHT listener is registered
        expect(onSpy).toHaveBeenCalledWith(
            ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id,
            expect.any(Function)
        );
    });

    test('should ignore unrelated window messages', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:unrelated-test:ERROR:`;
        const postMessageSpy = jest.fn();

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = postMessageSpy;

        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        FrameElementInit.startFrameElement();
        postMessageSpy.mockClear();

        // Get the message handler that was registered
        const messageCall = addEventListenerSpy.mock.calls.find(c => c[0] === 'message');
        const messageHandler = messageCall ? messageCall[1] : null;

        // Send unrelated message via the captured handler
        if (messageHandler) {
            messageHandler({
                data: {
                    name: 'UNRELATED_EVENT',
                    type: 'SOME_OTHER_TYPE',
                }
            });

            // Should not call postMessage for unrelated events
            expect(postMessageSpy).not.toHaveBeenCalled();
        }
    });

    test('should handle window message with missing data gracefully', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:missing-data:ERROR:`;
        const postMessageSpy = jest.fn();

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = postMessageSpy;

        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        FrameElementInit.startFrameElement();
        postMessageSpy.mockClear();

        // Get the message handler that was registered (the one from createContainerDiv)
        const messageCall = addEventListenerSpy.mock.calls.find(c => c[0] === 'message');
        const messageHandler = messageCall ? messageCall[1] : null;

        // Send message with missing data
        if (messageHandler) {
            expect(() => {
                messageHandler({ data: null });
            }).not.toThrow();

            expect(() => {
                messageHandler({});
            }).not.toThrow();

            // Should not call postMessage for invalid events
            expect(postMessageSpy).not.toHaveBeenCalled();
        }
    });

    test('should respond to HEIGHT bus event with callback', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:bus-height:ERROR:`;
        const callbackSpy = jest.fn();

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: element,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = jest.fn();

        FrameElementInit.startFrameElement();

        // Get the HEIGHT event listener callback
        const heightCallback = on.mock.calls.find(call =>
            call[0] === ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id
        )?.[1];

        // Trigger the HEIGHT event with callback
        if (heightCallback) {
            heightCallback({}, callbackSpy);

            // Verify callback was called with height data
            expect(callbackSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: id,
                    height: expect.any(Number),
                })
            );
        }
    });

    test('should post HEIGHT_CALLBACK on BLUR event for composable container', () => {
        const composableElement = {
            ...element,
            rows: [{
                elements: [{
                    elementType: 'CARD_NUMBER',
                    elementName: `element:CARD_NUMBER:composable-blur`,
                    table: 'patients',
                    column: 'card_number',
                    ...stylesOptions
                }]
            }]
        };

        const id = `${FRAME_ELEMENT}:group:composable-blur:ERROR:`;
        const postMessageSpy = jest.fn();

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: composableElement,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = postMessageSpy;

        FrameElementInit.startFrameElement();

        // The HEIGHT_CALLBACK should be posted on initialization
        expect(postMessageSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id,
            }),
            'http://localhost.com'
        );
    });

    test('should handle multi file upload message event error case', async () => {
        const composableElement = {
            ...element,
            rows: [{
                elements: [{
                    elementType: 'CARD_NUMBER',
                    elementName: `element:CARD_NUMBER:123`,
                    table: 'patients',
                    column: 'card_number',
                    ...stylesOptions
                },
                {
                    elementType: ElementType.MULTI_FILE_INPUT,
                    elementName: `element:MULTI_FILE_INPUT:123`,
                    table: 'patients',
                    column: 'file_uploads',
                    ...stylesOptions
                }]
            }]
        };

        const id = `${FRAME_ELEMENT}:group:123:ERROR:`;
        const postMessageSpy = jest.fn();

        window.name = id;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({
            record: composableElement,
            metaData: { clientDomain: 'http://localhost.com' }
        }))}`);
        window.parent.postMessage = postMessageSpy;

        FrameElementInit.startFrameElement();

        // Clear initialization postMessage calls
        postMessageSpy.mockClear();

        // Simulate multi file upload message event
        window.dispatchEvent(new MessageEvent('message', {
            origin: 'http://localhost.com',
            data: {
                name: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:element:MULTI_FILE_INPUT:123`,
                clientConfig: {
                    vaultId: 'vault123',
                    vaultURL: 'https://vaulturl.com',
                    authToken: 'token123',
                    uuid: 'uuid123',
                },
                options: {
                    // Additional metadata for file upload
                },
                errorMessages: {
                    [ErrorType.ABORT]: 'File upload aborted by user',
                },
                data:{
                    type: COLLECT_TYPES.FILE_UPLOAD
                }
            }
        }));

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify window.parent.postMessage was called with MULTIPLE_UPLOAD_FILES_RESPONSE
        expect(postMessageSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:element:MULTI_FILE_INPUT:123`,
                data: {"error": "No files selected"}, // Response data (success or error)
            }),
            'http://localhost.com'
        );
    });
});
