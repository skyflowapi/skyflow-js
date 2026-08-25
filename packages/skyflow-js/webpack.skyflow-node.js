/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Thin wrapper over the shared node-SDK factory (webpack/node.js).
// UMD global for skyflow-js is `Skyflow`.
module.exports = require('../../webpack/node.js')(__dirname, { library: 'Skyflow' });
