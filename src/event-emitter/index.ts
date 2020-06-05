class EventEmitter {
  _events: Record<string, { priority: boolean; callback: Function }[]>;

  constructor() {
    this._events = {};
  }

  on(event: string, callback: Function, priority: boolean = false): void {
    if (this._events[event]) {
      this._events[event].push({ priority, callback });
    } else {
      this._events[event] = [{ priority, callback }];
    }
  }

  off(event: string, callback: Function): void {
    const eventCallbacks = this._events[event];

    if (!eventCallbacks) {
      return;
    }

    const indexOfCallback = eventCallbacks.findIndex(
      (event) => event.callback === callback
    );

    eventCallbacks.splice(indexOfCallback, 1);
  }

  _emit(event: string, ...args): void {
    const eventCallbacks = this._events[event];

    if (!eventCallbacks) {
      return;
    }

    eventCallbacks.forEach(function (event) {
      event.callback(...args);
    });
  }

  hasListener(event: string): boolean {
    const eventCallbacks = this._events[event];

    if (!eventCallbacks) {
      return false;
    }

    return eventCallbacks.length > 0;
  }

  resetEvents() {
    const _newEvents: any = {};
    for (const eventName in this._events) {
      const events = this._events[eventName];
      if (events && events.length > 0) {
        const newEvents: any[] = [];
        events.forEach((event) => {
          if (event.priority) newEvents.push(event);
        });
        _newEvents[eventName] = newEvents;
      }
    }

    this._events = _newEvents;
  }

  static createChild(ChildObject): void {
    ChildObject.prototype = Object.create(EventEmitter.prototype, {
      constructor: ChildObject,
    });
  }
}

export default EventEmitter;
