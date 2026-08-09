/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault helper subset. Telemetry helpers (SDK identity + the sky-metadata
// header builder) are variant-neutral and mirror skyflow-js's — this is the
// deliberate loose-coupling duplication (each package owns its transport/
// telemetry). `generateMockCVV` is flowDB-only (mock-CVV masking) and has no
// skyflow-js counterpart.
import { SdkInfo } from '../../client';

// SDK telemetry identity, injected at build time (webpack DefinePlugin) / tests
// (jest setupFiles) from this package's own package.json.
export const SDK_DETAILS = { name: SDK_NAME, version: SDK_VERSION };

interface OSInfo {
  os: string | null;
  version: string | null;
}
interface BrowserInfo {
  browserName: string;
  browserVersion: string;
}

export function getSdkVersionName(metaDataVersion: string, sdkData: SdkInfo): string {
  if (metaDataVersion && metaDataVersion !== '') {
    return `${metaDataVersion}`;
  }
  return `${sdkData.sdkName}@${sdkData.sdkVersion}`;
}

export function getSDKNameAndVersion(metaData?: string): SdkInfo {
  const nameAndVersion: SdkInfo = {
    sdkName: SDK_NAME,
    sdkVersion: SDK_VERSION,
  };
  if (metaData && metaData !== '' && metaData.split('@').length > 1) {
    nameAndVersion.sdkName = metaData.split('@')[0];
    nameAndVersion.sdkVersion = metaData.split('@')[1];
  }
  return nameAndVersion;
}

export const getSDKLanguageAndVersion = () => {
  const metaData = localStorage.getItem('sdk_version') || '';
  const sdkDetails = getSDKNameAndVersion(metaData);
  // Compare against this package's injected identity (skyflow-flowvault-js → JS).
  // Preserves 'React' for the wrapper case (which overrides sdkName via metaData).
  const sdkName = sdkDetails.sdkName === SDK_NAME ? 'JS' : 'React';
  return {
    sdkLanguageAndVersion: `${sdkName} SDK v${sdkDetails.sdkVersion}`,
    sdkOwner: 'Skyflow',
  };
};

export function getOSDetails(userAgentString: string): OSInfo {
  let os: string | null = null;
  let version: string | null = null;

  if (/Windows/.test(userAgentString)) {
    os = 'Windows';
    version = /Windows NT (\d+\.\d+)/.exec(userAgentString)?.[1] ?? null;
  } else if (/Android/.test(userAgentString)) {
    os = 'Android';
    version = /Android (\d+\.\d+)/.exec(userAgentString)?.[1] ?? null;
  } else if (/iOS/.test(userAgentString) || /iPhone/.test(userAgentString)) {
    os = 'iOS';
    version = /OS (\d+[._]\d+[._]?\d*)/.exec(userAgentString)?.[1]?.replace(/_/g, '.') ?? null;
  } else if (/Mac OS X/.test(userAgentString)) {
    os = 'Mac OS X';
    version = /Mac OS X (\d+([._]\d+)*)/.exec(userAgentString)?.[1]?.replace(/_/g, '.') ?? null;
  } else if (/Linux/.test(userAgentString)) {
    os = 'Linux';
    version = /Linux( \w+)*?\/([\w.]+)/.exec(userAgentString)?.[2] ?? null;
  }

  return { os, version };
}

export function getBrowserInfo(userAgentString: string): BrowserInfo {
  let browserName = '';
  let browserVersion = '';

  if (userAgentString.indexOf('MSIE') !== -1 || userAgentString.indexOf('Trident/') !== -1) {
    browserName = 'Internet Explorer';
    const match = userAgentString.match(/(MSIE|rv:)\s?([\d.]+)/);
    if (match) {
      browserVersion = match[2];
    }
  } else if (userAgentString.indexOf('Edge') !== -1) {
    browserName = 'Microsoft Edge';
    const match = userAgentString.match(/Edge\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgentString.indexOf('Chrome') !== -1) {
    browserName = 'Google Chrome';
    const match = userAgentString.match(/Chrome\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgentString.indexOf('Firefox') !== -1) {
    browserName = 'Mozilla Firefox';
    const match = userAgentString.match(/Firefox\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgentString.indexOf('Safari') !== -1) {
    browserName = 'Apple Safari';
    const match = userAgentString.match(/Version\/([\d.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  }

  return { browserName, browserVersion };
}

export function getDeviceType(userAgent: string): string | undefined {
  const mobileRegex = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/;
  const tabletRegex = /(ipad|tablet)/gi;

  if (tabletRegex.test(userAgent)) {
    return 'tablet';
  }
  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

export function getMetaObject(sdkDetails: any, metaData: any, navigator: any) {
  const sdkData: SdkInfo = {
    sdkName: sdkDetails.name,
    sdkVersion: sdkDetails.version,
  };
  const SDKversion = getSdkVersionName(metaData?.sdkVersion, sdkData);
  const osDetail = getOSDetails(navigator.userAgent);
  const browserDetails = getBrowserInfo(navigator.userAgent);
  const deviceDetails = getDeviceType(navigator.userAgent);
  const metaObject = {
    sdk_name_version: SDKversion,
    sdk_client_device_model: deviceDetails,
    sdk_os_version: navigator.platform ?? `${osDetail.os ?? ''} ${osDetail.version ?? ''}`,
    sdk_runtime_details: `${browserDetails.browserName ?? ''} ${browserDetails.browserVersion ?? ''}`,
  };
  return metaObject;
}

// Replaces a captured CVV value with a mock of the same length that never equals
// the entered value. Uses the crypto RNG (leading zeros allowed). flowDB-only.
export const generateMockCVV = (length: number, actualValue: string): string => {
  if (length <= 0) return '';
  const buildCandidate = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let candidate = '';
    for (let i = 0; i < length; i += 1) {
      candidate += (bytes[i] % 10).toString();
    }
    return candidate;
  };
  let mock = buildCandidate();
  while (mock === actualValue) {
    mock = buildCandidate();
  }
  return mock;
};
