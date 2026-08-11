/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB reveal container: the shared @core RevealContainer base bound to
// privacyDB's types, plus the injected divergence — the RevealElement factory
// and the reveal-record validator. privacyDB has no reveal options and maps
// errors through as-is, so validateOptions/wrapRevealError use the base defaults.
// The reveal input/option TYPE definitions live here (imported as
// './reveal-container' by the reveal element/composable files).
import CoreRevealContainer from '@core/external/reveal/reveal-container';
import {
  IRevealElementOptions, RedactionType, ICoreMetadata, RevealContainerProps, Context,
} from '@core/types';
import { validateRevealElementRecords } from '../../utils/validators';
import RevealElement from './reveal-element';

export interface IRevealElementInput {
  token?: string;
  skyflowID?: string;
  table?: string;
  column?: string;
  redaction?: RedactionType;
  inputStyles?: object;
  label?: string;
  labelStyles?: object;
  altText?: string;
  errorTextStyles?: object;
}

// Relocated to @core/types; re-exported here under the same public name.
export { IRevealElementOptions };

class RevealContainer extends CoreRevealContainer<IRevealElementInput, void, RevealElement> {
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
}
export default RevealContainer;
