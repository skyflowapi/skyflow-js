/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB reveal container: the shared @core RevealContainer base bound to
// flowDB's token-only types, plus the injected divergence — the RevealElement
// factory, the token-only reveal-record validator, reveal-options validation,
// and SkyflowFlowDBError error mapping. The flowDB reveal input/option TYPE
// definitions live in `../../utils/common`; they are re-exported here under
// the shared public names so the reveal element/composable files that import
// them from `./reveal-container` keep resolving.
import CoreRevealContainer from '@core/external/reveal/reveal-container';
import {
  ICoreMetadata, RevealContainerProps, Context,
} from '@core/types';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import type {
  IFlowDBRevealElementInput,
  IRevealElementOptions,
  IRevealOptions,
  TokenGroupRedaction,
} from '../../utils/common';
import { validateRevealElementRecords, validateRevealOptions } from '../../utils/validators';
import RevealElement from './reveal-element';

// The flowDB reveal input is the token-only shape; `IRevealElementInput` aliases
// it (no privacyDB skyflowID/table/column/file-render keys).
export type IRevealElementInput = IFlowDBRevealElementInput;
export type {
  IFlowDBRevealElementInput,
  IRevealElementOptions,
  IRevealOptions,
  TokenGroupRedaction,
};

class RevealContainer
  extends CoreRevealContainer<IRevealElementInput, IRevealOptions, RevealElement> {
  // eslint-disable-next-line class-methods-use-this
  protected createRevealElement(
    record: IRevealElementInput,
    options: IRevealElementOptions | undefined,
    metaData: ICoreMetadata,
    container: RevealContainerProps,
    elementId: string,
    context: Context,
  ): RevealElement {
    return new RevealElement(record, options, metaData, container, elementId, context);
  }

  // eslint-disable-next-line class-methods-use-this
  protected validateRecords(records: IRevealElementInput[]): void {
    validateRevealElementRecords(records);
  }

  // eslint-disable-next-line class-methods-use-this
  protected validateOptions(options?: IRevealOptions): void {
    validateRevealOptions(options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected wrapRevealError(err: any): any {
    return new SkyflowFlowDBError(err);
  }
}
export default RevealContainer;
