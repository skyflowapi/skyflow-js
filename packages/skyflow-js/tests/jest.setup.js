/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Mirror the webpack DefinePlugin SDK identity injection for the test runtime.
// jest does not run webpack, so define SDK_NAME/SDK_VERSION as globals from
// this package's own package.json (keeps telemetry output identical in tests).
const pkg = require('../package.json');

global.SDK_NAME = pkg.name;
global.SDK_VERSION = pkg.version;

// Register this package's VariantAdapter with the shared @core layer (mirrors
// the runtime registration in src/skyflow.ts). Tests that import element
// modules directly never load src/skyflow.ts, so @core code that reads the
// adapter — e.g. @core/metrics — needs it registered here.
//
// Registration is LAZY: each member requires the real src/variant-adapter only
// when it is first invoked, never at setup time. Eagerly requiring it here would
// pull src/core-utils/reveal into the module cache before a test file's
// jest.mock() calls take effect (e.g. reveal.test mocks @core/utils/bus-events),
// defeating those mocks. Deferring the require to call-time means the underlying
// modules load inside a running test, with that file's mocks already active.
const { setVariantAdapter } = require('@core/adapters');
const realAdapter = () => require('../src/variant-adapter').default;

setVariantAdapter({
  get sdkDetails() {
    return realAdapter().sdkDetails;
  },
  getMetaObject: (metaData, nav) => realAdapter().getMetaObject(metaData, nav),
  reveal: {
    fetchRecordsByTokenIdComposable: (...args) => realAdapter().reveal.fetchRecordsByTokenIdComposable(...args),
    formatRecordsForClientComposable: (response) => realAdapter().reveal.formatRecordsForClientComposable(response),
  },
});
