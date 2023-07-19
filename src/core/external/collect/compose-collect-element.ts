/**
 * @module ComposeCollectElement
 */
import EventEmitter from '../../../event-emitter';
import SkyflowError from '../../../libs/skyflow-error';
import { ContainerType } from '../../../skyflow';
import { EventName } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME } from '../../constants';

/**
  * The create method returns an instance of Skyflow Composable Elements.
  * @class ComposableElement
  */
class ComposableElement {
  #elementName: string;

  #eventEmitter: EventEmitter;
  /** Type of the container */
  type: string = ContainerType.COMPOSABLE;

  #isMounted = false;

  #isUpdateCalled = false;

  /** @internal */
  constructor(name, eventEmitter) {
    this.#elementName = name;
    this.#eventEmitter = eventEmitter;
    this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
      this.#isMounted = true;
    });
  }

  /**
  * Helps to communicate with Skyflow elements/iframes by listening to an event.
  * @param eventName Name of the event.
  * @param handler You provide a callback function that gets called when the event is fired with the state.
  */
  on(eventName: string, handler: any) {
    if (!Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (!handler) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (typeof handler !== 'function') {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }

    this.#eventEmitter.on(`${eventName}:${this.#elementName}`, (data) => {
      if (data.value === undefined) {
        data.value = '';
      }
      delete data.isComplete;
      delete data.name;
      handler(data);
    });
  }

  /**
  * Updates the configuration of elements inside the composable container.
  * @param options Takes an object for the insertion. 
  */
  update = (options) => {
    this.#isUpdateCalled = true;
    if (this.#isMounted) {
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter
        ._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: options,
        }); 
      this.#isUpdateCalled = false;
    } else if (this.#isUpdateCalled) {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter
          ._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
            elementName: this.#elementName,
            elementOptions: options,
          });
        this.#isMounted = true;
        this.#isUpdateCalled = false;
      });
    }
  };
}

export default ComposableElement;
