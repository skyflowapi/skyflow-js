import EventEmitter from '../../../event-emitter';
import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import { ELEMENT_EVENTS_TO_CLIENT } from '../../constants';

class ComposableElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  constructor(name, eventEmitter) {
    this.#elementName = name;
    this.#eventEmitter = eventEmitter;
  }

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
}

export default ComposableElement;
