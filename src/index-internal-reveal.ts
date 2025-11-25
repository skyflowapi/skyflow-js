/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import RevealFrame from './core/internal/reveal/reveal-frame';
import { FRAME_REVEAL } from './core/constants';
import logs from './utils/logs';
import { MessageType, LogLevel } from './utils/common';
import {
  printLog,
  parameterizedString,
} from './utils/logs-helper';
import { getAtobValue, getValueFromName } from './utils/helpers';

(function init(root: any) {
  try {
    const frameName = root.name;
    const frameType = getValueFromName(frameName, 0);
    const frameId = getValueFromName(frameName, 1);
    console.log('frameType 6', frameType);

    if (frameType === FRAME_REVEAL) {
      const logLevel = getValueFromName(frameName, 3) || LogLevel.ERROR;
      printLog(
        parameterizedString(
          logs.infoLogs.REVEAL_ELEMENT_START,
          'index-internal-reveal',
          getAtobValue(frameId),
        ),
        MessageType.LOG,
        LogLevel[logLevel],
      );
      RevealFrame.init();
    } else {
      throw new Error('Invalid frame type for reveal bundle');
    }
  } catch (e) {
    throw new Error(parameterizedString(logs.errorLogs.INVALID_IFRAME));
  }
}(window));
