/* eslint-disable no-underscore-dangle */
import bus from 'framebus';
import Client from '../../../client';
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  COLLECT_FRAME_CONTROLLER,
  ElementType,
  FRAME_ELEMENT,
} from '../../constants';
import EventEmitter from '../../../event-emitter';
import regExFromString from '../../../libs/regex';
import {
  validateCardNumberLengthCheck,
  validateCreditCardNumber,
  validateExpiryDate,
} from '../../../utils/validators';
import {
  constructElementsInsertReq,
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from '../../../core/collect';
import { getAccessToken } from '../../../utils/busEvents';
import {
  printLog,
  parameterizedString,
  EnvOptions,
  getElementName,
} from '../../../utils/logsHelper';
import SkyflowError from '../../../libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import {
  Context,
  IValidationRule,
  LogLevel,
  MessageType,
  ValidationRuleType,
} from '../../../utils/common';
import { formatFrameNameToId } from '../../../utils/helpers';

const set = require('set-value');
const RegexParser = require('regex-parser');

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

  validations?: IValidationRule[];

  errorText?: string;

  replacePattern?: [RegExp, string];

  mask?: any;

  context: Context;

  constructor(name: string, metaData, context: Context) {
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
    this.context = context;
    this.collectBusEvents();
  }

  onFocusChange = (focus: boolean) => {
    this.changeFocus(focus);

    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
      name: this.iFrameName,
      event: focus
        ? ELEMENT_EVENTS_TO_CLIENT.FOCUS
        : ELEMENT_EVENTS_TO_CLIENT.BLUR,
      value: { ...this.getStatus() },
    });

    if (!focus) {
      this._emit(ELEMENT_EVENTS_TO_CLIENT.BLUR, {
        ...this.getStatus(),
        value: this.state.value,
        error: this.errorText,
      });
    }
  };

  changeFocus = (focus: boolean) => {
    this.state.isFocused = focus;
    // this.sendChangeStatus();
    this.setValue(this.state.value, true);
    // if (this.mask) {
    //   this.setValue(this.state.value, true);
    // }
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

  setValidation(validations: IValidationRule[] | undefined) {
    if (ELEMENTS[this.fieldType].regex) {
      this.regex = ELEMENTS[this.fieldType].regex;
    }
    if (validations) {
      this.validations = validations;
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

  getStatus = () => ({
    isFocused: this.state.isFocused,
    isValid: this.state.isValid,
    isEmpty: this.state.isEmpty,
    isComplete: this.state.isComplete,
    value: EnvOptions[this.context?.env]?.doesReturnValue ? this.state.value : undefined,
  });

  validator(value: string) {
    let resp = true;
    if (this.fieldType === ElementType.CARD_NUMBER) {
      if (this.regex) {
        resp = this.regex.test(value)
        && validateCreditCardNumber(value)
        && validateCardNumberLengthCheck(value);
      }
    } else if (this.fieldType === ElementType.EXPIRATION_DATE) {
      if (this.regex) {
        resp = this.regex.test(value) && validateExpiryDate(value);
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (this.regex) {
        resp = this.regex.test(value);
      }
    }
    if (!resp) {
      this.errorText = logs.errorLogs.INVALID_COLLECT_VALUE;
      return resp;
    }

    resp = this.validateCustomValidations(value);
    if (resp) {
      this.errorText = '';
    }
    return resp;
  }

  validateCustomValidations(value: string) {
    let resp = true;
    if (this.validations && this.validations.length) {
      for (let i = 0; i < this.validations.length; i += 1) {
        switch (this.validations[i].type) {
          case ValidationRuleType.REGEX_MATCH_RULE:
            if (this.validations[i].params.regex) {
              const tempRegex = RegexParser(this.validations[i].params.regex);
              resp = tempRegex.test(value);
            }
            break;
          case ValidationRuleType.LENGTH_MATCH_RULE:
            if (this.validations[i].params.min && value.length < this.validations[i].params.min) {
              resp = false;
            }
            if (this.validations[i].params.max && value.length > this.validations[i].params.max) {
              resp = false;
            }
            break;
          case ValidationRuleType.ELEMENT_VALUE_MATCH_RULE: {
            const elementName = this.validations[i].params.element;
            const elementIFrame = window.parent.frames[elementName];
            let elementValue;
            if (elementIFrame) {
              if (elementName.startsWith(`${FRAME_ELEMENT}:`)) {
                const elementId = formatFrameNameToId(elementName);
                const collectInputElement = elementIFrame
                  .document.getElementById(elementId) as HTMLInputElement;
                if (collectInputElement) {
                  elementValue = collectInputElement.value;
                }
              }
              if (elementValue !== value) {
                resp = false;
              }
            }
            break; }
          default:
            this.errorText = logs.errorLogs.INVALID_VALIDATION_RULE_TYPE;
            resp = false;
        }

        if (!resp) {
          this.errorText = this.validations[i].params.error || logs.errorLogs.VALIDATION_FAILED;
          return resp;
        }
      }
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
      .target(this.metaData.clientDomain)
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

    // for connection
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

  private context!:Context;

  private logLevel: LogLevel;

  constructor(controllerId: string, clientDomain: string, logLevel: LogLevel) {
    this.controllerId = controllerId;
    this.clientDomain = clientDomain;
    this.logLevel = logLevel;

    printLog(
      logs.infoLogs.IFRAMEFORM_CONSTRUCTOR_FRAME_READY_LISTNER,
      MessageType.LOG,
      logLevel,
    );

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.controllerId,
        (data:any) => {
          printLog(
            logs.infoLogs.ENTERED_COLLECT_FRAME_READY_CB,
            MessageType.LOG,
            logLevel,
          );
          if (!data.name) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.REQUIRED_PARAMS_NOT_PROVIDED, [], true);
          }
          // @ts-ignore
          if (data.name && data.name.includes(COLLECT_FRAME_CONTROLLER)) {
            return;
          }
          const frameGlobalName: string = <string>data.name;
          printLog(
            parameterizedString(
              logs.infoLogs.EXECUTE_COLLECT_ELEMENT_FRAME_READY_CB,
              getElementName(frameGlobalName),
            ),
            MessageType.LOG,
            logLevel,
          );
          if (this.clientMetaData) this.initializeFrame(window.parent, frameGlobalName);
          else {
            printLog(
              logs.infoLogs.CLIENT_METADATA_NOT_SET,
              MessageType.LOG,
              logLevel,
            );
            this.callbacks.push(() => {
              this.initializeFrame(window.parent, frameGlobalName);
            });
          }
        },
      );

    printLog(
      logs.infoLogs.IFRAMEFORM_CONSTRUCTOR_TOKENIZATION_LISTNER,
      MessageType.LOG,
      logLevel,
    );

    bus
      .target(this.clientDomain)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + this.controllerId,
        (data, callback) => {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
          MessageType.LOG, this.context.logLevel);
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
      printLog(
        'In setClientMetadata, executing callbacks',
        MessageType.LOG,
        this.logLevel,
      );
      func();
    });
    this.callbacks = [];
  }

  setContext(context:Context) {
    this.context = context;
  }

  private getOrCreateIFrameFormElement = (frameName) => {
    this.iFrameFormElements[frameName] = this.iFrameFormElements[frameName]
      || new IFrameFormElement(frameName, {
        ...this.clientMetaData,
      }, this.context);
    return this.iFrameFormElements[frameName];
  };

  tokenize = (options) => {
    if (!this.client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const responseObject: any = {};
    const formElements = Object.keys(this.iFrameFormElements);

    let errorMessage = '';
    for (let i = 0; i < formElements.length; i += 1) {
      const { state } = this.iFrameFormElements[formElements[i]];
      if (!state.isValid || !state.isComplete) {
        errorMessage += `${state.name}:${this.iFrameFormElements[formElements[i]].errorText} `;
      }
    }
    if (errorMessage.length > 0) {
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.COMPLETE_AND_VALID_INPUTS, [`${errorMessage}`], true));
    }

    for (let i = 0; i < formElements.length; i += 1) {
      const { state } = this.iFrameFormElements[formElements[i]];
      const { tableName } = this.iFrameFormElements[formElements[i]];
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
    let finalRecords;
    let finalRequest;
    try {
      finalRecords = constructElementsInsertReq(responseObject, options);
      finalRequest = constructInsertRecordRequest(finalRecords, options);
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
                finalRecords.records,
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
      throw new SkyflowError(SKYFLOW_ERROR_CODE.FRAME_NOT_FOUND, [`${frameGlobalName}`], true);
    } else if (frameInstance?.Skyflow?.init) {
      printLog(
        logs.infoLogs.EXECUTE_COLLECT_ELEMENT_INIT,
        MessageType.LOG,
        this.logLevel,
      );
      frameInstance.Skyflow.init(
        this.getOrCreateIFrameFormElement,
        this.clientMetaData,
      );
    }
  };
}
