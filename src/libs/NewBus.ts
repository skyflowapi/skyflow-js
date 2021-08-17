// todo: implement bus to save event id/functions and on kill remove those events(turn off)

import bus from "framebus";
import {
  FramebusOnHandler,
  FramebusReplyHandler,
} from "framebus/dist/lib/types";
class NewBus {
  _isDestroyed: boolean;
  static unlistenedEmitters: any[] = [];
  constructor() {
    this._isDestroyed = false;
  }

  on(eventName: string, callback: FramebusOnHandler) {
    console.log(NewBus.unlistenedEmitters);
    console.log("In New Bus Listener", eventName);
    if (this.hasUnListener(eventName)) {
      this.emit(eventName, {});
      NewBus.unlistenedEmitters = NewBus.unlistenedEmitters.filter(
        (obj) => obj.eventName !== eventName
      );
    }
    bus.on(eventName, callback);
  }

  off(eventName: string, callback: FramebusOnHandler) {
    bus.off(eventName, callback);
  }

  emit(
    eventName: string,
    data: Record<string, unknown> | undefined,
    callback: FramebusReplyHandler | undefined = undefined
  ) {
    console.log("IN New Bus Emmiter", eventName);
    if (this.hasUnListener(eventName)) bus.emit(eventName, data, callback);
    else
      NewBus.unlistenedEmitters.push({
        eventName,
        callback,
      });
  }

  hasUnListener(eventName: string): boolean {
    const indexOfListener = NewBus.unlistenedEmitters.findIndex(
      (obj) => obj.eventName === eventName
    );

    return indexOfListener !== -1;
  }
  teardown() {}
}

export default NewBus;
