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
import { validateCollectElementInput } from '../../utils/validators';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import collectVariant from '../../collect-variant';

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
  protected buildCreateElementFields(input: CollectElementInput): Record<string, unknown> {
    return { table: input.tableName };
  }

  // flowDB forces tokens on and does not validate a client-supplied value.
  // Reuse the base validation for additionalFields/upsert, then force tokens on
  // in the emitted options (flowDB has no client-facing `tokens`).
  protected validateCollectOptions(options: ICollectOptions): ICollectOptions {
    const validated = super.validateCollectOptions(options);
    return { ...validated, tokens: true } as ICollectOptions;
  }

  // eslint-disable-next-line class-methods-use-this
  protected wrapCollectError(err: any): any {
    return err ? new SkyflowFlowDBError(err) : err;
  }
}
export default ComposableContainer;
