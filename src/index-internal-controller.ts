/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import { SKYFLOW_FRAME_CONTROLLER } from './core/constants';
import SkyflowFrameController from './core/internal/skyflow-frame/skyflow-frame-controller';
import logs from './utils/logs';
import { parameterizedString } from './utils/logs-helper';
import { getValueFromName } from './utils/helpers';

(function init(root: any) {
  try {
    const frameName = root.name;
    const frameType = getValueFromName(frameName, 0);
    const frameId = getValueFromName(frameName, 1);
    console.log('frameType 5', frameType);

    if (frameType === SKYFLOW_FRAME_CONTROLLER) {
      SkyflowFrameController.init(frameId);
    } else {
      throw new Error('Invalid frame type for controller bundle');
    }
  } catch (e) {
    throw new Error(parameterizedString(logs.errorLogs.INVALID_IFRAME));
  }
}(window));
