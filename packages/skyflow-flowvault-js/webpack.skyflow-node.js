/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Thin wrapper over the shared node-SDK factory (webpack/node.js).
// UMD global for skyflow-flowvault-js is `Skyflow` — same name as skyflow-js
// (the packages are separate bundles; alias on import for the rare dual-use).
module.exports = require('../../webpack/node.js')(__dirname, { library: 'Skyflow' });
