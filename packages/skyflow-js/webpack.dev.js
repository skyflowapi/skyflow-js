/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Thin wrapper over the shared dev-server factory (webpack/dev.js).
// To hit a real vault locally, add a proxy block below (kept local, never
// committed), e.g.:
//   proxy: { '/vault': { target: 'https://<your-dev-vault>', pathRewrite: { '^/vault': '' }, secure: false, changeOrigin: true } },
module.exports = require('../../webpack/dev.js')(__dirname, {
  port: 3040,
  analyzerPort: 8881,
});
