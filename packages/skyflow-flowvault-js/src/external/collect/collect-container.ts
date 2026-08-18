/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB collect container: the shared @core CollectContainer base bound to
// flowDB's collect option/response types, plus the injected divergence —
// create() (remaps the client-facing tableName→table and uses flowDB's
// collect-input validator), token handling (flowDB forces tokens on and does
// not validate) and SkyflowFlowDBError error mapping. flowDB has no file upload,
// so there is no uploadFiles. The element interfaces are re-exported from @core
// under the same public names (imported as './collect-container').
import CoreCollectContainer, {
  ICollectElementBase,
} from '@core/external/collect/collect-container';
import { VariantCollectAdapter } from '@core/types';
import {
  validateCollectElementInput,
  validateFlowDBAdditionalFieldsInCollect,
  validateFlowDBUpsertOptions,
} from '../../utils/validators';
import {
  CollectElementInput, CollectElementOptions, CollectElementUpdateOptions, ICollectOptions,
} from '../../utils/common';
import { CollectResponse } from '../../internal/internal-types';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import collectVariant from './collect-variant';

export type {
  ElementGroupItem, ElementGroup,
} from '@core/external/collect/collect-container';

// flowDB collect-element descriptor: shared base + flowDB `tableName` key. See 2.4.
export interface ICollectElement extends ICollectElementBase {
  tableName?: string;
}

class CollectContainer extends CoreCollectContainer<
ICollectOptions, CollectResponse, CollectElementUpdateOptions,
CollectElementInput, CollectElementOptions
> {
  // flowDB collect key strategy (client-facing `skyflowId`/`tableName`); single
  // source is this package's VariantAdapter, injected into each element.
  protected collectVariant: VariantCollectAdapter = collectVariant;

  protected validateCreateInput(input: CollectElementInput): void {
    validateCollectElementInput(input, this.context.logLevel);
  }

  // Map the client-facing `tableName` key onto the internal `table` name that the
  // rest of the collect pipeline consumes.
  // eslint-disable-next-line class-methods-use-this
  protected buildCreateElementFields(input: CollectElementInput): Record<string, unknown> {
    return { table: input.tableName };
  }

  // flowDB validates additionalFields/upsert against the flowDB key shapes
  // (tableName/uniqueColumns/data), then forces tokens on (flowDB has no
  // client-facing `tokens`). It does NOT delegate to the @core base validator,
  // whose upsert/additionalFields checks are privacyDB-shaped (table/column/fields).
  // eslint-disable-next-line class-methods-use-this
  protected validateCollectOptions(options: ICollectOptions): ICollectOptions {
    if (options?.additionalFields) {
      validateFlowDBAdditionalFieldsInCollect(options.additionalFields);
    }
    if (options?.upsert) {
      validateFlowDBUpsertOptions(options.upsert);
    }
    return { ...options, tokens: true } as ICollectOptions;
  }

  // eslint-disable-next-line class-methods-use-this
  protected wrapCollectError(err: any): any {
    return err ? new SkyflowFlowDBError(err) : err;
  }
}
export default CollectContainer;
