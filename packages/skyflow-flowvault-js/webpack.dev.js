/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Thin wrapper over the shared dev-server factory (webpack/dev.js).
// Uses ports 3041/8882 (skyflow-js uses 3040/8881) so both dev servers can run
// side by side. To hit a real flowDB vault locally, add a proxy block below
// (kept local, never committed), e.g.:
//   proxy: { '/vault': { target: 'https://<your-dev-vault>', pathRewrite: { '^/vault': '' }, secure: false, changeOrigin: true } },
module.exports = require('../../webpack/dev.js')(__dirname, {
  port: 3041,
  analyzerPort: 8882,
});
