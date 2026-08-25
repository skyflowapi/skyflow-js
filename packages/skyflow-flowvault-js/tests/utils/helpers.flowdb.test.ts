/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB-only mock-CVV helper. `generateMockCVV` returns a FIXED mock keyed by
// CVV length (817 for 3 digits, 8173 for 4 digits) and '' for any other length.
// The value is constant, so it may coincide with a real CVV of 817/8173 — that is
// acceptable for the GA mock behaviour.
import {
  generateMockCVV,
  MOCK_CVV_THREE_DIGIT,
  MOCK_CVV_FOUR_DIGIT,
  getSDKNameAndVersion,
} from '../../src/utils/helpers';

// SDK identity injected by tests/jest.setup.js from this package's package.json.
declare const SDK_NAME: string;
declare const SDK_VERSION: string;

describe('generateMockCVV', () => {
  test('returns the fixed 3-digit mock for a 3-digit CVV', () => {
    expect(generateMockCVV(3)).toBe(MOCK_CVV_THREE_DIGIT);
    expect(generateMockCVV(3)).toBe('817');
  });

  test('returns the fixed 4-digit mock for a 4-digit CVV', () => {
    expect(generateMockCVV(4)).toBe(MOCK_CVV_FOUR_DIGIT);
    expect(generateMockCVV(4)).toBe('8173');
  });

  test('is deterministic across calls', () => {
    expect(generateMockCVV(3)).toBe(generateMockCVV(3));
    expect(generateMockCVV(4)).toBe(generateMockCVV(4));
  });

  test("returns '' for any other length", () => {
    expect(generateMockCVV(0)).toBe('');
    expect(generateMockCVV(2)).toBe('');
    expect(generateMockCVV(5)).toBe('');
  });
});

describe('getSDKNameAndVersion', () => {
  test('returns the build-injected SDK identity when metaData is undefined', () => {
    expect(getSDKNameAndVersion()).toEqual({ sdkName: SDK_NAME, sdkVersion: SDK_VERSION });
  });

  test('returns the injected identity for an empty string', () => {
    expect(getSDKNameAndVersion('')).toEqual({ sdkName: SDK_NAME, sdkVersion: SDK_VERSION });
  });

  test('returns the injected identity when metaData has no "@" separator', () => {
    expect(getSDKNameAndVersion('no-separator')).toEqual({ sdkName: SDK_NAME, sdkVersion: SDK_VERSION });
  });

  test('parses sdkName and sdkVersion from a "name@version" metaData string', () => {
    expect(getSDKNameAndVersion('skyflow-react-js@1.2.3'))
      .toEqual({ sdkName: 'skyflow-react-js', sdkVersion: '1.2.3' });
  });
});
