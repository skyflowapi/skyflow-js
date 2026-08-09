/*
Copyright (c) 2022 Skyflow, Inc.
*/
// SkyflowError now lives in @core/errors (variant-neutral). Re-exported here so
// existing `../libs/skyflow-error` importers — and runtime `instanceof
// SkyflowError` checks — keep resolving the same class.
export { default, ISkyflowError } from '@core/errors';
