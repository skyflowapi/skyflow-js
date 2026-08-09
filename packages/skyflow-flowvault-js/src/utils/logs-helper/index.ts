/*
Copyright (c) 2025 Skyflow, Inc.
*/
import { LogLevelOptions } from '@core/utils/logs-helper';
import { LogLevel, MessageType } from '@core/types';
import { getSDKLanguageAndVersion } from '../helpers';

// The variant-neutral helpers live in @core/utils/logs-helper; re-exported here
// so flowvault code imports them from a single logs-helper surface. `printLog`
// is package-owned because it reads this package's SDK-language/version label.
export {
  LogLevelOptions, EnvOptions, parameterizedString, getElementName,
} from '@core/utils/logs-helper';

const SDK_OWNER = '[Skyflow]';

export const printLog = (message: string, messageType:MessageType, logLevel:LogLevel) => {
  const { sdkLanguageAndVersion, sdkOwner } = getSDKLanguageAndVersion();
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
