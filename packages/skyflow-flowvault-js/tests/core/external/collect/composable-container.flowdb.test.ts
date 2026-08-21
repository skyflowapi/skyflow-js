/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB composable collect container tests. The shared collect()/mount()/create()
// mechanics are covered by the @core suite (skyflow-js tests/core); here we assert
// the flowDB divergence: create() accepts the client-facing tableName, a full API
// failure is wrapped as SkyflowFlowDBError, and the factory returns the container.
import {
  ELEMENT_EVENTS_TO_IFRAME,
  BaseElementType, FileElementType,
} from '@core/constants';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';
import logs from '@core/utils/logs';
import EventEmitter from '@core/event-emitter';
import CollectElement from '@core/external/collect/collect-element';
import properties from '@core/properties';
import {
  LogLevel,
  Env,
  ValidationRuleType,
  CollectElementInput,
  Context,
  ICollectOptions,
} from '../../../../src/utils/common';
import { CollectResponse } from '../../../../src/internal/internal-types';
import ComposableContainer from '../../../../src/external/collect/compose-collect-container';
import ComposableElement from '../../../../src/external/collect/compose-collect-element';
import SkyflowFlowDBError from '../../../../src/libs/skyflow-flowdb-error';
import { ContainerType } from '../../../../src/skyflow';
import { Metadata } from '../../../../src/internal/internal-types';

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const bus = require('framebus');

jest.mock('@core/iframe-libs/iframer', () => {
  const actualModule = jest.requireActual('@core/iframe-libs/iframer');
  const mockedModule = { ...actualModule };
  mockedModule.__esModule = true;
  mockedModule.getIframeSrc = jest.fn(() => 'https://google.com');
  return mockedModule;
});

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve('token'));

const mockUuid = '1234';
jest.mock('@core/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const mockUnmount = jest.fn();
const updateMock = jest.fn();
jest.mock('@core/external/collect/collect-element');

(CollectElement as unknown as jest.Mock).mockImplementation(
  (_, tempElements) => {
    tempElements.rows[0].elements.forEach((element) => {
      element.isMounted = true;
    });
    return {
      isMounted: () => true,
      mount: jest.fn(),
      isValidElement: () => true,
      unmount: mockUnmount,
      updateElement: updateMock,
    };
  },
);

jest.mock('@core/event-emitter');
const emitMock = jest.fn();

let emitterSpy: Function;
(EventEmitter as unknown as jest.Mock).mockImplementation(() => ({
  on: jest.fn().mockImplementation((name, cb) => {
    emitterSpy = cb;
  }),
  _emit: emitMock,
}));

const metaData: Metadata = {
  uuid: '123',
  sdkVersion: '',
  sessionId: '1234',
  clientDomain: 'http://abc.com',
  containerType: ContainerType.COMPOSABLE,
  clientJSON: {
    config: {
      vaultID: 'vault123',
      vaultURL: 'https://sb.vault.dev',
      getBearerToken,
    },
    metaData: {
      uuid: '123',
      clientDomain: 'http://abc.com',
    },
  },
  getSkyflowBearerToken: getBearerToken,
  skyflowContainer: {
    isControllerFrameReady: true,
  } as any,
};

const collectStylesOptions = {
  inputStyles: {
    cardIcon: {
      position: 'absolute',
      left: '8px',
      top: 'calc(50% - 10px)',
    },
  },
};

// flowDB input uses the client-facing `tableName` key (remapped to `table`).
const cvvElementInput: CollectElementInput = {
  tableName: 'pii_fields',
  column: 'primary_card.cvv',
  placeholder: 'cvv',
  label: 'cvv',
  type: BaseElementType.CVV,
  validations: [
    {
      type: ValidationRuleType.LENGTH_MATCH_RULE,
      params: { min: 2, max: 4, error: 'Error' },
    },
  ],
  ...collectStylesOptions,
} as any;

const cardNumberElement: CollectElementInput = {
  tableName: 'pii_fields',
  column: 'primary_card.card_number',
  type: BaseElementType.CARD_NUMBER,
  ...collectStylesOptions,
} as any;

const context: Context = { logLevel: LogLevel.ERROR, env: Env.PROD };

const collectResponse: CollectResponse = {
  records: [
    {
      table: 'table',
      fields: {
        primary_card: {
          card_number: 'token2',
          cvv: 'token3',
        },
      },
    },
  ],
} as any;

describe('flowDB composable collect container', () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  const on = jest.fn();

  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({ on, off: jest.fn(), emit: emitSpy });
  });

  it('constructs a ComposableContainer', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    expect(container).toBeInstanceOf(ComposableContainer);
  });

  // The controller-frame emit (frame-element-init) no longer passes a reply
  // callback, so the ready listener must not assume `callback` is a function —
  // otherwise it throws "callback is not a function" on init.
  it('registerReadyListener: tolerates a controller emit with no reply callback', () => {
    const onSpy = jest.spyOn(bus, 'on');
    // uuid is mocked to a constant, so all test containers share the event name;
    // clear so mock.calls only holds this container's registrations.
    onSpy.mockClear();
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    const readyEvent = `COMPOSABLE_CONTAINER${(container as any).containerId}`;
    const readyCall = onSpy.mock.calls.find(([event]) => event === readyEvent);
    expect(readyCall).toBeDefined();
    const readyHandler = readyCall![1];
    // 3rd arg (reply callback) omitted by the emitter -> callback is undefined
    expect(() => readyHandler({}, undefined)).not.toThrow();
    expect((container as any).isComposableFrameReady).toBe(true);
  });

  // The composable collect base keeps the default "Creating Collect container" log
  // (only composable reveal overrides it).
  it('getCreateContainerLog returns the collect message', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    expect((container as any).getCreateContainerLog()).toBe(logs.infoLogs.CREATE_COLLECT_CONTAINER);
  });

  it('create() returns a ComposableElement for a flowDB (tableName) input', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    const element = container.create(cvvElementInput);
    expect(element).toBeInstanceOf(ComposableElement);
  });

  // flowDB has no file-element support; file types are rejected at create().
  it('create() rejects FILE_INPUT / MULTI_FILE_INPUT element types', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    expect(() => container.create({
      tableName: 'cards', column: 'file', type: FileElementType.FILE_INPUT,
    } as any)).toThrow(SkyflowError);
    expect(() => container.create({
      tableName: 'cards', column: 'files', type: FileElementType.MULTI_FILE_INPUT,
    } as any)).toThrow(SkyflowError);
  });

  // The documented identity key is `tableName`; a client-supplied `table` is
  // rejected so the composable path matches the collect path (previously `table`
  // silently broke here because of the spread order).
  it('create() rejects a client-supplied `table` key', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    expect(() => container.create({
      table: 'cards', column: 'cvv', type: BaseElementType.CVV,
    } as any)).toThrow(SkyflowError);
  });

  it('collect() rejects a @core SkyflowError when no elements are added', (done) => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    container.collect().catch((err) => {
      expect(err).toBeInstanceOf(SkyflowError);
      expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code);
      done();
    });
  });

  it('collect() rejects COMPOSABLE_CONTAINER_NOT_MOUNTED before mount', (done) => {
    const container = new ComposableContainer(metaData, context, {
      layout: [2], styles: { base: { width: '100px' } },
    });
    container.create(cvvElementInput);
    container.create(cardNumberElement);
    container.collect().catch((err) => {
      expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED.code);
      done();
    });
  });

  it('collect() resolves the unified { records } response on success', async () => {
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
    const container = new ComposableContainer(metaData, context, {
      layout: [2], styles: { base: { width: '100px' } },
    });
    container.create(cvvElementInput);
    container.create(cardNumberElement);
    container.mount('#composable');

    const options: ICollectOptions = { tokens: true } as any;
    const success = container.collect(options);
    window.dispatchEvent(new MessageEvent('message', {
      origin: properties.IFRAME_SECURE_ORIGIN,
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + '1234',
        data: { ...collectResponse },
      },
    }));
    await expect(success).resolves.toEqual(collectResponse);
  });

  it('collect() wraps a full API failure as SkyflowFlowDBError', async () => {
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
    const container = new ComposableContainer(metaData, context, {
      layout: [2], styles: { base: { width: '100px' } },
    });
    container.create(cvvElementInput);
    container.create(cardNumberElement);
    container.mount('#composable');

    const failure = container.collect({ tokens: true } as any);
    window.dispatchEvent(new MessageEvent('message', {
      origin: properties.IFRAME_SECURE_ORIGIN,
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + '1234',
        data: { error: { http_code: 500, message: 'boom' } },
      },
    }));
    await expect(failure).rejects.toBeInstanceOf(SkyflowFlowDBError);
  });

  it('unmount() delegates to the mounted container element', () => {
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
    const container = new ComposableContainer(metaData, context, { layout: [2] });
    container.create(cvvElementInput);
    container.create(cardNumberElement);
    container.mount('#composable');
    container.unmount();
    expect(mockUnmount).toBeCalled();
  });

  // validateCollectOptions is the seam that previously delegated to @core's
  // privacyDB-shaped validators. These assert the container now validates against
  // the flowDB shapes (and forces tokens on) — proving the B1/B2 wiring, not just
  // the standalone validators.
  describe('validateCollectOptions (flowDB shapes)', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    const validate = (options: any) => (container as any).validateCollectOptions(options);

    it('B1: accepts a flowDB upsert ({ tableName, uniqueColumns }) and forces tokens on', () => {
      const options = { upsert: [{ tableName: 'cards', uniqueColumns: ['card_number'] }] };
      expect(() => validate(options)).not.toThrow();
      expect(validate(options)).toEqual({ ...options, tokens: true });
    });

    it('B2: accepts a flowDB additionalFields ({ tableName, data })', () => {
      const options = { additionalFields: { records: [{ tableName: 'cards', data: { cvv: '123' } }] } };
      expect(() => validate(options)).not.toThrow();
      expect(validate(options).tokens).toBe(true);
    });

    it('rejects the privacyDB upsert shape ({ table, column })', () => {
      expect(() => validate({ upsert: [{ table: 'cards', column: 'card_number' }] }))
        .toThrow(SkyflowError);
    });

    it('rejects the privacyDB additionalFields shape ({ table, fields })', () => {
      expect(() => validate({ additionalFields: { records: [{ table: 'cards', fields: { cvv: '1' } }] } }))
        .toThrow(SkyflowError);
    });
  });

  // wrapCollectError maps a truthy error to SkyflowFlowDBError; a falsy error
  // (the deferred/no-error path) passes through unchanged.
  describe('wrapCollectError', () => {
    const container = new ComposableContainer(metaData, context, { layout: [1] });
    const wrap = (err: any) => (container as any).wrapCollectError(err);

    it('wraps a truthy error as SkyflowFlowDBError', () => {
      expect(wrap({ http_code: 500, message: 'boom' })).toBeInstanceOf(SkyflowFlowDBError);
    });

    it('passes a falsy error through unchanged', () => {
      expect(wrap(null)).toBeNull();
      expect(wrap(undefined)).toBeUndefined();
    });
  });
});
