import 'core-js/stable';
import { FrameController } from './container/internal';
import FrameElements from './container/internal/FrameElements';
import RevealFrame from './container/internal/reveal/RevealFrame';
import {
  COLLECT_FRAME_CONTROLLER,
  FRAME_ELEMENT,
  FRAME_REVEAL,
  PUREJS_FRAME_CONTROLLER,
  REVEAL_FRAME_CONTROLLER,
} from './container/constants';
import RevealFrameController from './container/internal/reveal/RevealFrameController';
import PureJsFrameController from './container/internal/pureJs/PureJsFrameController';
import logs from './utils/logs';
import { MessageType, LogLevel } from './utils/common';
import {
  printLog,
  parameterizedString,
  getElementName,
} from './utils/logsHelper';

if (typeof window.console === 'undefined') {
  (<any>window).console = <any>{
    error: () => {},
    log: () => {},
  };
}

(function init(root: any) {
  try {
    const names = root.name.split(':');
    if (names[0] === COLLECT_FRAME_CONTROLLER && names[1] !== undefined) {
      root.Skyflow = FrameController;
      FrameController.init(names[1]);
    } else if (names[0] === REVEAL_FRAME_CONTROLLER && names[1] !== undefined) {
      RevealFrameController.init(names[1]);
    } else if (names[0] === PUREJS_FRAME_CONTROLLER && names[1] === undefined) {
      PureJsFrameController.init();
    } else if (names[0] === FRAME_ELEMENT) {
      printLog(
        parameterizedString(
          logs.infoLogs.COLLECT_ELEMET_START,
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
