/*
Copyright (c) 2025 Skyflow, Inc.
*/
import 'core-js/stable';
import Skyflow from './skyflow';

// Browser/UMD entry for skyflow-flowvault-js. Exposes the flowvault SDK on the
// `SkyflowFlowVault` global (mirrors skyflow-js's `Skyflow`).
(function init(root: any) {
  root.SkyflowFlowVault = root.SkyflowFlowVault || Skyflow;
}(window));
