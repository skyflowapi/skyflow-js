/*
Copyright (c) 2025 Skyflow, Inc.
*/
import EventEmitter from '../../../event-emitter';
import SkyflowError from '../../../libs/skyflow-error';
import { ContainerType } from '../../../skyflow';
import { EventName, RenderFileResponse } from '../../../utils/common';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_ELEMENT_OPTIONS_TYPES,
} from '../../constants';

class RevealComposableElement {
  #elementName: string;

  #eventEmitter: EventEmitter;

  #iframeName: string;

  #isMounted = false;

  #isUpdateCalled = false;

  #recordData: any = {};

  type: string = ContainerType.REVEAL;

  constructor(name: string, eventEmitter: EventEmitter, iframeName: string) {
    this.#elementName = name;
    this.#iframeName = iframeName;
    this.#eventEmitter = eventEmitter;

    this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
      this.#isMounted = true;
    });
  }

  iframeName(): string {
    return this.#iframeName;
  }

  getID(): string {
    return this.#elementName;
  }

  getRecordData() {
    return this.#recordData;
  }

  update(options: any) {
    this.#isUpdateCalled = true;
    this.#recordData = {
      ...this.#recordData,
      ...options,
    };

    if (this.#isMounted) {
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
        elementName: this.#elementName,
        elementOptions: options,
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      });
      this.#isUpdateCalled = false;
    } else if (this.#isUpdateCalled) {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: options,
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
        });
        this.#isMounted = true;
        this.#isUpdateCalled = false;
      });
    }
  }

  setAltText(altText: string) {
    if (this.#isMounted) {
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
        elementName: this.#elementName,
        elementOptions: { altText },
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      });
    } else {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: { altText },
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
        });
      });
    }
  }

  clearAltText() {
    if (this.#isMounted) {
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
        elementName: this.#elementName,
        elementOptions: { altText: null },
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      });
    } else {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: { altText: null },
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
        });
      });
    }
  }

  setToken(token: string) {
    this.#recordData = {
      ...this.#recordData,
      token,
    };

    if (this.#isMounted) {
      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
        elementName: this.#elementName,
        elementOptions: { token },
        updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
      });
    } else {
      this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
        // eslint-disable-next-line no-underscore-dangle
        this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
          elementName: this.#elementName,
          elementOptions: { token },
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN,
        });
      });
    }
  }

  renderFile(): Promise<RenderFileResponse> {
    return new Promise((resolve, reject) => {
      if (!this.#isMounted) {
        reject(new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true));
        return;
      }

      // eslint-disable-next-line no-underscore-dangle
      this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST, {
        elementName: this.#elementName,
        recordData: this.#recordData,
      });

      // this.#eventEmitter
      //   .on(`${ELEMENT_EVENTS_TO_CLIENT.RENDER_FILE_RESPONSE}:${this.#elementName}`,
      //     (response) => {
      //       if (response.error) {
      //         reject(response.error);
      //       } else {
      //         resolve(response);
      //       }
      //     });
    });
  }

  // setError(clientErrorText: string) {
  //   if (this.#isMounted) {
  //     this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
  //       elementName: this.#elementName,
  //       clientErrorText,
  //       isTriggerError: true,
  //     });

  //     // this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
  //     //   elementName: this.#elementName,
  //     //   clientErrorText,
  //     //   elementOptions: { clientErrorText },
  //     //   updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
  //     //   isTriggerError: true,
  //     // });
  //   } else {
  //     this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
  //       // eslint-disable-next-line no-underscore-dangle
  //       this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
  //         elementName: this.#elementName,
  //         elementOptions: { clientErrorText },
  //         updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ERROR,
  //         isTriggerError: true,
  //       });
  //     });
  //   }
  // }

  // resetError() {
  //   if (this.#isMounted) {
  //     this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
  //       elementName: this.#elementName,
  //       elementOptions: {},
  //       updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ERROR,
  //       isTriggerError: false,
  //     });

  //     this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
  //       elementName: this.#elementName,
  //       updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ERROR,
  //       isTriggerError: false,
  //     });
  //   } else {
  //     this.#eventEmitter.on(`${EventName.READY}:${this.#elementName}`, () => {
  //       this.#eventEmitter._emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, {
  //         elementName: this.#elementName,
  //         elementOptions: {},
  //         updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ERROR,
  //         isTriggerError: false,
  //       });
  //     });
  //   }
  // }
}

export default RevealComposableElement;
