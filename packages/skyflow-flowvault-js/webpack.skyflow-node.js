/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Thin wrapper over the shared node-SDK factory (webpack/node.js).
// UMD global for skyflow-flowvault-js is `SkyflowFlowVault`.
module.exports = require('../../webpack/node.js')(__dirname, { library: 'SkyflowFlowVault' });
