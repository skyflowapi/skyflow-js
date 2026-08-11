import { ELEMENT_EVENTS_TO_IFRAME } from '@core/constants';
import CoreComposableRevealElement from '@core/external/reveal/composable-reveal-element';
import { RenderFileResponse } from '../../utils/common';
import { IRevealElementInput } from './reveal-container';

// privacyDB composable reveal element: the shared @core base bound to privacyDB's
// reveal-input shape, plus the file-render request (flowDB has no renderFile).
class ComposableRevealElement extends CoreComposableRevealElement<IRevealElementInput> {
  renderFile(): Promise<RenderFileResponse> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-underscore-dangle
      this.eventEmitter?._emit?.(
        `${ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST}:${this.elementName}`,
        {},
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
}

export default ComposableRevealElement;
