/*
Copyright (c) 2022 Skyflow, Inc.
*/

// The variant seam (Phase 4, Task 4.5).
//
// The shared `@core` element/frame layer (lifted in Tasks 4.6/4.7) must not
// relative-import a package sibling. Instead each package supplies a
// `VariantAdapter` — a thin wrapper over its own `core-utils` + `utils/helpers`
// — and core code calls the adapter. This file defines the contract only; no
// files move here. Membership is driven by what the lifted files actually need
// from a package: telemetry identity and the composable reveal mappers, whose
// implementations genuinely differ (privacyDB `*Composable` vs flowDB
// `*ComposableFlowDB`). Collect mappers, the error factory, and additional
// type guards are intentionally omitted until a consumer needs them (the
// variant collect/error surface lives in Tier-D/Tier-E files that are not
// lifted in 4.6/4.7).

import { IRevealRecordComposable, IRevealResponseType } from '../types';

/** Telemetry identity for a package (privacyDB vs flowDB SDK name/version). */
export interface SdkDetails {
  name: string;
  version: string;
}

/**
 * Reveal request/response mappers a package supplies to the shared
 * element/frame layer. Names are variant-neutral; each package maps them to
 * its own `core-utils/reveal` implementation.
 */
export interface VariantRevealAdapter {
  fetchRecordsByTokenIdComposable(
    tokenIdRecords: IRevealRecordComposable[],
    client: any,
    authToken: string,
    options?: Record<string, any>,
  ): Promise<IRevealResponseType>;

  formatRecordsForClientComposable(response: any): Record<string, any>;
}

/**
 * The contract the shared (`@core`) element/frame layer needs from a package.
 * Each package implements this once (see `src/variant-adapter.ts`) as a thin
 * wrapper over its existing `core-utils` + `utils/helpers`; core code calls the
 * adapter instead of relative-importing a variant sibling.
 */
export interface VariantAdapter {
  /** This package's SDK name/version. */
  readonly sdkDetails: SdkDetails;

  /** Build the telemetry meta object using this package's identity. */
  getMetaObject(metaData: any, navigator: any): Record<string, any>;

  /** Composable reveal mappers from this package's `core-utils/reveal`. */
  reveal: VariantRevealAdapter;
}
