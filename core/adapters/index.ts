/*
Copyright (c) 2022 Skyflow, Inc.
*/

// The variant seam (Phase 4, Task 4.5).
//
// The shared `@core` element/frame layer (lifted in Tasks 4.6/4.7) must not
// relative-import a package sibling. Instead each package supplies a
// `VariantAdapter` — a thin wrapper over its own `api-utils` + `utils/helpers`
// — and core code calls the adapter. This file defines the contract only; no
// files move here. Membership is driven by what the lifted files actually need
// from a package: telemetry identity and the composable reveal mappers, whose
// implementations genuinely differ (privacyDB `*Composable` vs flowDB
// `*ComposableFlowDB`). Collect mappers, the error factory, and additional
// type guards are intentionally omitted until a consumer needs them (the
// variant collect/error surface lives in Tier-D/Tier-E files that are not
// lifted in 4.6/4.7).

import {
  Context, IRevealRecordComposable, IRevealResponseType, LogLevel, MessageType,
} from '../types';

/** Telemetry identity for a package (privacyDB vs flowDB SDK name/version). */
export interface SdkDetails {
  name: string;
  version: string;
}

/**
 * Reveal request/response mappers a package supplies to the shared
 * element/frame layer. Names are variant-neutral; each package maps them to
 * its own `api-utils/reveal` implementation.
 */
export interface VariantRevealAdapter {
  fetchRecordsByTokenIdComposable(
    tokenIdRecords: IRevealRecordComposable[],
    client: any,
    authToken: string,
    options?: Record<string, any>,
  ): Promise<IRevealResponseType>;

  formatRecordsForClientComposable(response: any): Record<string, any>;

  /**
   * Construct this package's composable `RevealFrame`. Optional and registered
   * ONLY by the iframe entry (`src/index-internal.ts`), not by the base
   * `src/variant-adapter.ts`, so the DOM-heavy `reveal-frame` class stays out of
   * the main-thread (browser/node) bundles. The shared
   * `@core/internal/composable-frame-element-init` — which runs solely in the
   * iframe bundle where this is registered — invokes it via the adapter.
   */
  createRevealFrame?(
    record: any,
    context: Context,
    containerId: string,
    rootDiv?: HTMLDivElement,
  ): any;
}

/**
 * Collect-side normalization the shared `@core/external/collect/collect-element`
 * needs from a package. The two variants disagree on input key naming: flowDB
 * accepts the client-facing `skyflowId`/`tableName` and remaps them onto the
 * internal `skyflowID`/`table` the SET_VALUE handler consumes, and it carries the
 * skyflow id on an element as `skyflowId` (privacyDB uses `skyflowID`).
 */
export interface VariantCollectAdapter {
  /**
   * Normalize a `CollectElement.update()` options object in place to the internal
   * key names. privacyDB is a no-op; flowDB maps `skyflowId`->`skyflowID` and
   * `tableName`->`table`.
   */
  normalizeUpdateOptions(options: Record<string, any>): void;

  /**
   * The key carrying the skyflow id on a stored element options object, used by
   * container validation (privacyDB `skyflowID` vs flowDB `skyflowId`).
   */
  readonly skyflowIdKey: string;
}

/**
 * The contract the shared (`@core`) element/frame layer needs from a package.
 * Each package implements this once (see `src/variant-adapter.ts`) as a thin
 * wrapper over its existing `api-utils` + `utils/helpers`; core code calls the
 * adapter instead of relative-importing a variant sibling.
 */
export interface VariantAdapter {
  /** This package's SDK name/version. */
  readonly sdkDetails: SdkDetails;

  /** Build the telemetry meta object using this package's identity. */
  getMetaObject(metaData: any, navigator: any): Record<string, any>;

  /**
   * Emit a log line using this package's SDK-identity-aware `printLog`. Lives on
   * the adapter because `printLog` reads the package's SDK-language/version
   * label. Shared `@core` code only invokes this from main-thread (external)
   * paths where an adapter is registered — never inside the iframe bundle.
   */
  printLog(message: string, messageType: MessageType, logLevel: LogLevel): void;

  /** Composable reveal mappers from this package's `api-utils/reveal`. */
  reveal: VariantRevealAdapter;

  /** Collect-side key normalization for the shared collect element. */
  collect: VariantCollectAdapter;
}

// Registry — the single active adapter for the running bundle. Each package
// registers its own implementation once at startup (from `src/skyflow.ts`, and
// from `tests/jest.setup.js` for the test runtime); shared `@core` code reads it
// lazily via `getVariantAdapter()`. Reads only happen inside function bodies at
// runtime (never at module load), so a module that imports the getter but whose
// code never runs in a given bundle — e.g. the iframe bundle — never trips the
// guard.
let activeAdapter: VariantAdapter | undefined;

/** Register the package's `VariantAdapter`. Called once per bundle at startup. */
export function setVariantAdapter(adapter: VariantAdapter): void {
  activeAdapter = adapter;
}

/**
 * Return the registered `VariantAdapter`. Throws if none was registered — a
 * programming error (an entry point that failed to call `setVariantAdapter`).
 */
export function getVariantAdapter(): VariantAdapter {
  if (!activeAdapter) {
    throw new Error('Skyflow: VariantAdapter has not been registered.');
  }
  return activeAdapter;
}
