/*
Copyright (c) 2025 Skyflow, Inc.
*/
import 'core-js/stable';

// Browser/UMD entry for skyflow-flowvault-js. Exposes the flowvault SDK on the
// `SkyflowFlowVault` global (mirrors skyflow-js's `Skyflow`). The FlowVault
// class + container() factory are wired here in Task 2.8; scaffold placeholder.
(function init(root: any) {
  root.SkyflowFlowVault = root.SkyflowFlowVault || {};
}(window));
