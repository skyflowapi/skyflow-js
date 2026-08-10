/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Neutral SkyflowError base (validation / element errors) — re-exported from
// @core so copied element files' `../../libs/skyflow-error` imports and runtime
// `instanceof SkyflowError` checks resolve the same class. flowDB API errors use
// the separate SkyflowFlowDBError (../libs/skyflow-flowdb-error).
export { default, ISkyflowError } from '@core/errors';
