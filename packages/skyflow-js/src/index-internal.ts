/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import {
  COMPOSABLE_REVEAL,
  FRAME_ELEMENT,
  FRAME_REVEAL,
  SKYFLOW_FRAME_CONTROLLER,
} from '@core/constants';
import logs from '@core/utils/logs';
import RevealComposableFrameElementInit from './internal/composable-frame-element-init';
import RevealFrame from './internal/reveal/reveal-frame';
import SkyflowFrameController from './internal/skyflow-frame/skyflow-frame-controller';
import { MessageType, LogLevel } from './utils/common';
import {
  printLog,
  parameterizedString,
  getElementName,
} from './utils/logs-helper';
import { getAtobValue, getValueFromName } from './utils/helpers';
import FrameElementInit from './internal/frame-element-init';

// The composable reveal frame's variant seam (reveal transport + the DOM-heavy
// RevealFrame) is bound in the package subclass RevealComposableFrameElementInit
// above — no runtime variant registry. This entry runs only in the iframe
// bundle, so RevealFrame stays out of the main-thread browser/node bundles.

(function init(root: any) {
  try {
    const frameName = root.name;
    const frameType = getValueFromName(frameName, 0);
    const frameId = getValueFromName(frameName, 1);
    if (frameType === SKYFLOW_FRAME_CONTROLLER) {
      SkyflowFrameController.init(frameId);
    } else if (frameType === COMPOSABLE_REVEAL) {
      root.Skyflow = RevealComposableFrameElementInit;
      RevealComposableFrameElementInit.startFrameElement();
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
      root.Skyflow = FrameElementInit;
      FrameElementInit.startFrameElement();
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
