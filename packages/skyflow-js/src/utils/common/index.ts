/*
Copyright (c) 2025 Skyflow, Inc.
*/
// The variant-neutral types now live in `@core/types`; this module re-exports
// them so the many existing `../utils/common` importers keep working, and adds
// the privacyDB-specific `ICollectOptions` (its `upsert` uses the privacyDB
// `IUpsertOptions` from api-utils/collect — the flowDB shape differs, so this
// stays in the package, not in core).
import {
  ICollectOptionsBase, ICollectElementInputBase, ICollectElementOptionsBase,
  ICollectElementUpdateOptionsBase, IElementStateBase, IInsertRecordInput,
} from '@core/types';
import { ElementType } from '@core/constants';
import { IUpsertOptions } from '../../api-utils/collect';

export * from '@core/types';

// privacyDB collect options. Extends the @core marker and owns the full shape,
// including `tokens` (privacyDB honours it; flowDB has none).
export interface ICollectOptions extends ICollectOptionsBase {
  tokens?: boolean,
  additionalFields?: IInsertRecordInput,
  upsert?: Array<IUpsertOptions>,
}

// privacyDB collect element input: shared base + privacyDB identity keys
// (`table`/`skyflowID`). Shadows the identity-neutral @core `CollectElementInput`
// re-exported by `export * from '@core/types'` above (a local named export wins
// over a star re-export), so consumers see the privacyDB naming.
export interface CollectElementInput extends ICollectElementInputBase {
  type: ElementType,
  table?: string,
  skyflowID?: string,
}

// privacyDB collect-element update options: shared base + privacyDB identity keys.
// Binds `CollectElement`/`CollectContainer`'s `TUpdateOptions` so `element.update()`
// is typed to privacyDB naming (`table`/`skyflowID`). See Decision 2.1.
export interface CollectElementUpdateOptions extends ICollectElementUpdateOptionsBase {
  table?: string,
  skyflowID?: string,
}

// privacyDB collect element options: shared base + the privacyDB-only file options
// (flowDB has no file API). See Decision 2.3.
export interface CollectElementOptions extends ICollectElementOptionsBase {
  preserveFileName?: boolean,
  allowedFileType?: string[],
  blockEmptyFiles?: boolean,
  maxFileSize?: number,
  maxFileCount?: number,
}

// privacyDB element state: shared base + `value` including `Blob` (file elements).
// See Decision 2.5.
export interface ElementState extends IElementStateBase {
  value: string | Object | Blob | undefined,
}
