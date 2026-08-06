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

export {};
