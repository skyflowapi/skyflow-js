/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * `@core` — variant-neutral shared source.
 *
 * This folder holds code that is shared, unchanged, by every Skyflow SDK
 * package (privacyDB today; flowDB later). It is compiled into each package's
 * bundle via the `@core` path alias (single source of truth in
 * `tsconfig.base.json`, mirrored to webpack `resolve.alias` and jest
 * `moduleNameMapper`). It is NOT a published package.
 *
 * Boundary rule: `core/` must never import from `src/` (or, later, from any
 * `packages/*`). Dependencies point downward only — packages depend on core,
 * never the reverse. Enforced by the ESLint `import/no-restricted-paths` zone.
 *
 * Entries are added to this barrel as code is moved in, task by task, during
 * the package-split migration (see docs/phase-1-execution-plan.md).
 */

// Task 1.1 — zero-import neutral leaves.
export { default as uuid } from './libs/uuid';
export { default as regExFromString } from './libs/regex';
export { default as deepClone } from './libs/deep-clone';
export { default as getCssClassesFromJss, generateCssWithoutClass } from './libs/jss-styles';
export { default as Bus } from './libs/bus';
export { default as isTokenValid } from './utils/jwt-utils';
export { default as EventEmitter } from './event-emitter';

// Task 1.2 — logging, error-codes, DOM/iframe & element constants.
export { default as logs } from './utils/logs';
export { default as SKYFLOW_ERROR_CODE } from './utils/constants';
export * from './constants';
export { default as properties } from './properties';
export { default as iframer } from './iframe-libs/iframer';
export {
  iframeDefaultAttributes, setAttributes, getIframeSrc, setStyles,
} from './iframe-libs/iframer';
export { getAccessToken, updateElementState } from './utils/bus-events';
