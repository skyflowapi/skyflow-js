/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral logging helpers, including `printLog`. `printLog` reads this
// bundle's telemetry identity from the `SDK_NAME`/`SDK_VERSION` DefinePlugin
// globals (injected into every build — including the adapter-less iframe
// bundle), so it is safe to call from shared `@core` code on any thread. Each
// package re-exports these from its own `src/utils/logs-helper`, so existing
// package importers are unchanged.
import { LogLevel, MessageType } from '@core/types';

export const LogLevelOptions = {
  DEBUG: {
    showDebugLogs: true, showInfoLogs: true, showWarnLogs: true, showErrorLogs: true,
  },
  INFO: {
    showDebugLogs: false, showInfoLogs: true, showWarnLogs: true, showErrorLogs: true,
  },
  WARN: {
    showDebugLogs: false, showInfoLogs: false, showWarnLogs: true, showErrorLogs: true,
  },
  ERROR: {
    showDebugLogs: false, showInfoLogs: false, showWarnLogs: false, showErrorLogs: true,
  },
};

export const EnvOptions = {
  PROD: {
    doesReturnValue: false,
  },
  DEV: {
    doesReturnValue: true,
  },
};

export const parameterizedString = (...args: any[]) => {
  const str = args[0];
  const params = args.filter((arg, index) => index !== 0);
  if (!str) return '';
  return str.replace(/%s[0-9]+/g, (matchedStr: any) => {
    const variableIndex = matchedStr.replace('%s', '') - 1;
    return params[variableIndex];
  });
};

export const getElementName = (name:string = '') => {
  const nameParts = name.split(':');
  if (nameParts[1] === 'group') {
    return 'composable container';
  }
  let tempName = atob(nameParts[2]);
  if (tempName.indexOf(':') !== -1) {
    tempName = tempName.substring(0, tempName.indexOf(':'));
  }
  return tempName;
};

const SDK_OWNER = '[Skyflow]';

// Resolve this bundle's SDK language/version label for the error log line.
// Mirrors each package's former `getSDKLanguageAndVersion`: reads the injected
// `SDK_NAME`/`SDK_VERSION` globals, honouring an optional `name@version`
// override stored in localStorage (used by the React wrapper).
const getSdkLanguageAndVersion = () => {
  const metaData = localStorage.getItem('sdk_version') || '';
  let sdkName = SDK_NAME;
  let sdkVersion = SDK_VERSION;
  if (metaData && metaData !== '' && metaData.split('@').length > 1) {
    [sdkName, sdkVersion] = metaData.split('@');
  }
  const sdkLanguage = sdkName === SDK_NAME ? 'JS' : 'React';
  return {
    sdkLanguageAndVersion: `${sdkLanguage} SDK v${sdkVersion}`,
    sdkOwner: 'Skyflow',
  };
};

export const printLog = (message: string, messageType:MessageType, logLevel:LogLevel) => {
  const { sdkLanguageAndVersion, sdkOwner } = getSdkLanguageAndVersion();
  if (logLevel && LogLevelOptions[logLevel]) {
    const {
      showDebugLogs, showInfoLogs, showWarnLogs, showErrorLogs,
    } = LogLevelOptions[logLevel];
    if (messageType === MessageType.LOG && showDebugLogs) {
      // eslint-disable-next-line no-console
      console.log(`${LogLevel.DEBUG}: ${SDK_OWNER} ${message}`);
    } else if (messageType === MessageType.LOG && showInfoLogs) {
      // eslint-disable-next-line no-console
      console.log(`${LogLevel.INFO}: ${SDK_OWNER} ${message}`);
    } else if (messageType === MessageType.WARN && showWarnLogs) {
      // eslint-disable-next-line no-console
      console.warn(`${LogLevel.WARN}: ${SDK_OWNER} ${message}`);
    } else if (messageType === MessageType.ERROR && showErrorLogs) {
      // eslint-disable-next-line no-console
      console.error(`${LogLevel.ERROR}: ${sdkOwner} ${sdkLanguageAndVersion} ${message}`);
    }
  }
};
