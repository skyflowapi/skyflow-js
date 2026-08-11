/*
Copyright (c) 2025 Skyflow, Inc.
*/
// The variant-neutral types now live in `@core/types`; this module re-exports
// them so the many existing `../utils/common` importers keep working, and adds
// the privacyDB-specific `ICollectOptions` (its `upsert` uses the privacyDB
// `IUpsertOptions` from api-utils/collect — the flowDB shape differs, so this
// stays in the package, not in core).
import { IInsertRecordInput } from '@core/types';
import { IUpsertOptions } from '../../api-utils/collect';

export * from '@core/types';

export interface ICollectOptions {
  tokens?: boolean,
  additionalFields?: IInsertRecordInput,
  upsert?: Array<IUpsertOptions>,
}
