import CoreComposableRevealElement from '@core/external/reveal/composable-reveal-element';
import { IRevealElementInput } from './reveal-container';

// flowDB composable reveal element: the shared @core base bound to flowDB's
// token-only reveal-input shape. No renderFile — file-render is privacyDB-only.
export default class ComposableRevealElement
  extends CoreComposableRevealElement<IRevealElementInput> {}
