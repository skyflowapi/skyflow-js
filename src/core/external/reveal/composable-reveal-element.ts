import EventEmitter from '../../../event-emitter';
import { ContainerType } from '../../../skyflow';
import {
  Context,
  EventName, MessageType, RenderFileResponse,
} from '../../../utils/common';
import { printLog } from '../../../utils/logs-helper';
import { ELEMENT_EVENTS_TO_IFRAME } from '../../constants';

class ComposableRevealElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType.COMPOSABLE;

  #isMounted: boolean = false;

  #context: Context;

  constructor(name, eventEmitter, iframeName, context: Context) {
    this.#elementName = name ?? '';
    this.#iframeName = iframeName ?? '';
    this.#eventEmitter = eventEmitter;
    this.#context = context;

    this.#setupEventListeners();
  }

  #setupEventListeners(): void {
    try {
      this.#eventEmitter?.on?.(
        `${EventName?.READY}:${this.#elementName}`,
        () => {
          this.#isMounted = true;
        },
      );
    } catch (error) {
      printLog(
        'Failed to setup event listeners',
        MessageType?.LOG ?? 'LOG',
        this.#context?.logLevel,
      );
    }
  }

  iframeName(): string {
    return this.#iframeName ?? '';
  }

  getID(): string {
    return this.#elementName ?? '';
  }

  renderFile(): Promise<RenderFileResponse> {
    return new Promise((resolve, reject) => {
      try {
        const eventName = `${ELEMENT_EVENTS_TO_IFRAME?.RENDER_FILE_REQUEST ?? ''}:${this.#elementName}`;

        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter?._emit?.(
          eventName,
          {},
          (response: RenderFileResponse) => {
            if (response?.errors) {
              reject(response);
            } else {
              resolve(response);
            }
          },
        );
      } catch (error: any) {
        reject(error);
      }
    });
  }

  isMounted(): boolean {
    return this.#isMounted;
  }
}

export default ComposableRevealElement;
