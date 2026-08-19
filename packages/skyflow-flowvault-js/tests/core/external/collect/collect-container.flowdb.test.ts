/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB collect container tests. The shared collect()/create()/mount() mechanics
// are covered by the @core suite (skyflow-js tests/core); here we assert only the
// flowDB divergence injected into the subclass: create() accepts the client-facing
// `tableName` (remapped to `table`) and runs the flowDB collect-input validator,
// buildCreateElementFields validates the flowDB `returnMockValue` option,
// validateCollectOptions validates the flowDB upsert/additionalFields shapes and
// forces tokens on, and wrapCollectError maps a truthy error to SkyflowFlowDBError.
import { ElementType } from '@core/constants';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';
import CollectElement from '@core/external/collect/collect-element';
import {
  LogLevel,
  Env,
  ValidationRuleType,
  CollectElementInput,
  Context,
} from '../../../../src/utils/common';
import CollectContainer from '../../../../src/external/collect/collect-container';
import SkyflowFlowDBError from '../../../../src/libs/skyflow-flowdb-error';
import collectVariant from '../../../../src/external/collect/collect-variant';
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

jest.mock('@core/external/collect/collect-element');
(CollectElement as unknown as jest.Mock).mockImplementation(() => ({
  isMounted: () => true,
  mount: jest.fn(),
  isValidElement: () => true,
  unmount: jest.fn(),
  updateElementGroup: jest.fn(),
}));

const metaData: Metadata = {
  uuid: '123',
  sdkVersion: '',
  sessionId: '1234',
  clientDomain: 'http://abc.com',
  containerType: ContainerType.COLLECT,
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

const context: Context = { logLevel: LogLevel.ERROR, env: Env.PROD };

const collectStylesOptions = {
  inputStyles: {
    cardIcon: { position: 'absolute', left: '8px', top: 'calc(50% - 10px)' },
  },
};

// flowDB input uses the client-facing `tableName` key (remapped to `table`).
const cvvInput: CollectElementInput = {
  tableName: 'pii_fields',
  column: 'primary_card.cvv',
  placeholder: 'cvv',
  label: 'cvv',
  type: ElementType.CVV,
  validations: [
    {
      type: ValidationRuleType.LENGTH_MATCH_RULE,
      params: { min: 2, max: 4, error: 'Error' },
    },
  ],
  ...collectStylesOptions,
} as any;

describe('flowDB collect container', () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  const on = jest.fn();

  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({ on, off: jest.fn(), emit: emitSpy });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('constructs a CollectContainer', () => {
    const container = new CollectContainer(metaData, context);
    expect(container).toBeInstanceOf(CollectContainer);
  });

  it('exposes the flowDB collectVariant (skyflowId key strategy)', () => {
    const container = new CollectContainer(metaData, context);
    expect((container as any).collectVariant).toBe(collectVariant);
    expect((container as any).collectVariant.skyflowIdKey).toBe('skyflowId');
  });

  // create() runs validateCreateInput (flowDB collect-input validator) and
  // buildCreateElementFields (remaps tableName -> table, validates options).
  describe('create()', () => {
    it('accepts a flowDB (tableName) input and builds an element', () => {
      const container = new CollectContainer(metaData, context);
      const element = container.create(cvvInput);
      expect(element).toBeDefined();
    });

    it('validateCreateInput: throws when the element type is missing', () => {
      const container = new CollectContainer(metaData, context);
      expect(() => container.create({ tableName: 'cards', column: 'cvv' } as any))
        .toThrow(SkyflowError);
    });

    it('validateCreateInput: throws when skyflowId is not a string', () => {
      const container = new CollectContainer(metaData, context);
      expect(() => container.create({
        tableName: 'cards', column: 'cvv', type: ElementType.CVV, skyflowId: 123,
      } as any)).toThrow(SkyflowError);
    });

    it('buildCreateElementFields: throws when returnMockValue is not a boolean', () => {
      const container = new CollectContainer(metaData, context);
      expect(() => container.create(cvvInput, { returnMockValue: 'yes' } as any))
        .toThrow(SkyflowError);
    });
  });

  // validateCollectOptions is the seam that diverges from the @core privacyDB
  // validators: it validates the flowDB upsert/additionalFields shapes and forces
  // tokens on. Exercised directly, mirroring the composable-container suite.
  describe('validateCollectOptions (flowDB shapes)', () => {
    const container = new CollectContainer(metaData, context);
    const validate = (options: any) => (container as any).validateCollectOptions(options);

    it('is a no-op passthrough (forces tokens on) with no upsert/additionalFields', () => {
      expect(validate({})).toEqual({ tokens: true });
    });

    it('accepts a flowDB upsert ({ tableName, uniqueColumns }) and forces tokens on', () => {
      const options = { upsert: [{ tableName: 'cards', uniqueColumns: ['card_number'] }] };
      expect(validate(options)).toEqual({ ...options, tokens: true });
    });

    it('accepts a flowDB additionalFields ({ tableName, data })', () => {
      const options = { additionalFields: { records: [{ tableName: 'cards', data: { cvv: '123' } }] } };
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
  // passes through unchanged (the deferred/no-error path).
  describe('wrapCollectError', () => {
    const container = new CollectContainer(metaData, context);
    const wrap = (err: any) => (container as any).wrapCollectError(err);

    it('wraps a truthy error as SkyflowFlowDBError', () => {
      expect(wrap({ http_code: 500, message: 'boom' })).toBeInstanceOf(SkyflowFlowDBError);
    });

    it('passes a falsy error through unchanged', () => {
      expect(wrap(null)).toBeNull();
      expect(wrap(undefined)).toBeUndefined();
    });
  });

  it('collect() rejects when no elements are added', (done) => {
    const container = new CollectContainer(metaData, context);
    container.collect().catch((err) => {
      expect(err).toBeInstanceOf(SkyflowError);
      expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT.code);
      done();
    });
  });
});
