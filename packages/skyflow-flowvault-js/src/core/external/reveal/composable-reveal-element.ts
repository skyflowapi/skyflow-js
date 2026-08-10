import EventEmitter from '@core/event-emitter';
import { ELEMENT_EVENTS_TO_IFRAME, REVEAL_ELEMENT_OPTIONS_TYPES } from '@core/constants';
import { ContainerType } from '../../../skyflow';
import { EventName } from '../../../utils/common';
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
