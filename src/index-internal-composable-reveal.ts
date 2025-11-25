/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import { COMPOSABLE_REVEAL } from './core/constants';
import logs from './utils/logs';
import { MessageType, LogLevel } from './utils/common';
import {
  printLog,
  parameterizedString,
} from './utils/logs-helper';
import { getValueFromName } from './utils/helpers';
import RevealComposableFrameElementInit from './core/internal/composable-frame-element-init';

(function init(root: any) {
  try {
    const frameName = root.name;
    const frameType = getValueFromName(frameName, 0);
    console.log('frameType 3', frameType);
    if (frameType === COMPOSABLE_REVEAL) {
      const logLevel = getValueFromName(frameName, 4) || LogLevel.ERROR;
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_ELEMET_START,
          'index-internal-composable-reveal',
          frameName,
        ),
        MessageType.LOG,
        LogLevel[logLevel],
      );
      root.Skyflow = RevealComposableFrameElementInit;
      RevealComposableFrameElementInit.startFrameElement();
    } else {
      throw new Error('Invalid frame type for composable reveal bundle');
    }
  } catch (e) {
    throw new Error(parameterizedString(logs.errorLogs.INVALID_IFRAME));
  }
}(window));
