import bus from 'framebus';
import {
  FramebusOnHandler,
  FramebusReplyHandler,
} from 'framebus/dist/lib/types';

interface EventListener {
  eventName: string;
  callback: FramebusOnHandler | ((event: MessageEvent) => void);
  isShadow: boolean;
  resolveCallback?: Function;
  rejectCallback?: Function;
}

class EventWrapper {
  private listeners: EventListener[];

  private isDestroyed: boolean;

  private isShadowMode: boolean;

  constructor(isShadowMode: boolean = false) {
    this.listeners = [];
    this.isDestroyed = false;
    this.isShadowMode = isShadowMode;
  }

  on(
    eventName: string,
    callback: FramebusOnHandler,
    isShadowMode: boolean,
    skyflowFrameName,
    messageHandler: (event: MessageEvent) => void,
  ) {
    this.isShadowMode = isShadowMode;
    if (this.isShadowMode) {
      skyflowFrameName.addEventListener('message', messageHandler);
    } else {
      bus.on(eventName, callback);
    }
  }

  off(eventName: string, callback: FramebusOnHandler, isShadowMode: boolean): void {
    this.isShadowMode = isShadowMode;
    const listenerIndex = this.listeners.findIndex(
      (listener) => listener.eventName === eventName,
    );

    if (listenerIndex !== -1) {
      const listener = this.listeners[listenerIndex];
      if (listener.isShadow) {
        window.removeEventListener('message', listener.callback as (event: MessageEvent) => void);
      } else {
        bus.off(eventName, callback);
      }
      this.listeners.splice(listenerIndex, 1);
    }
  }

  emit(
    eventName: string,
    data,
    callback?: FramebusReplyHandler,
    isShadowMode?: boolean,
    skyflowFrameName?: string,
  ) {
    this.isShadowMode = isShadowMode || false;
    if (this.isShadowMode) {
      if (skyflowFrameName !== '') {
        const skyflowFrame = document.querySelector(`iframe[id*="${skyflowFrameName}"]`) as HTMLIFrameElement;
        if (skyflowFrame && skyflowFrame.contentWindow) {
          skyflowFrame.contentWindow.postMessage({
            type: eventName,
            data,
          }, '*');
        }
      }
    }
  }
}

export default EventWrapper;
