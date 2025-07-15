import EventEmitter from '../../../event-emitter';
import { ContainerType } from '../../../skyflow';
import { EventName } from '../../../utils/common';

class ComposableRevealElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType.COMPOSABLE;

  #isMounted = false;

  #isUpdateCalled = false;

  constructor(name, eventEmitter, iframeName) {
    this.#elementName = name;
    this.#iframeName = iframeName;
    this.#eventEmitter = eventEmitter;

    this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
      this.#isMounted = true;
    });
  }

  iframeName(): string {
    return this.#iframeName;
  }

  getID(): string {
    return this.#elementName;
  }
}

export default ComposableRevealElement;
