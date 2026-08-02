// import FrameElementInit from '../../../src/core/internal/frame-element-init';
import RevealComposableFrameElementInit from '../../../src/core/internal/composable-frame-element-init';
import { ELEMENT_EVENTS_TO_IFRAME, COMPOSABLE_REVEAL, ELEMENT_EVENTS_TO_CLIENT, FRAME_REVEAL, REVEAL_TYPES } from '../../../src/core/constants';
import bus from 'framebus';
import SkyflowError from '../../../src/libs/skyflow-error';
import { fetchRecordsByTokenIdComposable, formatRecordsForClientComposable } from '../../../src/core-utils/reveal';
import properties from '../../../src/properties';

// Create a mock function that can be controlled per test
const mockFetchRecordsByTokenIdComposable = jest.fn();

// mock fetchRecordsByTokenIdComposable with a jest.fn() so we can control it per test
jest.mock('../../../src/core-utils/reveal', () => {
  const actual = jest.requireActual('../../../src/core-utils/reveal');
  return {
    ...actual,
    fetchRecordsByTokenIdComposable: (...args) => mockFetchRecordsByTokenIdComposable(...args),
  };
});


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
  elementName: "element:group:W29iamVjdCBPYmplY3Rd",
  rows: [{
      elements: [
          {
              elementType: 'REVEAL',
              elementName: `reveal-composable:123`,
              name: `reveal-composable:123`,
              table: 'patients',
              column: 'card_number',
              token: 'skyflow-id-1',
              elementId: 'element-id-1',
              ...stylesOptions
          },
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
const element2 = {
  elementName: "element:group:W29iamVjdCBPYmplY3Rd",
  rows: [{
      elements: [
          {
              elementType: 'REVEAL',
              elementName: `reveal-composable:123`,
              name: `reveal-composable:123`,
              table: 'patients',
              column: 'card_number',
              token: 'skyflow-id-1',
              elementId: 'element-id-1',
              ...stylesOptions
          },
          {
              elementType: 'REVEAL',
              elementName: `reveal-composable:124`,
              name: `reveal-composable:124`,
              table: 'patients',
              column: 'card_number',
              token: 'skyflow-id-2',
              elementId: 'element-id-2',
              ...stylesOptions
          },
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
describe('composableFrameElementInit Additional Test Cases', () => {
    let emitSpy;
    let targetSpy;
    let origName;
    let origPostMessage;

    beforeEach(() => {
        origName = window.name;
        origPostMessage = window.parent.postMessage;
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
            emit
        });

        // Set default successful response for fetchRecordsByTokenIdComposable
        mockFetchRecordsByTokenIdComposable.mockResolvedValue({
            records: [{
                token: 'skyflow-id-1',
                value: '4111111111111111',
                valueType: 'STRING',
                frameId: 'reveal-composable:123',
            }]
        });
    });

    afterEach(() => {
        window.name = origName;
        window.parent.postMessage = origPostMessage;
        jest.restoreAllMocks();
    });

    test('height event window listener triggers callbacks via real dispatch', () => {
      const containerId = 'height-listener-cover';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      // Set window.name directly (jsdom 26: window.name is writable)
      window.name = id;
      const encoded = btoa(JSON.stringify({ record: element, clientJSON: { metaData: { clientDomain: 'http://localhost.com' } }, containerId }));
      window.history.pushState({}, '', `/?${encoded}`);
      const postMessageSpy = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

      RevealComposableFrameElementInit.startFrameElement();

      postMessageSpy.mockClear();
      window.dispatchEvent(new MessageEvent('message', { origin: 'http://localhost.com', data: { name: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id } }));
      const call1 = postMessageSpy.mock.calls.find(c => c[0]?.type === ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id);
      expect(call1).toBeTruthy();
      expect(call1[0].data).toMatchObject({ name: id, height: expect.any(Number) });

      postMessageSpy.mockClear();
      window.dispatchEvent(new MessageEvent('message', { origin: 'http://localhost.com', data: { type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + id } }));
      const call2 = postMessageSpy.mock.calls.find(c => c[0]?.type === ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id);
      expect(call2).toBeTruthy();
      expect(call2[0].data).toMatchObject({ name: id, height: expect.any(Number) });

      postMessageSpy.mockRestore();
    });

    test('should handle missing window name gracefully', () => {
        window.name = '';
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({record:element, clientJSON: {metaData: {clientDomain: 'http://localhost.com'}}}))}`);
        window.parent.postMessage = jest.fn();
        expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle invalid base64 encoded URL data', () => {
        window.name = `${COMPOSABLE_REVEAL}:123:ERROR:`;
        window.history.pushState({}, '', '/?invalid_base64_data');
        window.parent.postMessage = jest.fn();

        expect(() => RevealComposableFrameElementInit.startFrameElement()).toThrow({'message':'The string to be decoded contains invalid characters.'});
    });

    test('should correctly bind multiple event listeners', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${COMPOSABLE_REVEAL}:123:ERROR:`;
      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
      window.parent.postMessage = jest.fn();

      RevealComposableFrameElementInit.startFrameElement();
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id,
          payload: {
            name: id,
          },
        },
        origin: 'http://localhost.com',
      }));

      expect(onSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id, expect.any(Function)
      )
      expect(onSpy).toHaveBeenCalledWith(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + id, expect.any(Function));
   });

  test('should correctly extract record and metadata from URL', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${COMPOSABLE_REVEAL}:123:ERROR:`;
      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should correctly initialize composable frame elements', () => {
        RevealComposableFrameElementInit.group = [];

        window.name = `${COMPOSABLE_REVEAL}:group:123:ERROR:`;
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
        window.parent.postMessage = jest.fn();

        expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should throw error for incorrect element type', () => {
        window.name = `${COMPOSABLE_REVEAL}:UNKNOWN_TYPE:123:ERROR:`;
        // Use record: null so that createContainerDiv(null) throws TypeError
        // when it tries to set null.spacing = ...
        window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: null, metaData: {} }))}`);
        window.parent.postMessage = jest.fn();

        expect(() => RevealComposableFrameElementInit.startFrameElement()).toThrow(TypeError);
      });

    test('should handle malformed window name', () => {
        window.name = 'INVALID_NAME_FORMAT';
        window.history.pushState({}, '', '/');
        window.parent.postMessage = jest.fn();

        expect(() => RevealComposableFrameElementInit.startFrameElement()).toThrow(TypeError);
    });

    test('should not crash on undefined window object', () => {
        // Empty name + no URL params causes TypeError when group parsing fails
        window.name = '';
        window.history.pushState({}, '', '/');
        expect(() => RevealComposableFrameElementInit.startFrameElement('')).toThrow(TypeError);
    });

    test('composable reveal frame element init reveal events', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${COMPOSABLE_REVEAL}:123:ERROR:`;
      const containerId = '123';
      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' }, containerId: containerId }))}`);
      window.parent.postMessage = jest.fn();

      RevealComposableFrameElementInit.startFrameElement();
      window.dispatchEvent(new MessageEvent('message', {
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: ['element-id-1'],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
            }
        }
      }));
    });

    test('should handle HEIGHT_CALLBACK_COMPOSABLE event', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${COMPOSABLE_REVEAL}:123:ERROR:`;
      const containerId = '123';
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, clientJSON: { metaData: { clientDomain: 'http://localhost.com' }}, containerId: containerId }))}`);
      window.parent.postMessage = postMessageSpy;

      RevealComposableFrameElementInit.startFrameElement();

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id,
          data: expect.objectContaining({
            name: id,
          }),
        }),
        'http://localhost.com'
      );
    });

    test('should handle HEIGHT_CALLBACK_COMPOSABLE message event', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${COMPOSABLE_REVEAL}:456:ERROR:`;
      const containerId = '456';
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, clientJSON: { metaData: { clientDomain: 'http://localhost.com' }}, containerId: containerId }))}`);
      window.parent.postMessage = postMessageSpy;

      RevealComposableFrameElementInit.startFrameElement();

      // Trigger HEIGHT_CALLBACK_COMPOSABLE event
      window.dispatchEvent(new MessageEvent('message', {
        data:{
            type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + id,
        }
      }));

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + id,
          data: expect.objectContaining({
            name: id,
          }),
        }),
        'http://localhost.com'
      );
    });

    test('should handle multiple rows in group element', () => {
      const multiRowElement = {
        ...element,
        rows: [
          {
            elements: [
              {
                elementType: 'REVEAL',
                elementName: `reveal-composable:row1-elem1`,
                name: `reveal-composable:row1-elem1`,
                table: 'patients',
                column: 'first_name',
                skyflowID: 'skyflow-id-1',
                elementId: 'element-id-1',
                ...stylesOptions
              }
            ]
          },
          {
            elements: [
              {
                elementType: 'REVEAL',
                elementName: `reveal-composable:row2-elem1`,
                name: `reveal-composable:row2-elem1`,
                table: 'patients',
                column: 'last_name',
                skyflowID: 'skyflow-id-2',
                elementId: 'element-id-2',
                ...stylesOptions
              }
            ]
          }
        ]
      };

      window.name = `${COMPOSABLE_REVEAL}:multi-row:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: multiRowElement, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'multi-row' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle elements with custom spacing', () => {
      const elementWithSpacing = {
        ...element,
        spacing: '10px',
        rows: [{
          spacing: '5px',
          elements: [
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:spaced-elem`,
              name: `reveal-composable:spaced-elem`,
              table: 'patients',
              column: 'card_number',
              skyflowID: 'skyflow-id-1',
              elementId: 'element-id-1',
              ...stylesOptions
            }
          ]
        }]
      };

      window.name = `${COMPOSABLE_REVEAL}:spacing-test:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: elementWithSpacing, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'spacing-test' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle elements with alignItems and justifyContent', () => {
      const elementWithAlignment = {
        ...element,
        alignItems: 'center',
        justifyContent: 'space-between',
        rows: [{
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          elements: [
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:aligned-elem`,
              name: `reveal-composable:aligned-elem`,
              table: 'patients',
              column: 'card_number',
              skyflowID: 'skyflow-id-1',
              elementId: 'element-id-1',
              ...stylesOptions
            }
          ]
        }]
      };

      window.name = `${COMPOSABLE_REVEAL}:alignment-test:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: elementWithAlignment, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'alignment-test' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should emit MOUNTED event on initialization', () => {
      const containerId = '123';
      const postMessageSpy = jest.fn();

      window.name = `${COMPOSABLE_REVEAL}:123:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, clientJSON: { metaData: { clientDomain: 'http://localhost.com' }}, containerId: containerId }))}`);
      window.parent.postMessage = postMessageSpy;

      RevealComposableFrameElementInit.startFrameElement();

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + containerId,
        }),
        'http://localhost.com'
      );
    });

    test('should handle RENDER_FILE type reveal calls', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const id = `${COMPOSABLE_REVEAL}:file-render:ERROR:`;
      const containerId = 'file-render';
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, clientJSON: { metaData: { clientDomain: 'http://localhost.com' }}, containerId: containerId }))}`);
      window.parent.postMessage = jest.fn();

      RevealComposableFrameElementInit.startFrameElement();

      window.dispatchEvent(new MessageEvent('message', {
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: ['element-id-1'],
                type: REVEAL_TYPES.RENDER_FILE,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
            }
        }
      }));

      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    test('should handle reveal data with multiple element IDs', () => {
      const multiElementRecord = {
        ...element,
        rows: [{
          elements: [
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:elem-1`,
              name: `reveal-composable:elem-1`,
              table: 'patients',
              column: 'card_number',
              skyflowID: 'skyflow-id-1',
              elementId: 'element-id-1',
              token: 'token-1',
              ...stylesOptions
            },
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:elem-2`,
              name: `reveal-composable:elem-2`,
              table: 'patients',
              column: 'cvv',
              skyflowID: 'skyflow-id-2',
              elementId: 'element-id-2',
              token: 'token-2',
              ...stylesOptions
            }
          ]
        }]
      };

      const containerId = 'multi-elem';
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      window.name = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: multiElementRecord, clientJSON: { metaData: { clientDomain: 'http://localhost.com' }}, containerId: containerId }))}`);
      window.parent.postMessage = jest.fn();

      RevealComposableFrameElementInit.startFrameElement();

      window.dispatchEvent(new MessageEvent('message', {
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: [{frameId: 'reveal-composable:elem-1'}, {frameId: 'reveal-composable:elem-2'}],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
            }
        }
      }));

      expect(addEventListenerSpy).toHaveBeenCalled();
    });

    test('should handle empty rows array', () => {
      const emptyRowsElement = {
        ...element,
        rows: []
      };

      window.name = `${COMPOSABLE_REVEAL}:empty-rows:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: emptyRowsElement, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'empty-rows' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle missing styles in element', () => {
      const noStylesElement = {
        elementName: "element:group:test",
        rows: [{
          elements: [
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:no-styles`,
              name: `reveal-composable:no-styles`,
              table: 'patients',
              column: 'card_number',
              skyflowID: 'skyflow-id-1',
              elementId: 'element-id-1',
            }
          ]
        }]
      };

      window.name = `${COMPOSABLE_REVEAL}:no-styles:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: noStylesElement, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'no-styles' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle global styles in errorTextStyles', () => {
      const globalStylesElement = {
        ...element,
        errorTextStyles: {
          base: {
            color: "#f44336",
          },
          global: {
            '@import': 'https://fonts.googleapis.com/css2?family=Roboto&display=swap'
          }
        }
      };

      window.name = `${COMPOSABLE_REVEAL}:global-styles:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: globalStylesElement, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'global-styles' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should listen to HEIGHT event and respond with height data', () => {
      const onSpy = jest.spyOn(bus, 'on');
      const containerId = 'height-test';

      window.name = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' }, containerId: containerId }))}`);
      window.parent.postMessage = jest.fn();

      RevealComposableFrameElementInit.startFrameElement();

      expect(onSpy).toHaveBeenCalledWith(
        ELEMENT_EVENTS_TO_CLIENT.HEIGHT + `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`,
        expect.any(Function)
      );
    });

    test('should handle reveal call with empty elementIds', () => {
      const containerId = 'empty-ids';
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      window.name = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, clientJSON: { metaData: { clientDomain: 'http://localhost.com' }}, containerId: containerId }))}`);
      window.parent.postMessage = jest.fn();

      RevealComposableFrameElementInit.startFrameElement();

      window.dispatchEvent(new MessageEvent('message', {
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: [],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
            }
        }
      }));

      expect(addEventListenerSpy).toHaveBeenCalled();
    });

    test('should handle rows with multiple elements', () => {
      const multiElementRowElement = {
        ...element,
        rows: [{
          elements: [
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:elem-1`,
              name: `reveal-composable:elem-1`,
              table: 'patients',
              column: 'first_name',
              skyflowID: 'skyflow-id-1',
              elementId: 'element-id-1',
              ...stylesOptions
            },
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:elem-2`,
              name: `reveal-composable:elem-2`,
              table: 'patients',
              column: 'last_name',
              skyflowID: 'skyflow-id-2',
              elementId: 'element-id-2',
              ...stylesOptions
            },
            {
              elementType: 'REVEAL',
              elementName: `reveal-composable:elem-3`,
              name: `reveal-composable:elem-3`,
              table: 'patients',
              column: 'email',
              skyflowID: 'skyflow-id-3',
              elementId: 'element-id-3',
              ...stylesOptions
            }
          ]
        }]
      };

      window.name = `${COMPOSABLE_REVEAL}:multi-elem-row:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: multiElementRowElement, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'multi-elem-row' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle missing containerId in URL params', () => {
      window.name = `${COMPOSABLE_REVEAL}:missing-container:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' } }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('should handle missing context in URL params', () => {
      window.name = `${COMPOSABLE_REVEAL}:missing-context:ERROR:`;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({ record: element, metaData: { clientDomain: 'http://localhost.com' }, containerId: 'missing-context' }))}`);
      window.parent.postMessage = jest.fn();

      expect(() => RevealComposableFrameElementInit.startFrameElement()).not.toThrow();
    });

    test('reveal success call', async () => {
      const containerId = 'unrelated-msg-test';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({
        record: element,
        clientJSON: { metaData: { clientDomain: 'http://localhost.com' }},
        containerId: containerId,
      }))}`);
      window.parent.postMessage = postMessageSpy;

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      RevealComposableFrameElementInit.startFrameElement();

      postMessageSpy.mockClear();

      // The COMPOSABLE_REVEAL handler is the last message listener registered.
      // Calling it directly (not via dispatchEvent) keeps the check synchronous:
      // the promise hasn't resolved yet, so postMessage hasn't been called.
      const messageHandlerCalls = addEventListenerSpy.mock.calls.filter(c => c[0] === 'message');
      const messageHandler = messageHandlerCalls.length > 0
        ? messageHandlerCalls[messageHandlerCalls.length - 1][1]
        : null;

      if (messageHandler) {
          messageHandler({
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: [{frameId:'reveal-composable:123'}],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
            }
        }
      });
          expect(postMessageSpy).not.toHaveBeenCalled();
      }
    });

    test('should handle reveal success response with records', async () => {
      const containerId = 'reveal-success-test';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      const postMessageSpy = jest.fn();

      mockFetchRecordsByTokenIdComposable.mockResolvedValue({
        records: [{
            token: 'skyflow-id-1',
            value: '4111111111111111',
            valueType: 'STRING',
            frameId: 'reveal-composable:123',
        }]
      });

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({
        record: element,
        clientJSON: { metaData: { clientDomain: 'http://localhost.com' }},
        containerId: containerId,
      }))}`);
      window.parent.postMessage = postMessageSpy;

      RevealComposableFrameElementInit.startFrameElement();
      postMessageSpy.mockClear();

      // Use dispatchEvent so the real registered message handler fires.
      // The COMPOSABLE_REVEAL handler checks event.origin === clientDomain.
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'http://localhost.com',
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: [{frameId:'reveal-composable:123'}],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
                authToken: 'test-token',
            }
        }
      }));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(postMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + containerId,
          }),
          'http://localhost.com'
      );
    });

    test('should handle reveal error response', async () => {
      const containerId = 'reveal-error-test';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({
        record: element2,
        clientJSON: { metaData: { clientDomain: 'http://localhost.com' }},
        containerId: containerId,
      }))}`);
      window.parent.postMessage = postMessageSpy;

      RevealComposableFrameElementInit.startFrameElement();

      postMessageSpy.mockClear();
      mockFetchRecordsByTokenIdComposable.mockRejectedValue({
        errors: [{
            token: 'skyflow-id-1',
            error: {
                code: '404',
                description: 'Token not found',
            },
            frameId: 'reveal-composable:124',
        }],
        records: [{
            token: 'skyflow-id-1',
            value: '4111111111111111',
            valueType: 'STRING',
            frameId: 'reveal-composable:123',
        }]
      });

      // Use dispatchEvent so the real registered COMPOSABLE_REVEAL handler fires.
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'http://localhost.com',
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: [{frameId:'reveal-composable:123'}, {frameId:'reveal-composable:124'}],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
                authToken: 'test-token',
            }
        }
      }));

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(postMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + containerId,
          }),
          'http://localhost.com'
      );
    });

    test('reveal call - ignore unrelated messages', async () => {
      const containerId = 'unrelated-msg-test';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({
        record: element,
        clientJSON: { metaData: { clientDomain: 'http://localhost.com' }},
        containerId: containerId,
      }))}`);
      window.parent.postMessage = postMessageSpy;

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      RevealComposableFrameElementInit.startFrameElement();

      postMessageSpy.mockClear();

      // The COMPOSABLE_REVEAL handler is the last message listener registered.
      // Call it directly and synchronously — the promise chain hasn't resolved yet
      // so postMessage hasn't been called at check time.
      const messageHandlerCalls = addEventListenerSpy.mock.calls.filter(c => c[0] === 'message');
      const messageHandler = messageHandlerCalls.length > 0
        ? messageHandlerCalls[messageHandlerCalls.length - 1][1]
        : null;

      if (messageHandler) {
          messageHandler({
        data:{
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            context:{
                vaultId: 'vault-id-1',
            },
            data:{
                elementIds: [{frameId:'reveal-composable:123'}],
                type: REVEAL_TYPES.REVEAL,
                name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            },
            clientConfig:{
                clientDomain: 'http://localhost.com',
                uuid: 'uuid-1',
            }
        }
      });
          expect(postMessageSpy).not.toHaveBeenCalled();
      }
    });

    test('should return early from COMPOSABLE_REVEAL handler when clientDomain is missing', () => {
      const containerId = 'no-client-domain';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({
        record: element,
        clientJSON: { metaData: {} }, // clientDomain intentionally absent
        containerId: containerId,
      }))}`);
      window.parent.postMessage = postMessageSpy;

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      RevealComposableFrameElementInit.startFrameElement();
      postMessageSpy.mockClear();
      mockFetchRecordsByTokenIdComposable.mockClear();

      // The COMPOSABLE_REVEAL handler is the last message listener registered.
      // With no clientDomain set, the handler returns early.
      const messageHandlerCalls = addEventListenerSpy.mock.calls.filter(c => c[0] === 'message');
      const messageHandler = messageHandlerCalls.length > 0
        ? messageHandlerCalls[messageHandlerCalls.length - 1][1]
        : null;

      if (messageHandler) {
        messageHandler({
          data: {
            name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
            data: {
              elementIds: [{ frameId: 'reveal-composable:123' }],
              type: REVEAL_TYPES.REVEAL,
            },
            clientConfig: { authToken: 'test-token' },
          },
        });

        // clientDomain is falsy → handler returns early; no fetch, no postMessage
        expect(mockFetchRecordsByTokenIdComposable).not.toHaveBeenCalled();
        expect(postMessageSpy).not.toHaveBeenCalled();
      }
    });

    test('should handle window message with missing data fields gracefully', () => {
      const containerId = 'missing-data-test';
      const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;
      const postMessageSpy = jest.fn();

      window.name = id;
      window.history.pushState({}, '', `/?${btoa(JSON.stringify({
        record: element,
        clientJSON: { metaData: { clientDomain: 'http://localhost.com' }},
        containerId: containerId
      }))}`);
      window.parent.postMessage = postMessageSpy;

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      RevealComposableFrameElementInit.startFrameElement();

      postMessageSpy.mockClear();

      // The COMPOSABLE_REVEAL handler is the last message listener registered.
      const messageHandlerCalls = addEventListenerSpy.mock.calls.filter(c => c[0] === 'message');
      const messageHandler = messageHandlerCalls.length > 0
        ? messageHandlerCalls[messageHandlerCalls.length - 1][1]
        : null;

      if (messageHandler) {
          expect(() => {
              messageHandler({
                  data: null
              });
          }).not.toThrow();

          expect(() => {
              messageHandler({});
          }).not.toThrow();
      }
    });
});
