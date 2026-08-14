/*
Copyright (c) 2022 Skyflow, Inc.
*/
import uuid from '@core/libs/uuid';
import * as coreHelpers from '@core/helpers';
import * as metricsHelper from '@core/utils/metrics-helper';
import { SdkInfo } from '@core/client';

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

// SDK telemetry / device-identity helpers moved to @core/helpers (variant-neutral;
// only input is this bundle's build-injected SDK identity). Re-bound as consts —
// not `export … from` — so jest.spyOn(helpers, …) still hooks them, and existing
// `../helpers` importers/tests resolve them from this single package surface.
export const getSdkVersionName = metricsHelper.getSdkVersionName;

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

export const getOSDetails = metricsHelper.getOSDetails;

export const getBrowserInfo = metricsHelper.getBrowserInfo;

export const getDeviceType = metricsHelper.getDeviceType;

export const getMetaObject = metricsHelper.getMetaObject;

// Re-bound from @core/helpers (definition moved there so the shared
// @core/external/base-skyflow init path can reach it, and so both SDKs share one
// copy). Bound as a local const — not `export … from` — so jest.spyOn(helpers,
// 'checkAndSetForCustomUrl') still hooks it.
export const checkAndSetForCustomUrl = coreHelpers.checkAndSetForCustomUrl;

export const generateUploadFileName = (fileName:string) => {
  const fileExtentsion = fileName?.split('.')?.pop() || '';
  return `${uuid()}${fileExtentsion && `.${fileExtentsion}`}`;
};

export const getValueFromName = coreHelpers.getValueFromName;

export const getAtobValue = coreHelpers.getAtobValue;
