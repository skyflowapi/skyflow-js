/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevelOptions } from '@core/utils/logs-helper';
import { LogLevel, MessageType } from '@core/types';
import { getSDKLanguageAndVersion } from '../helpers';

// The variant-neutral helpers now live in @core/utils/logs-helper; re-exported
// here so existing `../logs-helper` importers keep resolving them. `printLog`
// stays because it reads the package's SDK-language/version.
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
