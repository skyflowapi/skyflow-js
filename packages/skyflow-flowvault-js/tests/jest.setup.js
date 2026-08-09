/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Mirror the webpack DefinePlugin SDK identity injection for the test runtime.
// jest does not run webpack, so define SDK_NAME/SDK_VERSION as globals from
// this package's own package.json (keeps telemetry output identical in tests).
const pkg = require('../package.json');

global.SDK_NAME = pkg.name;
global.SDK_VERSION = pkg.version;
