/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault helper subset. Telemetry helpers (SDK identity + the sky-metadata
// header builder) are variant-neutral and mirror skyflow-js's — this is the
// deliberate loose-coupling duplication (each package owns its transport/
// telemetry). `generateMockCVV` is flowDB-only (mock-CVV masking) and has no
// skyflow-js counterpart.
import * as coreHelpers from '@core/helpers';
import * as metricsHelper from '@core/utils/metrics-helper';
import { SdkInfo } from '@core/client';

// SDK telemetry identity, injected at build time (webpack DefinePlugin) / tests
// (jest setupFiles) from this package's own package.json.
export const SDK_DETAILS = { name: SDK_NAME, version: SDK_VERSION };

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

export const MOCK_CVV_THREE_DIGIT = '817';

export const MOCK_CVV_FOUR_DIGIT = '8173';

// Returns the fixed mock CVV that masks a captured value of the given length:
// `817` for a 3-digit CVV, `8173` for a 4-digit CVV, `''` for any other length.
// The mock is a constant, so it may coincide with a real CVV of `817`/`8173` —
// that is acceptable for the GA mock behaviour. flowDB-only.
export const generateMockCVV = (length: number): string => {
  switch (length) {
    case 3: return MOCK_CVV_THREE_DIGIT;
    case 4: return MOCK_CVV_FOUR_DIGIT;
    default: return '';
  }
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

export const getContainerType = coreHelpers.getContainerType;

export const addSeperatorToCardNumberMask = coreHelpers.addSeperatorToCardNumberMask;

// Re-bound from @core/helpers (definition moved there so both SDKs share one
// copy). Bound as a local const — not `export … from` — so jest.spyOn(helpers,
// 'formatVaultURL') still hooks it.
export const formatVaultURL = coreHelpers.formatVaultURL;

// Re-bound from @core/helpers (definition moved there so the shared
// @core/external/base-skyflow init path can reach it, and so both SDKs share one
// copy).
export const checkAndSetForCustomUrl = coreHelpers.checkAndSetForCustomUrl;

// Re-bound from @core/helpers (definitions moved there so the shared @core
// reveal-frame base can reach them). Bound as local consts — not `export … from`
// — so jest.spyOn(helpers, …) still hooks them.
export const getValueFromName = coreHelpers.getValueFromName;

export const getAtobValue = coreHelpers.getAtobValue;

export const constructMaskTranslation = coreHelpers.constructMaskTranslation;

export const formatRevealElementOptions = coreHelpers.formatRevealElementOptions;
