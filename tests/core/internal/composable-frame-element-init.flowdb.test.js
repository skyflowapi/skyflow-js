/*
Copyright (c) 2022 Skyflow, Inc.

flowDB equivalent of the reveal-response tests in composable-frame-element-init.test.js.
The composable reveal frame now uses the flowDB variant
(fetchRecordsByTokenIdComposableFlowDB / formatRecordsForClientComposableFlowDB), whose success
records carry token only (no valueType) and expose the index-0 shape { 0: {...}, frameId }.
*/
import RevealComposableFrameElementInit from '../../../src/core/internal/composable-frame-element-init';
import { ELEMENT_EVENTS_TO_IFRAME, COMPOSABLE_REVEAL, REVEAL_TYPES } from '../../../src/core/constants';
import bus from 'framebus';

// Control the flowDB composable fetch per test; keep the real formatter so the posted shape is real.
const mockFetchRecordsByTokenIdComposableFlowDB = jest.fn();
jest.mock('../../../src/core-utils/reveal', () => {
  const actual = jest.requireActual('../../../src/core-utils/reveal');
  return {
    ...actual,
    fetchRecordsByTokenIdComposableFlowDB: (...args) => mockFetchRecordsByTokenIdComposableFlowDB(...args),
  };
});

const element = {
  elementName: 'element:group:W29iamVjdCBPYmplY3Rd',
  rows: [{
    elements: [{
      elementType: 'REVEAL',
      elementName: 'reveal-composable:123',
      name: 'reveal-composable:123',
      table: 'patients',
      column: 'card_number',
      token: 'skyflow-id-1',
      elementId: 'element-id-1',
    }],
  }],
  clientDomain: 'http://localhost.com',
};

const on = jest.fn();
const emit = jest.fn();

describe('composable flowDB reveal responses', () => {
  let emitSpy;
  let windowSpy;
  let targetSpy;

  beforeEach(() => {
    windowSpy = jest.spyOn(global, 'window', 'get');
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({ on, emit });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('posts flowDB client shape (token only, no valueType) on success', async () => {
    const containerId = 'reveal-success-flowdb';
    const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;

    // flowDB composable success record: index-0 shape + frameId, no value in client output
    mockFetchRecordsByTokenIdComposableFlowDB.mockResolvedValue({
      records: [{ 0: { token: 'skyflow-id-1', value: '4111111111111111', httpCode: 200 }, frameId: 'reveal-composable:123' }],
    });

    let assertedType = false;
    const postMessageSpy = jest.fn().mockImplementation((data) => {
      if (data.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + containerId) {
        assertedType = true;
        expect(data.data).toEqual({ records: [{ token: 'skyflow-id-1', httpCode: 200 }] });
        expect(data.data.records[0].value).toBeUndefined();
      }
    });
    let messageHandler;
    windowSpy.mockImplementation(() => ({
      name: id,
      location: {
        href: `http://localhost/?${btoa(JSON.stringify({
          record: element,
          clientJSON: { metaData: { clientDomain: 'http://localhost.com' } },
          containerId,
        }))}`,
      },
      parent: { postMessage: postMessageSpy },
      addEventListener: (event, handler) => { if (event === 'message') messageHandler = handler; },
    }));

    RevealComposableFrameElementInit.startFrameElement();
    postMessageSpy.mockClear();

    messageHandler({
      origin: 'http://localhost.com',
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
        context: { vaultId: 'vault-id-1' },
        data: {
          elementIds: [{ frameId: 'reveal-composable:123' }],
          type: REVEAL_TYPES.REVEAL,
          name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
        },
        clientConfig: { clientDomain: 'http://localhost.com', uuid: 'uuid-1', authToken: 'test-token' },
      },
    });

    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(assertedType).toBe(true);
  });

  test('posts flowDB error shape on reject', async () => {
    const containerId = 'reveal-error-flowdb';
    const id = `${COMPOSABLE_REVEAL}:${containerId}:ERROR:`;

    mockFetchRecordsByTokenIdComposableFlowDB.mockRejectedValue({
      errors: [{ token: 'skyflow-id-1', error: { code: 404, description: 'Token not found' }, frameId: 'reveal-composable:123' }],
    });

    let assertedType = false;
    const postMessageSpy = jest.fn().mockImplementation((data) => {
      if (data.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + containerId) {
        assertedType = true;
        expect(data.data).toEqual({
          records: [{ error: 'Token not found', token: 'skyflow-id-1', httpCode: 404 }],
        });
      }
    });
    let messageHandler;
    windowSpy.mockImplementation(() => ({
      name: id,
      location: {
        href: `http://localhost/?${btoa(JSON.stringify({
          record: element,
          clientJSON: { metaData: { clientDomain: 'http://localhost.com' } },
          containerId,
        }))}`,
      },
      parent: { postMessage: postMessageSpy },
      addEventListener: (event, handler) => { if (event === 'message') messageHandler = handler; },
    }));

    RevealComposableFrameElementInit.startFrameElement();
    postMessageSpy.mockClear();

    messageHandler({
      origin: 'http://localhost.com',
      data: {
        name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
        context: { vaultId: 'vault-id-1' },
        data: {
          elementIds: [{ frameId: 'reveal-composable:123' }],
          type: REVEAL_TYPES.REVEAL,
          name: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL + containerId,
        },
        clientConfig: { clientDomain: 'http://localhost.com', uuid: 'uuid-1', authToken: 'test-token' },
      },
    });

    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(assertedType).toBe(true);
  });
});
