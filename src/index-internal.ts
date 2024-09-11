/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import { FrameController } from './core/internal';
import FrameElements from './core/internal/frame-elements';
import RevealFrame from './core/internal/reveal/reveal-frame';
import {
  COLLECT_FRAME_CONTROLLER,
  FRAME_ELEMENT,
  FRAME_REVEAL,
  SKYFLOW_FRAME_CONTROLLER,
  REVEAL_FRAME_CONTROLLER,
} from './core/constants';
import RevealFrameController from './core/internal/reveal/reveal-frame-controller';
import SkyflowFrameController from './core/internal/skyflow-frame/skyflow-frame-controller';
import logs from './utils/logs';
import { MessageType, LogLevel } from './utils/common';
import {
  printLog,
  parameterizedString,
  getElementName,
} from './utils/logs-helper';
import { getAtobValue, getValueFromName } from './utils/helpers';

(function init(root: any) {
  try {
    const frameName = root.name;
    const frameType = getValueFromName(frameName, 0);
    const frameId = getValueFromName(frameName, 1);
    if (frameType === COLLECT_FRAME_CONTROLLER && frameId) {
      const logLevel = getValueFromName(frameName, 2) || LogLevel.ERROR;
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_CONTROLLER_START,
          'index-internal',
          'collect container',
        ),
        MessageType.LOG,
        LogLevel[logLevel],
      );
      root.Skyflow = FrameController;
      FrameController.init(frameId, logLevel);
    } else if (frameType === REVEAL_FRAME_CONTROLLER && frameId) {
      RevealFrameController.init(frameId);
    } else if (frameType === SKYFLOW_FRAME_CONTROLLER) {
      SkyflowFrameController.init(frameId);
    } else if (frameType === FRAME_ELEMENT) {
      const logLevel = getValueFromName(frameName, 4) || LogLevel.ERROR;
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_ELEMET_START,
          'index-internal',
          getElementName(frameName),
        ),
        MessageType.LOG,
        LogLevel[logLevel],
      );
      root.Skyflow = FrameElements;
      FrameElements.start();
    } else if (frameType === FRAME_REVEAL) {
      const logLevel = getValueFromName(frameName, 3) || LogLevel.ERROR;
      printLog(
        parameterizedString(
          logs.infoLogs.REVEAL_ELEMENT_START,
          'index-internal',
          getAtobValue(frameId),
        ),
        MessageType.LOG,
        LogLevel[logLevel],
      );
      RevealFrame.init();
    }
  } catch (e) {
    throw new Error(parameterizedString(logs.errorLogs.INVALID_IFRAME));
  }
}(window));
