/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB reveal is token-only, so it uses the shared @core reveal-frame base
// verbatim — the base already omits the privacyDB file-render path (which lives
// in skyflow-js's subclass via the base's protected hooks). Re-exported here so
// this package's own import path (index-internal, jest.setup, the
// createRevealFrame factory) is unchanged.
export { default } from '@core/internal/reveal/reveal-frame';
