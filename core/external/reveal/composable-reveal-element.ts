/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Shared composable reveal-element base. Holds the mount-tracking + update
// plumbing common to both SDKs. Generic over the reveal-input shape (`TInput`)
// because that shape genuinely diverges (privacyDB: skyflowID/table/column/…;
// flowDB: token-only), so each package binds the generic in a thin subclass.
// privacyDB additionally adds `renderFile`; flowDB adds nothing.
import EventEmitter from '@core/event-emitter';
import { ELEMENT_EVENTS_TO_IFRAME, REVEAL_ELEMENT_OPTIONS_TYPES } from '@core/constants';
import { ContainerType, EventName, IRevealElementOptions } from '@core/types';

class ComposableRevealElement<TInput = IRevealElementOptions> {
  protected elementName: string;

  protected eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType.COMPOSABLE;

  #isMounted: boolean = false;

  constructor(name: string, eventEmitter: EventEmitter, iframeName: string) {
    this.elementName = name;
    this.#iframeName = iframeName;
    this.eventEmitter = eventEmitter;
    this.eventEmitter?.on?.(`${EventName.READY}:${this.elementName}`, () => {
      this.#isMounted = true;
    });
  }

  iframeName(): string {
    return this.#iframeName ?? '';
  }

  getID(): string {
    return this.elementName ?? '';
  }

  update = (options: TInput | IRevealElementOptions) => {
    // eslint-disable-next-line no-underscore-dangle
    this.eventEmitter?._emit?.(
      `${ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS}:${this.elementName}`,
      {
        options: options as TInput | IRevealElementOptions,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      },
    );
  };
}

export default ComposableRevealElement;
