/*
Copyright (c) 2022 Skyflow, Inc.
*/
// flowDB composable reveal-internal element: the shared @core base bound to
// flowDB's token-only reveal-input shape. No renderFile — file-render is
// privacyDB-only (the base's registerRenderFileRequestListener hook stays empty).
import CoreComposableRevealInternalElement from '@core/external/reveal/composable-reveal-internal';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';

export interface RevealComposableGroup{
  record: IRevealElementInput
  options: IRevealElementOptions
}

export default class ComposableRevealInternalElement
  extends CoreComposableRevealInternalElement<IRevealElementInput> {}
