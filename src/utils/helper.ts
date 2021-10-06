import { LogLevel, MessageType } from '../container/constants';

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

export const printLog = (message: string, messageType:MessageType, showErrorLogs:boolean, showInfoLogs:boolean) => {
  if (messageType === MessageType.INFO && showInfoLogs) {
    console.log(message);
  } else if (showErrorLogs) {
    console.error(message);
  }
};

export const getElementName = (name:string) => (name ? name.substring(name.indexOf(':') + 1, name.indexOf(':', name.indexOf(':') + 1)) : '');
