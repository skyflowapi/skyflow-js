/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB composable collect container: the shared @core CoreComposableCollectContainer
// (controller-frame bootstrap, mount/grid layout, createMultipleElement, collect(),
// on(), the bus COMPOSABLE_CONTAINER handshake and updateListeners) bound to
// flowDB's collect response type, plus the injected divergence — create() (remaps
// the client-facing tableName→table and uses flowDB's collect-input validator),
// token handling (flowDB forces tokens on and does not validate) and
// SkyflowFlowDBError error mapping. flowDB has no file upload, so there is no
// uploadFiles and the base's empty registerElementListeners default is inherited.
import CoreComposableCollectContainer from '@core/external/collect/composable-collect-container';
import { VariantCollectAdapter } from '@core/types';
import { CollectElementInput, CollectElementOptions, ICollectOptions } from '../../utils/common';
import { CollectResponse } from '../../internal/internal-types';
import {
  validateCollectElementInput,
  validateFlowDBAdditionalFieldsInCollect,
  validateFlowDBUpsertOptions,
} from '../../utils/validators';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import collectVariant from './collect-variant';

class ComposableContainer extends CoreComposableCollectContainer<
ICollectOptions, CollectResponse, CollectElementInput, CollectElementOptions
> {
  // flowDB collect key strategy (`skyflowId`/`tableName`); injected into each element.
  protected collectVariant: VariantCollectAdapter = collectVariant;

  protected validateCreateInput(input: CollectElementInput): void {
    validateCollectElementInput(input, this.context.logLevel);
  }

  // Map the client-facing `tableName` key onto the internal `table` name that the
  // rest of the collect pipeline consumes.
  // eslint-disable-next-line class-methods-use-this
  protected buildCreateElementFields(
    input: CollectElementInput,
    options: CollectElementOptions,
  ): Record<string, unknown> {
    return { table: input.tableName, ...options };
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
export default ComposableContainer;
