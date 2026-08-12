/*
Copyright (c) 2025 Skyflow, Inc.
*/
import 'core-js/stable';
import Skyflow from './skyflow';

// Browser/UMD entry for skyflow-flowvault-js. Exposes the flowvault SDK on the
// `Skyflow` global — same name as skyflow-js. The two packages are separate
// bundles with different APIs, so a page must not load both via script tag
// (last one loaded wins the `Skyflow` global); the rare dual-use case is served
// by aliasing on the module import instead.
(function init(root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
}(window));
