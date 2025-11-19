import Skyflow, { ContainerType, LogLevel } from '../src/skyflow';
import isTokenValid from '../src/utils/jwt-utils';

// Mock uuid to keep deterministic
jest.mock('../src/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => 'test-uuid'),
}));

// Mock CollectContainer to capture constructor argument
let capturedConfig; // will hold the config object passed to container
jest.mock('../src/core/external/collect/collect-container', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((config) => {
    capturedConfig = config; // grab config which has getSkyflowBearerToken
    return { __mock: 'CollectContainer' };
  }),
}));

// Keep reveal/composable containers real (not used here)

jest.mock('../src/utils/jwt-utils', () => ({
  __esModule: true,
  default: jest.fn(() => true), // override per-test for validity scenarios
}));

describe('#getSkyflowBearerToken coverage', () => {
  afterEach(() => {
    jest.clearAllMocks();
    capturedConfig = undefined;
  });

  test('resolves with valid token on first fetch', async () => {
    const getBearerToken = jest.fn(() => Promise.resolve('valid-token-123'));
    const skyflow = Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://vault.test.com',
      getBearerToken,
      options: {},
    });
    // Create collect container to retrieve reference
    skyflow.container(ContainerType.COLLECT);
    expect(capturedConfig).toBeDefined();
    const fn = capturedConfig.getSkyflowBearerToken;
    const token = await fn();
    expect(token).toBe('valid-token-123');
    expect(getBearerToken).toHaveBeenCalledTimes(1);
  });

  test('rejects when token invalid (isTokenValid returns false)', async () => {
  // Override validity to false for this test
  (isTokenValid).mockReturnValueOnce(false);
    const getBearerToken = jest.fn(() => Promise.resolve('invalid-token')); // returns string but validity check fails
    const skyflow = Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://vault.test.com',
      getBearerToken,
    });
    skyflow.container(ContainerType.COLLECT);
    const fn = capturedConfig.getSkyflowBearerToken;
    await expect(fn()).rejects.toMatchObject({ error: `Token generated from 'getBearerToken' callback function is invalid. Make sure the implementation of 'getBearerToken' is correct.`});
    expect(getBearerToken).toHaveBeenCalledTimes(1);
  });

  test('rejects when getBearerToken promise rejects', async () => {
    const getBearerToken = jest.fn(() => Promise.reject('network error'));
    const skyflow = Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://vault.test.com',
      getBearerToken,
    });
    skyflow.container(ContainerType.COLLECT);
    const fn = capturedConfig.getSkyflowBearerToken;
    await expect(fn()).rejects.toMatchObject({ error: 'network error' });
    expect(getBearerToken).toHaveBeenCalledTimes(1);
  });

  test('reuses cached token without invoking getBearerToken again', async () => {
    const getBearerToken = jest.fn(() => Promise.resolve('stable-token'));
    const skyflow = Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://vault.test.com',
      getBearerToken,
    });
    skyflow.container(ContainerType.COLLECT);
    const fn = capturedConfig.getSkyflowBearerToken;

    // First call fetches token
    const first = await fn();
    expect(first).toBe('stable-token');
    expect(getBearerToken).toHaveBeenCalledTimes(1);

    // Ensure isTokenValid still returns true for reuse path
  // Ensure subsequent validity check remains true
  (isTokenValid).mockReturnValue(true);
    const second = await fn();
    expect(second).toBe('stable-token');
    // No additional fetch
    expect(getBearerToken).toHaveBeenCalledTimes(1);
  });
});
