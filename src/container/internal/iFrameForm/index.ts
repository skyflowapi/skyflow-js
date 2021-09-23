/* eslint-disable no-underscore-dangle */
import bus from 'framebus';
import Client from '../../../client';
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  COLLECT_FRAME_CONTROLLER,
  ElementType,
} from '../../constants';
import EventEmitter from '../../../event-emitter';
import regExFromString from '../../../libs/regex';
import {
  validateCreditCardNumber,
  validateExpiryDate,
} from '../../../utils/validators';
import {
  constructElementsInsertReq,
  constructInsertRecordResponse,
} from '../../../core/collect';
import { getAccessToken } from '../../../utils/busEvents';

const set = require('set-value');

export class IFrameFormElement extends EventEmitter {
  // All external Events and state events will be handled here
  state = {
    value: <undefined | string>undefined,
    isFocused: false,
    isValid: false,
    isEmpty: true,
    isComplete: false,
    name: '',
  };

  readonly fieldType: string;

  private sensitive: boolean;

  tableName: string;

  fieldName: string;

  iFrameName: string;

  metaData;

  private regex?: RegExp;

  replacePattern?: [RegExp, string];

  mask?: any;

  constructor(name: string, metaData) {
    super();
    const frameValues = name.split(':');
    const fieldType = frameValues[1];
    const field = atob(frameValues[2]);
    // set frame name as frame type of the string besides : is number
    const [tableName, fieldName] = [
      field.substr(0, field.indexOf('.')),
      field.substr(field.indexOf('.') + 1),
    ];
    this.iFrameName = name;
    this.fieldType = fieldType;

    this.tableName = tableName;
    this.fieldName = fieldName;

    this.sensitive = ELEMENTS[this.fieldType].sensitive;

    this.state.name = fieldName;

    this.metaData = metaData;

    this.collectBusEvents();
  }

  onFocusChange = (focus: boolean) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      event: focus
        ? ELEMENT_EVENTS_TO_CLIENT.FOCUS
        : ELEMENT_EVENTS_TO_CLIENT.BLUR,
    });
    this.changeFocus(focus);
  };

  changeFocus = (focus: boolean) => {
    this.state.isFocused = focus;

    this.sendChangeStatus();

    if (this.mask) {
      this.setValue(this.state.value, true);
    }
  };

  setReplacePattern(pattern: string[]) {
    if (!pattern) return;
    this.replacePattern = [regExFromString(pattern[0]), pattern[1] || ''];
  }

  setMask(mask: string[]) {
    if (!mask) {
      return;
    }
    const newMask: any[] = [];
    newMask[0] = mask[0];
    newMask[1] = null; // todo: replacer options
    newMask[2] = mask[1];
    if (newMask[2]) {
      Object.keys(newMask[2]).forEach((key) => {
        newMask[2][key] = new RegExp(newMask[2][key]);
      });
    } else {
      newMask[2]['9'] = /[0-9]/;
      newMask[2].a = /[a-zA-Z]/;
      newMask[2]['*'] = /[a-zA-Z0-9]/;
    }
    this.mask = newMask;
  }

  setValidation() {
    if (ELEMENTS[this.fieldType].regex) {
      this.regex = ELEMENTS[this.fieldType].regex;
    }
  }

  setSensitive(sensitive: boolean = this.sensitive) {
    if (this.sensitive === false && sensitive === true) {
      this.sensitive = sensitive;
    } else if (this.sensitive === true && sensitive === false) {
      throw Error('Sensitivity is not backward compatible');
    }
  }

  // todo: send error message of the field
  setValue = (value: string = '', valid: boolean = true) => {
    if (this.fieldType === ELEMENTS.checkbox.name) {
      // toggle for checkbox
      if (this.state.value === value) {
        this.state.value = '';
      } else {
        this.state.value = value;
      }
    } else {
      this.state.value = value;
    }

    if (this.fieldType === 'dob' && typeof value === 'string' && value) {
      this.state.value = new Date(value)
        .toISOString()
        .slice(0, 10)
        .split('-')
        .reverse()
        .join('/');
    }

    if (this.getUnformattedValue() && this.state.isEmpty) {
      this.state.isEmpty = false;
    } else if (!this.getUnformattedValue() && !this.state.isEmpty) {
      this.state.isEmpty = true;
    }

    if (valid && this.validator(this.state.value)) {
      this.state.isValid = true;
      this.state.isComplete = true;
    } else {
      this.state.isValid = false;
      this.state.isComplete = false;
    }

    this.sendChangeStatus(true);
  };

  getValue = () => {
    if (
      this.fieldType === 'dob'
      && this.state.value
      && typeof this.state.value === 'string'
    ) {
      return this.state.value.split('/').reverse().join('-');
    }
    return this.state.value;
  };

  getUnformattedValue = () => this.state.value
  // if (!this.mask) return this.state.value;
  // return unMask(this.state.value, this.mask);
  ;

  getStatus = () => {
    return {
      isFocused: this.state.isFocused,
      isValid: this.state.isValid,
      isEmpty: this.state.isEmpty,
      isComplete: this.state.isComplete,
      value:this.metaData.options?.debug? this.state.value:undefined
    };
  };

  validator(value: string) {
    if (this.fieldType === ElementType.CARD_NUMBER) {
      if (!validateCreditCardNumber(value)) {
        return false;
      }
    } else if (this.fieldType === ElementType.EXPIRATION_DATE) {
      if (this.regex) {
        return this.regex.test(value) && validateExpiryDate(value);
      }
      return validateExpiryDate(value);
    }

    if (this.regex) {
      return this.regex.test(value);
    }
    return true;
  }

  // on client force focus
  collectBusEvents = () => {
    bus
      .target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, (data) => {
        if (bus.origin === this.metaData.clientDomain) {
          if (data.name === this.iFrameName) {
            if (data.event === ELEMENT_EVENTS_TO_CLIENT.FOCUS) {
              this.changeFocus(true);
              this._emit(ELEMENT_EVENTS_TO_CLIENT.FOCUS);
            } else if (data.event === ELEMENT_EVENTS_TO_CLIENT.BLUR) {
              this.changeFocus(false);
              this._emit(ELEMENT_EVENTS_TO_CLIENT.BLUR);
            }
          } else {
          // empty
          }
        }
      });

    bus
      // .target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data:any) => {
        if (data.options.elementName === this.iFrameName) {
          if (data.options.value !== undefined) {
            // for setting value
            this.setValue(<string | undefined>data.options.value);
          } else if (
            data.options !== undefined
            && data.isSingleElementAPI === true
          ) {
            // for updating options
            this._emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
              options: data.options,
            });
          }
        }
      });

    // for radio buttons
    if (this.fieldType === ELEMENTS.radio.name) {
      bus
        .target(window.location.origin)
        .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
          if (
            data.value !== null
            && data.value !== undefined
            && data.value !== ''
            && data.fieldName === this.fieldName
            && data.fieldType === this.fieldType
            && data.value !== this.state.value
          ) {
            this.setValue(<string | undefined>data.value);
          }
        });
    }

    // for gateway
    bus.target(window.location.origin).on(ELEMENT_EVENTS_TO_IFRAME.GET_COLLECT_ELEMENT,
      (data, callback) => {
        if (data.name === this.iFrameName) {
          callback({ ...this.getStatus(), value: this.state.value });
        }
      });
  };

  sendChangeStatus = (inputEvent: boolean = false) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
      value: this.getStatus(),
    });

    this._emit(ELEMENT_EVENTS_TO_CLIENT.CHANGE, {
      ...this.getStatus(),
      value: this.state.value,
    });

    // send change states for radio button(sync)
    if (inputEvent && this.fieldType === ELEMENTS.radio.name) {
      bus.target(window.location.origin).emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
        fieldName: this.fieldName,
        fieldType: this.fieldType,
        value: this.state.value,
      });
    }
  };

  resetData() {
    this.state = {
      value: '',
      isFocused: false,
      isValid: false,
      isEmpty: true,
      isComplete: false,
      name: '',
    };
  }

  destroy() {
    this.resetData();
    this.resetEvents();
  }
}

// create separate IFrameFormElement for each radio button
// and separate or SET_VALUE event b/w radio buttons.
// while hitting tokenize it checks whether there are more
//  than 2 ':' if so append each values in an array(for checkbox)
export class IFrameForm {
  // single form to all form elements
  private iFrameFormElements: Record<string, IFrameFormElement> = {};

  private client?: Client;

  private clientMetaData?: any;

  private callbacks: Function[] = [];

  private controllerId: string;

  private clientDomain: string;

  constructor(controllerId: string, clientDomain: string) {
    this.controllerId = controllerId;
    this.clientDomain = clientDomain;
    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.controllerId,
        (data) => {
          if (!data.name) {
            throw new Error('Required params are not provided');
          }
          // @ts-ignore
          if (data.name && data.name.includes(COLLECT_FRAME_CONTROLLER)) {
            return;
          }
          const frameGlobalName: string = <string>data.name;
          if (this.clientMetaData) this.initializeFrame(window.parent, frameGlobalName);
          else {
            this.callbacks.push(() => {
              this.initializeFrame(window.parent, frameGlobalName);
            });
          }
        },
      );

    bus
      .target(this.clientDomain)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + this.controllerId,
        (data, callback) => {
          // todo: Do we need to reset the data!?
          this.tokenize(data)
            .then((response) => {
              callback(response);
            })
            .catch((error) => {
              callback({ error });
            });
        },
      );

    bus.on(ELEMENT_EVENTS_TO_IFRAME.DESTROY_FRAME, (data, callback) => {
      Object.keys(this.iFrameFormElements).forEach((iFrameFormElement) => {
        if (iFrameFormElement === data.name) {
          this.iFrameFormElements[iFrameFormElement].destroy();
          delete this.iFrameFormElements[iFrameFormElement];
        }
      });
      callback({});
    });
  }

  setClient(client) {
    this.client = client;
  }

  setClientMetadata(clientMetaData: any) {
    this.clientMetaData = clientMetaData;
    this.callbacks.forEach((func) => {
      func();
    });
    this.callbacks = [];
  }

  private getOrCreateIFrameFormElement = (frameName) => {
    this.iFrameFormElements[frameName] = this.iFrameFormElements[frameName]
      || new IFrameFormElement(frameName, {
        ...this.clientMetaData,
      });
    return this.iFrameFormElements[frameName];
  };

  tokenize = (options) => {
    if (!this.client) throw new Error('client connection not established');
    const responseObject: any = {};
    const formElements = Object.keys(this.iFrameFormElements);
    for (let i = 0; i < formElements.length; i += 1) {
      const { state } = this.iFrameFormElements[formElements[i]];
      const { tableName } = this.iFrameFormElements[formElements[i]];
      if (!state.isValid || !state.isComplete) {
        return Promise.reject({
          error: `${[state.name]}: Provide complete and valid inputs`,
        });
      }

      if (
        this.iFrameFormElements[formElements[i]].fieldType
        === ELEMENTS.checkbox.name
      ) {
        if (responseObject[state.name]) {
          responseObject[state.name] = `${responseObject[state.name]},${
            state.value
          }`;
        } else {
          responseObject[state.name] = state.value;
        }
      } else if (responseObject[tableName]) {
        set(
          responseObject[tableName],
          state.name,
          this.iFrameFormElements[formElements[i]].getUnformattedValue(),
        );
      } else {
        responseObject[tableName] = {};
        set(
          responseObject[tableName],
          state.name,
          this.iFrameFormElements[formElements[i]].getUnformattedValue(),
        );
      }
    }
    let finalRequest;
    try {
      finalRequest = constructElementsInsertReq(responseObject, options);
    } catch (error) {
      return Promise.reject({
        error: error?.message,
      });
    }

    const { client } = this;
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      getAccessToken().then((authToken) => {
        client
          .request({
            body: {
              records: finalRequest,
            },
            requestMethod: 'POST',
            url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          })
          .then((response: any) => {
            rootResolve(
              constructInsertRecordResponse(
                response,
                options.tokens,
                finalRequest,
              ),
            );
          })
          .catch((error) => {
            rootReject(error);
          });
      }).catch((err) => {
        rootReject(err);
      });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  };

  private initializeFrame = (root: Window, frameGlobalName: string) => {
    let frameInstance: any;
    for (let i = 0; i < root.frames.length; i += 1) {
      const frame: any = root.frames[i];

      try {
        if (
          frame.location.href === window.location.href
          && frame.name === frameGlobalName
        ) {
          frameInstance = frame;
          break;
        }
      } catch (e) {
        /* ignored */
      }
    }

    if (!frameInstance) {
      throw new Error(`frame not found: ${frameGlobalName}`);
    } else if (frameInstance?.Skyflow?.init) {
      frameInstance.Skyflow.init(
        this.getOrCreateIFrameFormElement,
        this.clientMetaData,
      );
    }
  };
}
