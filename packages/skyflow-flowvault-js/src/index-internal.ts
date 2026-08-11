/*
Copyright (c) 2025 Skyflow, Inc.
*/
import 'core-js/stable';
import {
  COMPOSABLE_REVEAL,
  FRAME_ELEMENT,
  FRAME_REVEAL,
  SKYFLOW_FRAME_CONTROLLER,
} from '@core/constants';
import logs from '@core/utils/logs';
import { setVariantAdapter } from '@core/adapters';
import RevealComposableFrameElementInit from '@core/internal/composable-frame-element-init';
import flowVaultVariantAdapter from './variant-adapter';
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

// Iframe entry for skyflow-flowvault-js. Structurally parallel to skyflow-js's
// index-internal over the same @core skeleton, wired to flowvault's own frame
// controllers (collect tokenize / reveal detokenize). Elements-only: no file
// upload/render frame paths.

// Register this package's VariantAdapter for the iframe bundle. The shared
// @core element/frame layer lifted in Tasks 4.6/4.7 (client transport, the
// composable reveal frame) reads it via getVariantAdapter() while running
// in-iframe. Done explicitly here so registration no longer depends on an
// incidental `../../skyflow` import edge pulling skyflow.ts (and its own
// setVariantAdapter side-effect) into this bundle.
//
// reveal-frame is iframe-only, so its factory is wired onto the adapter HERE
// (not in variant-adapter.ts) — this keeps the DOM-heavy class out of the
// main-thread browser/node bundles that also load variant-adapter.
flowVaultVariantAdapter.reveal.createRevealFrame = (
  record,
  context,
  containerId,
  rootDiv,
) => new RevealFrame(record, context, containerId, rootDiv);
setVariantAdapter(flowVaultVariantAdapter);

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
