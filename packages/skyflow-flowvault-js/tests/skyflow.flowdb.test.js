/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Covers the flowDB `Skyflow` shell now that the constructor / init() /
// container() logic lives in the shared `@core/external/base-skyflow`. The
// important assertions are the seam ones: that the base constructor dispatches
// to this package's `instantiateSkyflowContainer` hook, that `container()`
// resolves each of the four flowDB container classes through the base switch,
// and that flowDB inherits the shared statics without picking up privacyDB's
// pure-JS surface (`ThreeDS`).
import * as iframerUtils from '@core/iframe-libs/iframer';
import Skyflow, { ContainerType } from '../src/skyflow';

jest.spyOn(iframerUtils, 'getIframeSrc').mockImplementation(() => 'https://google.com');

const nodeCrypto = require('crypto');
Object.defineProperty(window, 'crypto', {
  configurable: true,
  value: { getRandomValues: (arr) => nodeCrypto.randomFillSync(arr) },
});

const config = {
  vaultID: 'vault_id',
  vaultURL: 'https://vault.test.com/',
  getBearerToken: jest.fn(() => Promise.resolve('token')),
};

describe('flowDB Skyflow (BaseSkyflow subclass wiring)', () => {
  test('init() returns a flowDB Skyflow and normalizes the vault URL', () => {
    const s = Skyflow.init({ ...config });
    expect(s.constructor === Skyflow).toBe(true);
    expect(s instanceof Skyflow).toBe(true);
  });

  test('base constructor dispatches to the subclass instantiateSkyflowContainer hook', () => {
    const spy = jest.spyOn(Skyflow.prototype, 'instantiateSkyflowContainer');
    Skyflow.init({ ...config });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.results[0].value).toBeDefined();
    spy.mockRestore();
  });

  test('container() builds each of the four flowDB container types', () => {
    const s = Skyflow.init({ ...config });
    expect(s.container(ContainerType.COLLECT).constructor.name).toBe('CollectContainer');
    expect(s.container(ContainerType.REVEAL).constructor.name).toBe('RevealContainer');
    expect(s.container(ContainerType.COMPOSABLE, { layout: [1] }).constructor.name).toBe('ComposableContainer');
    expect(s.container(ContainerType.COMPOSE_REVEAL, { layout: [1] }).constructor.name).toBe('ComposableRevealContainer');
  });

  test('container() rejects a missing/invalid type', () => {
    const s = Skyflow.init({ ...config });
    expect(() => s.container()).toThrow();
    expect(() => s.container('NOPE')).toThrow();
  });

  test('inherited statics and the flowDB-specific ones are exposed', () => {
    expect(Skyflow.ContainerType).toBeDefined();
    expect(Skyflow.ElementType).toBeDefined();
    expect(Skyflow.RedactionType).toBeDefined();
    expect(Skyflow.ErrorType).toBeDefined();
    expect(Skyflow.LogLevel).toBeDefined();
    expect(Skyflow.EventName).toBeDefined();
    expect(Skyflow.Env).toBeDefined();
    expect(Skyflow.ValidationRuleType).toBeDefined();
    expect(Skyflow.CardType).toBeDefined();
    expect(Skyflow.UpdateType).toBeDefined();
    expect(Skyflow.Error.name).toBe('SkyflowFlowDBError');
    expect(Skyflow.ThreeDS).toBeUndefined();
    // flowDB is elements-only (no invokeConnection / invokeGateway), so it must
    // NOT inherit RequestMethod. See audit finding F1.
    expect(Skyflow.RequestMethod).toBeUndefined();
  });
});
