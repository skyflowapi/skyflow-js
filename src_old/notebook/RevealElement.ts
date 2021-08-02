import IFrame from "../elements/external/element/IFrame";
import deepClone from "../libs/deepClone";
import Bus from "../libs/Bus";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  FRAME_REVEAL,
} from "../elements/constants";

export default class RevealElement {
  #iframe: IFrame;
  #metadata;
  #options;
  #clientObject;
  #bus = new Bus();
  #state = {
    loading: false,
    error: <undefined | object>undefined,
    success: false,
  };
  #promise?: Promise<any>;
  #resolve?: Function;
  #reject?: Function;
  constructor(name: string, metadata, options: any = {}, clientObject) {
    name = `${FRAME_REVEAL}:${name}`
    this.#iframe = new IFrame(name, metadata);
    this.#metadata = metadata;
    this.#clientObject = clientObject;
    options = deepClone(options);
    options.name = name;
    this.#options = options;
  }

  mount = (domSelectorOrElement: Element | string) => {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
    const sub1 = (data, callback) => {
      if (data.name === this.#iframe.name) {
        this.#state.loading = true;
        callback({
          options: this.#options,
          clientObject: this.#clientObject,
          metadata: this.#metadata,
        });
        this.#bus.off(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub1);
      }
    };
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, sub1);

    const sub2 = (data: any) => {
      if (data.name === this.#iframe.name) {
        this.#state.loading = false;
        if (data.event === ELEMENT_EVENTS_TO_CLIENT.SUCCESS) {
          this.#state.success = true;
          this.#state.error = undefined;
          this.#resolve && this.#resolve({ ...this.getState() });
        } else {
          this.#state.success = false;
          this.#state.error = data.data;
          this.#reject && this.#reject({ ...this.getState() });
        }
        this.#bus.off(ELEMENT_EVENTS_TO_IFRAME.CLIENT_REQUEST, sub2);
      }
    };
    this.#bus.on(ELEMENT_EVENTS_TO_IFRAME.CLIENT_REQUEST, sub2);

    this.#iframe.mount(domSelectorOrElement);

    return this.getPromise();
  };

  unmount = () => {
    this.#iframe.unmount();
    this.#bus.teardown();
    this.#promise = undefined;
    this.#state = {
      ...this.#state,
      error: undefined,
      loading: false,
      success: false,
    };
  };

  getPromise = () => {
    return this.#promise;
  };

  getState = () => {
    return { ...this.#state };
  };
}
