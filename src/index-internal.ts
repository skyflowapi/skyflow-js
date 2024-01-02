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
import { initalizeMetricObject, pushEventWithTimeout } from './metrics';

(function init(root: any) {
  try {
    const names = root.name.split(':');
    if (names[0] === COLLECT_FRAME_CONTROLLER && names[1] !== undefined) {
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_CONTROLLER_START,
          'index-internal',
          'collect container',
        ),
        MessageType.LOG,
        LogLevel[names[names.length - 1]],
      );
      root.Skyflow = FrameController;
      FrameController.init(names[1], names[2]);
    } else if (names[0] === REVEAL_FRAME_CONTROLLER && names[1] !== undefined) {
      RevealFrameController.init(names[1]);
    } else if (names[0] === SKYFLOW_FRAME_CONTROLLER) {
      const clientId = names.length > 1 ? names[1] : '';
      SkyflowFrameController.init(clientId);
    } else if (names[0] === FRAME_ELEMENT) {
      if (names[1] && names[3]) {
        initalizeMetricObject(names);
        const elementId = `${names[1]}-${names[3]}`;
        pushEventWithTimeout(elementId);
      }
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_ELEMET_START,
          'index-internal',
          getElementName(root.name),
        ),
        MessageType.LOG,
        LogLevel[names[names.length - 1]],
      );
      root.Skyflow = FrameElements;
      FrameElements.start();
    } else if (names[0] === FRAME_REVEAL) {
      printLog(
        parameterizedString(
          logs.infoLogs.REVEAL_ELEMENT_START,
          'index-internal',
          atob(names[1]),
        ),
        MessageType.LOG,
        LogLevel[names[names.length - 1]],
      );
      RevealFrame.init();
    }
  } catch (e) {
    throw new Error(logs.errorLogs.INVALID_IFRAME);
  }
}(window));
