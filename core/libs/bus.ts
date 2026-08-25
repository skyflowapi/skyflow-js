/*
Copyright (c) 2022 Skyflow, Inc.
*/
// todo: implement bus to save event id/functions and on kill remove those events(turn off)

import bus from 'framebus';
import {
  FramebusOnHandler,
  FramebusReplyHandler,
} from 'framebus/dist/lib/types';

class Bus {
  listeners: any[];

  isDestroyed: boolean;

  constructor() {
    this.listeners = [];
    this.isDestroyed = false;
  }

  on(eventName: string, callback: FramebusOnHandler) {
    bus.on(eventName, callback);

    this.listeners.push({
      eventName,
      callback,
    });
  }

  off(eventName: string, callback: FramebusOnHandler) {
    bus.off(eventName, callback);

    const indexOfListener = this.listeners.findIndex(
      (obj) => obj.eventName === eventName,
    );

    if (indexOfListener !== -1) {
      this.listeners.splice(indexOfListener, 1);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  emit(
    eventName: string,
    data: Record<string, unknown> | undefined,
    callback: FramebusReplyHandler | undefined = undefined,
  ) {
    bus.emit(eventName, data, callback);
  }

  hasListener(eventName: string): boolean {
    const indexOfListener = this.listeners.findIndex(
      (obj) => obj.eventName === eventName,
    );

    return indexOfListener !== -1;
  }

  teardown() {
    this.listeners.forEach((listener) => {
      bus.off(listener.eventName, listener.handler);
    });

    this.listeners = [];
  }
}

export default Bus;
