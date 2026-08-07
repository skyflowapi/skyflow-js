/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Variant-neutral logging helpers. `printLog` stays in src/utils/logs-helper
// (it depends on the package's SDK-language helper); these pure pieces are
// shared and are re-exported from there so existing importers are unchanged.

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
