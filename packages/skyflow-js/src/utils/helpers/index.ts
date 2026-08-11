/*
Copyright (c) 2022 Skyflow, Inc.
*/
import uuid from '@core/libs/uuid';
import * as coreHelpers from '@core/helpers';
import properties from '@core/properties';
import { ISkyflow } from '@core/types';
import { SdkInfo } from '@core/client';
import { isValidURL } from '../validators';

// SDK telemetry identity, injected at build time (webpack DefinePlugin) / tests
// (jest setupFiles) from this package's own package.json. Replaces the former
// `import SDKDetails from '../../../package.json'`, which under the shared-core
// layout would resolve to the workspace root, not the package.
export const SDK_DETAILS = { name: SDK_NAME, version: SDK_VERSION };

export const flattenObject = (obj, roots = [] as any, sep = '.') => Object.keys(obj).reduce((memo, prop: any) => ({ ...memo, ...(Object.prototype.toString.call(obj[prop]) === '[object Object]' ? flattenObject(obj[prop], roots.concat([prop])) : { [roots.concat([prop]).join(sep)]: obj[prop] }) }), {});

// Re-bound from @core/helpers (definitions moved there so the shared
// @core/internal/iframe-form + collect element layer can reach them). Bound as
// local consts — not `export … from` — so jest.spyOn(helpers, …) still hooks
// them.
export const formatFrameNameToId = coreHelpers.formatFrameNameToId;

export const removeSpaces = coreHelpers.removeSpaces;

// Re-bound from @core/helpers (definition moved there so both SDKs share one
// copy). Bound as a local const — not `export … from` — so jest.spyOn(helpers,
// 'formatVaultURL') still hooks it.
export const formatVaultURL = coreHelpers.formatVaultURL;

export function checkIfDuplicateExists(arr) {
  return new Set(arr).size !== arr.length;
}

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

export const getContainerType = coreHelpers.getContainerType;

export const addSeperatorToCardNumberMask = coreHelpers.addSeperatorToCardNumberMask;

// Re-bound from @core/helpers (definitions moved there so the shared @core
// reveal-frame base can reach them). Bound as local consts — not `export … from`
// — so jest.spyOn(helpers, …) still hooks them.
export const constructMaskTranslation = coreHelpers.constructMaskTranslation;

export const formatRevealElementOptions = coreHelpers.formatRevealElementOptions;
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

export const generateUploadFileName = (fileName:string) => {
  const fileExtentsion = fileName?.split('.')?.pop() || '';
  return `${uuid()}${fileExtentsion && `.${fileExtentsion}`}`;
};

export const getValueFromName = coreHelpers.getValueFromName;

export const getAtobValue = coreHelpers.getAtobValue;
