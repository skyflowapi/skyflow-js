/*
Copyright (c) 2025 Skyflow, Inc.
*/
import { getStoredSdkVersion } from '@core/utils/logs-helper';

// In this package SDK_NAME resolves to 'skyflow-flowvault-js'. The legacy global
// `sdk_version` key is written by skyflow-react-js (which wraps skyflow-js only),
// so flowvault must NOT inherit it — otherwise its sky-metadata header and error
// logs would report skyflow-js's React identity on a shared page.
describe('Utils/logs-helper getStoredSdkVersion (skyflow-flowvault-js)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns empty string when nothing is stored', () => {
    expect(getStoredSdkVersion()).toBe('');
  });

  test('ignores the legacy global sdk_version key written by skyflow-react-js', () => {
    localStorage.setItem('sdk_version', 'skyflow-react-js@9.9.9');
    expect(getStoredSdkVersion()).toBe('');
  });

  test('honours its own per-package namespaced key', () => {
    localStorage.setItem('sdk_version', 'skyflow-react-js@9.9.9');
    localStorage.setItem('sdk_version:skyflow-flowvault-js', 'skyflow-flowvault-react-js@1.2.3');
    expect(getStoredSdkVersion()).toBe('skyflow-flowvault-react-js@1.2.3');
  });
});
