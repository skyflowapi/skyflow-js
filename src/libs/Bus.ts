// todo: implement bus to save event id/functions and on kill remove those events(turn off)

import bus from "framebus";
import {
  FramebusOnHandler,
  FramebusReplyHandler,
} from "framebus/dist/lib/types";

class Bus {
  _listeners: any[];
  _isDestroyed: boolean;
  constructor() {
    this._listeners = [];
    this._isDestroyed = false;
  }

  on(eventName: string, callback: FramebusOnHandler) {
    bus.on(eventName, callback);

    this._listeners.push({
      eventName,
      callback,
    });
  }

  off(eventName: string, callback: FramebusOnHandler) {
    bus.off(eventName, callback);

    const indexOfListener = this._listeners.findIndex(
      (obj) => obj.eventName === eventName && callback === callback
    );

    indexOfListener !== -1 && this._listeners.splice(indexOfListener, 1);
  }

  emit(
    eventName: string,
    data: Record<string, unknown> | undefined,
    callback: FramebusReplyHandler | undefined = undefined
  ) {
    bus.emit(eventName, data, callback);
  }

  hasListener(eventName: string): boolean {
    const indexOfListener = this._listeners.findIndex(
      (obj) => obj.eventName === eventName
    );

    return indexOfListener !== -1;
  }

  teardown() {
    this._listeners.forEach((listener) => {
      bus.off(listener.eventName, listener.handler);
    });

    this._listeners = [];
  }
}

export default Bus;
