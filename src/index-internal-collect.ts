/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import { FRAME_ELEMENT } from './core/constants';
import logs from './utils/logs';
import { MessageType, LogLevel } from './utils/common';
import {
  printLog,
  parameterizedString,
  getElementName,
} from './utils/logs-helper';
import { getValueFromName } from './utils/helpers';
import FrameElementInit from './core/internal/frame-element-init';

(function init(root: any) {
  try {
    const frameName = root.name;
    const frameType = getValueFromName(frameName, 0);
    console.log('frameType 2', frameType);
    if (frameType === FRAME_ELEMENT) {
      const logLevel = getValueFromName(frameName, 4) || LogLevel.ERROR;
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_ELEMET_START,
          'index-internal-collect',
          getElementName(frameName),
        ),
        MessageType.LOG,
        LogLevel[logLevel],
      );
      root.Skyflow = FrameElementInit;
      FrameElementInit.startFrameElement();
    } else {
      throw new Error('Invalid frame type for collect bundle');
    }
  } catch (e) {
    throw new Error(parameterizedString(logs.errorLogs.INVALID_IFRAME));
  }
}(window));
