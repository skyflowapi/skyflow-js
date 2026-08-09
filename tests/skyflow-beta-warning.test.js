/*
Copyright (c) 2026 Skyflow, Inc.
*/
// SK-2963: beta-build-in-prod warning.
//
// Mocking package.json (rather than only unit-testing isNonGaVersion/isNonProdVaultUrl in
// isolation, as helpers.test.js does) lets us exercise the real end-to-end wiring in
// Skyflow.init() against a fake non-GA version.
jest.mock('../package.json', () => ({
  name: 'skyflow-js',
  version: '99.0.0-beta.1',
}));

jest.mock('../src/utils/jwt-utils', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

// jsdom in this test environment has no crypto.getRandomValues, which the real uuid()
// depends on; skyflow.test.js works around the same gap the same way.
jest.mock('../src/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => 'b5cbf425-6578-4d40-be88-82a748c36c60'),
}));

import Skyflow from '../src/skyflow';
import { LogLevel } from '../src/utils/common';

describe('Skyflow beta-build-in-prod warning (SK-2963)', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns when a non-GA build looks like it is pointed at a Production vault', () => {
    Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://abc123.vault.skyflowapis.com',
      getBearerToken: jest.fn(),
      options: { logLevel: LogLevel.WARN },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('beta/pre-release build'),
    );
  });

  it('does not warn when the vaultURL carries a non-prod (sandbox) marker', () => {
    Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://abc123.vault.skyflowapis-preview.com',
      getBearerToken: jest.fn(),
      options: { logLevel: LogLevel.WARN },
    });

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('beta/pre-release build'),
    );
  });

  it('does not warn when the log level suppresses WARN', () => {
    Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://abc123.vault.skyflowapis.com',
      getBearerToken: jest.fn(),
      options: { logLevel: LogLevel.ERROR },
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
