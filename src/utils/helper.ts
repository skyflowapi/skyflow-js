import { MessageType } from '../container/constants';

export const LogLevelOptions = {
  INFO: { showInfoLogs: true, showErrorLogs: true, doesReturnValue: false },
  DEBUG: { showInfoLogs: true, showErrorLogs: true, doesReturnValue: true },
  DEMO: { showInfoLogs: false, showErrorLogs: false, doesReturnValue: true },
  PROD: {
    showInfoLogs: false,
    showErrorLogs: true,
    doesReturnValue: false,
  },
};

export const printLog = (message: string, messageType:MessageType,
  showErrorLogs:boolean, showInfoLogs:boolean) => {
  if (messageType === MessageType.INFO && showInfoLogs) {
    // eslint-disable-next-line no-console
    console.log(message);
  } else if (messageType === MessageType.ERROR && showErrorLogs) {
    // eslint-disable-next-line no-console
    console.error(message);
  }
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

export const getElementName = (name:string) => atob(name.split(':')[2]);
