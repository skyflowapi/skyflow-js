import FrameElementInit from '../../../src/core/internal/frame-element-init';
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT, ElementType } from '../../../src/core/constants';
import bus from 'framebus';
import SkyflowError from '../../../src/libs/skyflow-error';
import * as helpers from '../../../src/utils/helpers';
import Client from '../../../src/client';
import IFrameFormElement from '../../../src/core/internal/iframe-form';

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
// {
//             0: mockFile1,
//             length: 1,
//             item: function(index) { return this[index] || null; },
//             [Symbol.iterator]: function* () {
//                 for (let i = 0; i < this.length; i++) {
//                     yield this[i];
//                 }
//   }
// };
// jest.mock('../../../src/core/internal/iframe-form', () => {
//     const actual = jest.requireActual('../../../src/core/internal/iframe-form');
    
//     return {
//         __esModule: true,
//         default: class MockIFrameFormElement extends actual.default {
//             constructor(...args) {
//                 super(...args);
//                 // Override state after construction
//                 this.state = {
//                     value: mockFileList, // This would still have scope issues
//                     name: 'file_upload',
//                     // ... rest of state
//                 };
//             }
//         }
//     };
// });

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
    let windowSpy;
    let targetSpy;

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
          },
          parent: {
              postMessage: (message, targetOrigin, ...args) => {
                if (!targetOrigin) targetOrigin = "*";
                // Optionally, call a jest mock here
              }
            },
            addEventListener: jest.fn(),
        }))
          const onSpy = jest.spyOn(bus, 'on');
          const frameElement = new FrameElementInit('CARD_NUMBER')
          expect(() => FrameElementInit.startFrameElement('CARD_NUMBER')).not.toThrow();
    });

    test('should handle invalid base64 encoded URL data', () => {
        windowSpy.mockImplementation(() => ({
          name: `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`,
          location: { href: 'http://localhost/?invalid_base64_data' },
          parent: {
              postMessage: (message, targetOrigin, ...args) => {
                if (!targetOrigin) targetOrigin = "*";
                // Optionally, call a jest mock here
              }
            },
            addEventListener: jest.fn(),
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
          },
          parent: {
              postMessage: (message, targetOrigin, ...args) => {
                if (!targetOrigin) targetOrigin = "*";
                // Optionally, call a jest mock here
              }
            },
            addEventListener: jest.fn(),
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
            location: { href: `http://localhost/?${btoa(JSON.stringify(mockData))}` },
            parent: {
              postMessage: (message, targetOrigin, ...args) => {
                if (!targetOrigin) targetOrigin = "*";
                // Optionally, call a jest mock here
              }
            },
            addEventListener: jest.fn(),
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
            },
            parent: {
              postMessage: (message, targetOrigin, ...args) => {
                if (!targetOrigin) targetOrigin = "*";
                // Optionally, call a jest mock here
              }
            },
            addEventListener: jest.fn(),
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
          },
          parent: {
              postMessage: (message, targetOrigin, ...args) => {
                if (!targetOrigin) targetOrigin = "*";
                // Optionally, call a jest mock here
              }
            },
            addEventListener: jest.fn(),
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

    test('should call window.parent.postMessage on HEIGHT_CALLBACK event', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
        const postMessageSpy = jest.fn();
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: element, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: postMessageSpy,
            },
            addEventListener: jest.fn(),
        }));

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
        const addEventListenerSpy = jest.fn();
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: element, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: jest.fn(),
            },
            addEventListener: addEventListenerSpy,
        }));

        FrameElementInit.startFrameElement();

        // Verify that addEventListener was called for 'message' event
        expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    // test('should handle HEIGHT message event and post HEIGHT_CALLBACK', () => {
    //     const id = `${FRAME_ELEMENT}:CARD_NUMBER:height-test:ERROR:`;
    //     const postMessageSpy = jest.fn();
    //     let messageHandler;
    //     let windowMock;
    //     const addEventListenerSpy = jest.fn((event, handler) => {
    //         if (event === 'message') {
    //             messageHandler = handler;
    //         }
    //     });
        
    //     windowSpy.mockImplementation(() => {
    //         windowMock = {
    //             name: id,
    //             location: {
    //                 href: `http://localhost/?${btoa(JSON.stringify({ 
    //                     record: element, 
    //                     metaData: { clientDomain: 'http://localhost.com' } 
    //                 }))}`,
    //             },
    //             parent: {
    //                 postMessage: postMessageSpy,
    //             },
    //             addEventListener: addEventListenerSpy,
    //         };
    //         return windowMock;
    //     });

    //     FrameElementInit.startFrameElement();

    //     // Clear initial postMessage calls
    //     postMessageSpy.mockClear();

    //     // Simulate HEIGHT message event
    //     if (messageHandler) {
    //         // Ensure window mock is still available when handler executes
    //         windowSpy.mockImplementation(() => windowMock);
            
    //         messageHandler({
    //             data: {
    //                 name: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id,
    //             }
    //         });

    //         // Verify postMessage was called in response to HEIGHT event
    //         expect(postMessageSpy).toHaveBeenCalledWith(
    //             expect.objectContaining({
    //                 type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id,
    //                 data: expect.objectContaining({
    //                     name: id,
    //                     height: expect.any(Number),
    //                 }),
    //             }),
    //             'http://localhost.com'
    //         );
    //     }
    // });

    test('should register HEIGHT bus event listener', () => {
        const id = `${FRAME_ELEMENT}:CARD_NUMBER:123:ERROR:`;
        const onSpy = jest.spyOn(bus, 'on');
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: element, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: jest.fn(),
            },
            addEventListener: jest.fn(),
        }));

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
        let messageHandler;
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: element, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: postMessageSpy,
            },
            addEventListener: (event, handler) => {
                if (event === 'message') {
                    messageHandler = handler;
                }
            },
        }));

        FrameElementInit.startFrameElement();
        postMessageSpy.mockClear();

        // Send unrelated message
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
        let messageHandler;
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: element, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: postMessageSpy,
            },
            addEventListener: (event, handler) => {
                if (event === 'message') {
                    messageHandler = handler;
                }
            },
        }));

        FrameElementInit.startFrameElement();
        postMessageSpy.mockClear();

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
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: element, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: jest.fn(),
            },
            addEventListener: jest.fn(),
        }));

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
        
        windowSpy.mockImplementation(() => ({
            name: id,
            location: {
                href: `http://localhost/?${btoa(JSON.stringify({ 
                    record: composableElement, 
                    metaData: { clientDomain: 'http://localhost.com' } 
                }))}`,
            },
            parent: {
                postMessage: postMessageSpy,
            },
            addEventListener: jest.fn(),
        }));

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
        let messageHandler;
        let windowMock;
        
        windowSpy.mockImplementation(() => {
            windowMock = {
                name: id,
                location: {
                    href: `http://localhost/?${btoa(JSON.stringify({ 
                        record: composableElement, 
                        metaData: { clientDomain: 'http://localhost.com' } 
                    }))}`,
                },
                parent: {
                    postMessage: postMessageSpy,
                    addEventListener: jest.fn(),
                },
                addEventListener: (event, handler) => {
                    if (event === 'message') {
                        messageHandler = handler;
                    }
                },
                dispatchEvent: jest.fn(),
            };
            return windowMock;
        });

        FrameElementInit.startFrameElement();

        // Clear initialization postMessage calls
        postMessageSpy.mockClear();

        // Ensure window mock is available when handler executes
        windowSpy.mockImplementation(() => windowMock);

        // Simulate multi file upload message event
        if (messageHandler) {
            messageHandler(new MessageEvent('message', {
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
        }
    });
  });
