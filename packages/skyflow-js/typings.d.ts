/*
Copyright (c) 2023 Skyflow, Inc.
*/
declare module '*.json';

// SDK telemetry identity, injected at build time (webpack DefinePlugin) and in
// tests (jest setupFiles). Each package supplies its own name/version.
declare const SDK_NAME: string;
declare const SDK_VERSION: string;
