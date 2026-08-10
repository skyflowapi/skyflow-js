/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault helper subset. Telemetry helpers (SDK identity + the sky-metadata
// header builder) are variant-neutral and mirror skyflow-js's — this is the
// deliberate loose-coupling duplication (each package owns its transport/
// telemetry). `generateMockCVV` is flowDB-only (mock-CVV masking) and has no
// skyflow-js counterpart.
import {
  DEFAULT_INPUT_FORMAT_TRANSLATION,
} from '@core/constants';
import * as coreHelpers from '@core/helpers';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { ContainerType, IRevealElementOptions, ISkyflow } from '@core/types';
import properties from '@core/properties';
import SkyflowError from '@core/errors';
import { SdkInfo } from '@core/client';
import { isValidURL, validateBooleanOptions } from '../validators';

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

// --- Variant-neutral element helpers (copied verbatim from skyflow-js helpers;
// the deliberate loose-coupling duplication — each package owns its element DOM
// helpers). Used by the collect element/rendering module graph. ---

// Re-bound from @core/helpers (definitions moved there so the shared
// @core/internal/iframe-form + collect element layer can reach them). Bound as
// local consts — not `export … from` — so jest.spyOn(helpers, …) still hooks
// them.
export const formatFrameNameToId = coreHelpers.formatFrameNameToId;

export const removeSpaces = coreHelpers.removeSpaces;

// Re-bound from @core/helpers (definition moved there so @core/validators and
// core's internal frame layer can reach it). Bound as a local const — not
// `export … from` — so jest.spyOn(helpers, 'appendZeroToOne') still hooks it.
export const appendZeroToOne = coreHelpers.appendZeroToOne;

export const appendMonthFourDigitYears = coreHelpers.appendMonthFourDigitYears;

export const appendMonthTwoDigitYears = coreHelpers.appendMonthTwoDigitYears;

export const getReturnValue = coreHelpers.getReturnValue;

export const domReady = coreHelpers.domReady;

export const getMaskedOutput = coreHelpers.getMaskedOutput;

export const copyToClipboard = coreHelpers.copyToClipboard;

export const handleCopyIconClick = coreHelpers.handleCopyIconClick;

export const fileValidation = coreHelpers.fileValidation;

export const vaildateFileName = coreHelpers.vaildateFileName;

export const styleToString = coreHelpers.styleToString;

export const getContainerType = (frameName:string):ContainerType => {
  const frameNameParts = frameName.split(':');
  if (frameNameParts[0] === 'reveal-composable') {
    return ContainerType.COMPOSE_REVEAL;
  }
  return (frameNameParts[1] === 'group')
    ? ContainerType.COMPOSABLE
    : ContainerType.COLLECT;
};

export const addSeperatorToCardNumberMask = coreHelpers.addSeperatorToCardNumberMask;

// Trim a trailing slash off the configured vault URL (parity with the beta's
// Skyflow.init normalization).
export function formatVaultURL(vaultURL?: string) {
  if (typeof vaultURL !== 'string') return vaultURL;
  return (vaultURL?.trim().slice(-1) === '/') ? vaultURL.slice(0, -1) : vaultURL.trim();
}

// When a valid `customElementsURL` is supplied, point the iframe secure origin
// at it (used for self-hosted element frames).
export function checkAndSetForCustomUrl(config: ISkyflow) {
  if (
    config?.options?.customElementsURL
    && isValidURL(config?.options?.customElementsURL)
  ) {
    const urlString = config?.options?.customElementsURL;
    const url = new URL(urlString);
    const protocol = url.protocol;
    const domain = url.hostname;
    const fullDomain = `${protocol}//${domain}`;
    properties.IFRAME_SECURE_ORIGIN = fullDomain;
    properties.IFRAME_SECURE_SITE = config?.options?.customElementsURL;
  }
}

export const getValueFromName = (name: string, index: number) => {
  const names = name.split(':');
  const value = names.length > index ? names[index] : '';
  return value;
};

export const getAtobValue = (encodedValue: string) => {
  try {
    const decodedValue = atob(encodedValue);
    return decodedValue;
  } catch (err) {
    return '';
  }
};

export const constructMaskTranslation = (mask) => {
  const translation = {};
  if (mask) {
    Object.keys(mask[2]).forEach((key) => {
      translation[key] = { pattern: mask[2][key] };
    });
  }
  return translation;
};

export const formatRevealElementOptions = (options:IRevealElementOptions) => {
  let revealOptions:any = {};
  if (options) {
    revealOptions = { ...options };
    if (Object.prototype.hasOwnProperty.call(revealOptions, 'enableCopy') && !validateBooleanOptions(revealOptions.enableCopy)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS, ['enableCopy'], true);
    }
    if (Object.prototype.hasOwnProperty.call(revealOptions, 'format')
    || Object.prototype.hasOwnProperty.call(revealOptions, 'translation')) {
      const revealElementMask:any[] = [];
      if (revealOptions.format) {
        revealElementMask.push(revealOptions.format);
      }

      revealElementMask.push(null); // for replacer

      if (revealOptions.translation) {
        revealElementMask.push(revealOptions.translation);
      } else if (revealOptions.format) {
        revealElementMask.push(DEFAULT_INPUT_FORMAT_TRANSLATION);
      }
      revealOptions = {
        ...revealOptions,
        ...((revealElementMask.length === 3) ? { mask: revealElementMask } : {}),
      };
      delete revealOptions?.format;
      delete revealOptions?.translation;
    }
  }
  return revealOptions;
};
