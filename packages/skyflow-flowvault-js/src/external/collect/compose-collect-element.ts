/*
Copyright (c) 2025 Skyflow, Inc.
*/
// The composable collect element is variant-agnostic and lives in @core;
// re-exported here so the flowDB package path (index-node export, tests) stays
// stable and mirrors the privacyDB package layout.
export { default } from '@core/external/collect/composable-collect-element';
