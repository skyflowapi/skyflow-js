import EventEmitter from '../../../event-emitter';
import { formatValidations } from '../../../libs/element-options';
import SkyflowError from '../../../libs/skyflow-error';
import { ContainerType } from '../../../skyflow';
import { EventName } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ElementType } from '../../constants';

class ComposableElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  type: string = ContainerType.COMPOSABLE;

  #isMounted = false;

  #isUpdateCalled = false;

  constructor(name, eventEmitter, iframeName) {
    this.#elementName = name;
    this.#iframeName = iframeName;
    this.#eventEmitter = eventEmitter;
    this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
      this.#isMounted = true;
    });
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

      if (data.elementType !== ElementType.CARD_NUMBER) delete data.selectedCardScheme;

      delete data.isComplete;
      delete data.name;
      handler(data);
    });
  }

  iframeName(): string {
    return this.#iframeName;
  }

  getID(): string {
    return this.#elementName;
  }

  update = (options) => {
    this.#isUpdateCalled = true;
    console.log("In element update: ", this.#isMounted);
    if (this.#isMounted) {
      options.validations = formatValidations(options.validations);
      // eslint-disable-next-line no-underscore-dangle
      
      this.#eventEmitter
        ._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: options,
        });
      this.#isUpdateCalled = false;
    } else if (this.#isUpdateCalled) {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        options.validations = formatValidations(options.validations);
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
