import { ELEMENT_EVENTS_TO_IFRAME } from '@core/constants';
import CoreComposableRevealElement from '@core/external/reveal/composable-reveal-element';
import { IRenderOptions, RenderFileResponse } from '../../utils/common';
import { IRevealElementInput } from './reveal-container';

// privacyDB composable reveal element: the shared @core base bound to privacyDB's
// reveal-input shape, plus the file-render request (flowDB has no renderFile).
class ComposableRevealElement extends CoreComposableRevealElement<IRevealElementInput> {
  // `options` are render-time behaviour flags (zip opt-in, layout, download policy,
  // ...). They travel with the request to the internal element, which validates
  // them and forwards them to the reveal iframe.
  renderFile(options?: IRenderOptions): Promise<RenderFileResponse> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-underscore-dangle
      this.eventEmitter?._emit?.(
        `${ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST}:${this.elementName}`,
        { options },
        (response) => {
          if (response?.errors) {
            reject(response);
          } else if (response?.error) {
            reject({ errors: response?.error });
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  // Downloads the file currently previewed in a rendered zip archive.
  downloadCurrentFile(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.eventEmitter?._emit?.(
      `${ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_DOWNLOAD_CURRENT_FILE}:${this.elementName}`,
      {},
    );
  }
}

export default ComposableRevealElement;
