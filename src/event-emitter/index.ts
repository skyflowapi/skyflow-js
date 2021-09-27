class EventEmitter {
  events: Record<string, { priority: boolean; callback: Function }[]>;

  constructor() {
    this.events = {};
  }

  on(event: string, callback: Function, priority: boolean = false): void {
    if (this.events[event]) {
      this.events[event].push({ priority, callback });
    } else {
      this.events[event] = [{ priority, callback }];
    }
  }

  off(event: string, callback: Function): void {
    const eventCallbacks = this.events[event];

    if (!eventCallbacks) {
      return;
    }

    const indexOfCallback = eventCallbacks.findIndex(
      (iEvent) => iEvent.callback === callback,
    );

    eventCallbacks.splice(indexOfCallback, 1);
  }

  // eslint-disable-next-line no-underscore-dangle
  _emit(event: string, ...args): void {
    const eventCallbacks = this.events[event];

    if (!eventCallbacks) {
      return;
    }

    eventCallbacks.forEach((iEvent) => {
      iEvent.callback(...args);
    });
  }

  hasListener(event: string): boolean {
    const eventCallbacks = this.events[event];

    if (!eventCallbacks) {
      return false;
    }

    return eventCallbacks.length > 0;
  }

  resetEvents() {
    const tempEvents: any = {};
    Object.keys(this.events).forEach((eventName) => {
      const events = this.events[eventName];
      if (events && events.length > 0) {
        const newEvents: any[] = [];
        events.forEach((event) => {
          if (event.priority) newEvents.push(event);
        });
        tempEvents[eventName] = newEvents;
      }
    });

    this.events = tempEvents;
  }

  static createChild(ChildObject): void {
    ChildObject.prototype = Object.create(EventEmitter.prototype, {
      constructor: ChildObject,
    });
  }
}

export default EventEmitter;
