/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault is elements-only: its controller-frame bootstrap is exactly the
// shared @core SkyflowContainer base (no pure-JS insert/detokenize/get/delete/
// update surface — see package-split §9 decisions). Re-exported here so this
// package's own import path (skyflow.ts) is unchanged.
export { default } from '@core/external/skyflow-container';
