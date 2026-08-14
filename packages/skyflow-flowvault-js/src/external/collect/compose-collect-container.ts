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
import uuid from '@core/libs/uuid';
import { FRAME_ELEMENT } from '@core/constants';
import { formatValidations, formatOptions } from '@core/libs/element-options';
import CoreComposableCollectContainer from '@core/external/collect/composable-collect-container';
import { VariantCollectAdapter } from '@core/types';
import { CollectElementInput, CollectElementOptions, ICollectOptions } from '../../utils/common';
import { CollectResponse } from '../../internal/internal-types';
import { validateCollectElementInput } from '../../utils/validators';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import collectVariant from '../../collect-variant';
import ComposableElement from './compose-collect-element';

class ComposableContainer extends CoreComposableCollectContainer<ICollectOptions, CollectResponse> {
  // flowDB collect key strategy (`skyflowId`/`tableName`); injected into each element.
  protected collectVariant: VariantCollectAdapter = collectVariant;

  create = (input: CollectElementInput, options: CollectElementOptions = {
    required: false,
  }): ComposableElement => {
    validateCollectElementInput(input, this.context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.context.logLevel);

    const elementName = `${FRAME_ELEMENT}:${input.type}:${btoa(uuid())}`;

    this.elementsList.push({
      elementType: input.type,
      name: input.column,
      ...input,
      // Map the client-facing `tableName` key onto the internal `table` name
      // that the rest of the collect pipeline consumes.
      table: input.tableName,
      ...formattedOptions,
      validations,
      elementName,
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.tempElements)}:${this.containerId}:${this.context.logLevel}:${btoa(this.clientDomain)}`;
    this.iframeID = controllerIframeName;
    return new ComposableElement(
      elementName, this.eventEmitter, controllerIframeName,
      { ...this.metaData, type: input.type },
    );
  };

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
