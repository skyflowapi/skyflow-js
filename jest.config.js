/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Root Jest config for the monorepo. Runs both packages as Jest `projects` in a
// single invocation and merges their coverage into one report. This is the only
// way to get an honest number for the shared `core/` folder: privacyDB and
// flowDB each exercise different slices of core (file-upload/3DS vs flowDB
// reveal), so a core file's true coverage only exists once both suites' hits are
// merged by absolute path — which the `projects` runner does automatically.
// Per-package `npm test` still works standalone (partial core view); use the
// root `test:coverage` script for the merged, accurate picture.
module.exports = {
  projects: [
    '<rootDir>/packages/skyflow-js/jest.config.json',
    '<rootDir>/packages/skyflow-flowvault-js/jest.config.json',
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
};
