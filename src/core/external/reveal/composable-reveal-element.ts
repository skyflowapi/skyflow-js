import EventEmitter from '../../../event-emitter';
import { ContainerType } from '../../../skyflow';
import { EventName, RenderFileResponse } from '../../../utils/common';
import { ELEMENT_EVENTS_TO_IFRAME } from '../../constants';

class ComposableRevealElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType?.COMPOSABLE ?? 'COMPOSABLE';

  #isMounted: boolean = false;

  constructor(name, eventEmitter, iframeName) {
    this.#elementName = name ?? '';
    this.#iframeName = iframeName ?? '';
    this.#eventEmitter = eventEmitter;
    this.#eventEmitter?.on?.(`${EventName?.READY ?? 'READY'}:${this.#elementName}`, () => {
      this.#isMounted = true;
    });
  }

  iframeName(): string {
    return this.#iframeName ?? '';
  }

  getID(): string {
    return this.#elementName ?? '';
  }

  renderFile(): Promise<RenderFileResponse> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter?._emit?.(
        `${ELEMENT_EVENTS_TO_IFRAME?.RENDER_FILE_REQUEST ?? ''}:${this.#elementName}`,
        {},
        (response: RenderFileResponse) => {
          if (response?.errors) {
            reject(response);
          } else {
            resolve(response);
          }
        },
      );
    });
  }
}

export default ComposableRevealElement;
