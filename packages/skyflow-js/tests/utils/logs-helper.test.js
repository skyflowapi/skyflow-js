/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { getStoredSdkVersion } from '@core/utils/logs-helper';

// In this package SDK_NAME resolves to 'skyflow-js' (jest.setup injects it from
// package.json), so getStoredSdkVersion must keep honouring the legacy global
// `sdk_version` key that skyflow-react-js writes.
describe('Utils/logs-helper getStoredSdkVersion (skyflow-js)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns empty string when nothing is stored', () => {
    expect(getStoredSdkVersion()).toBe('');
  });

  test('honours the legacy global sdk_version key (React wrapper override)', () => {
    localStorage.setItem('sdk_version', 'skyflow-react-js@9.9.9');
    expect(getStoredSdkVersion()).toBe('skyflow-react-js@9.9.9');
  });

  test('per-package namespaced key takes precedence over the legacy global key', () => {
    localStorage.setItem('sdk_version', 'skyflow-react-js@9.9.9');
    localStorage.setItem('sdk_version:skyflow-js', 'skyflow-react-js@8.8.8');
    expect(getStoredSdkVersion()).toBe('skyflow-react-js@8.8.8');
  });
});
