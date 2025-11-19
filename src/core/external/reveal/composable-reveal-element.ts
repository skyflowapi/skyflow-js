import EventEmitter from '../../../event-emitter';
import { ContainerType } from '../../../skyflow';
import { EventName, RenderFileResponse } from '../../../utils/common';
import { ELEMENT_EVENTS_TO_IFRAME, REVEAL_ELEMENT_OPTIONS_TYPES } from '../../constants';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';

class ComposableRevealElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType.COMPOSABLE;

  #isMounted: boolean = false;

  constructor(name: string, eventEmitter: EventEmitter, iframeName: string) {
    this.#elementName = name;
    this.#iframeName = iframeName;
    this.#eventEmitter = eventEmitter;
    this.#eventEmitter?.on?.(`${EventName.READY}:${this.#elementName}`, () => {
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
        `${ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST}:${this.#elementName}`,
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

  update = (options: IRevealElementInput | IRevealElementOptions) => {
    // eslint-disable-next-line no-underscore-dangle
    this.#eventEmitter?._emit?.(
      `${ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS}:${this.#elementName}`,
      {
        options: options as IRevealElementInput | IRevealElementOptions,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      },
    );
  };
}

export default ComposableRevealElement;
