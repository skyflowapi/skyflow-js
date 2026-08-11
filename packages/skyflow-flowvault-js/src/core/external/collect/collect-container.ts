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
import {
  formatValidations, formatOptions,
} from '@core/libs/element-options';
import CollectElement from '@core/external/collect/collect-element';
import { CollectElementOptions } from '@core/types';
import CoreCollectContainer, { ElementGroup } from '@core/external/collect/collect-container';
import { validateCollectElementInput } from '../../../utils/validators';
import { CollectElementInput, ICollectOptions } from '../../../utils/common';
import { CollectResponse } from '../../internal/internal-types';
import SkyflowFlowDBError from '../../../libs/skyflow-flowdb-error';

export type {
  ICollectElement, ElementGroupItem, ElementGroup,
} from '@core/external/collect/collect-container';

class CollectContainer extends CoreCollectContainer<ICollectOptions, CollectResponse> {
  create = (input: CollectElementInput, options: CollectElementOptions = {
    required: false,
  }): CollectElement => {
    validateCollectElementInput(input, this.context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.context.logLevel);

    const elementGroup: ElementGroup = {
      rows: [{
        elements: [{
          elementType: input.type,
          name: input.column,
          accept: options.allowedFileType,
          ...input,
          // Map the client-facing `tableName` key onto the internal `table` name
          // that the rest of the collect pipeline consumes.
          table: input.tableName,
          ...formattedOptions,
          validations,
        }],
      }],
    };

    return this.createMultipleElement(elementGroup, true);
  };

  // flowDB forces tokens on and does not validate a client-supplied value.
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected validateTokens(options: ICollectOptions): void {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected resolveTokens(options: ICollectOptions): boolean {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  protected wrapCollectError(err: any): any {
    return err ? new SkyflowFlowDBError(err) : err;
  }
}
export default CollectContainer;
