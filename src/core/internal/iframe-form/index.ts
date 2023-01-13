/*
Copyright (c) 2022 Skyflow, Inc.
*/
/* eslint-disable no-underscore-dangle */
import bus from 'framebus';
import get from 'lodash/get';
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
  validateExpiryMonth,
  validateExpiryYear,
} from '../../../utils/validators';
import {
  checkForElementMatchRule,
  constructElementsInsertReq,
  constructInsertRecordRequest,
  constructInsertRecordResponse,
  constructUploadResponse,
} from '../../../core-utils/collect';
import { getAccessToken } from '../../../utils/bus-events';
import {
  printLog,
  parameterizedString,
  EnvOptions,
  getElementName,
} from '../../../utils/logs-helper';
import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import logs from '../../../utils/logs';
import {
  Context,
  IValidationRule,
  LogLevel,
  MessageType,
  ValidationRuleType,
} from '../../../utils/common';
import {
  fileValidation, formatFrameNameToId, getReturnValue, removeSpaces,
} from '../../../utils/helpers';

const set = require('set-value');
const RegexParser = require('regex-parser');

export class IFrameFormElement extends EventEmitter {
  // All external Events and state events will be handled here
  state = {
    value: <any | string | undefined>undefined,
    isFocused: false,
    isValid: false,
    isEmpty: true,
    isComplete: false,
    name: '',
    isRequired: false,
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

  label?: string;

  doesClientHasError: boolean = false;

  clientErrorText: string | undefined = undefined;

  format: string = '';

  skyflowID?: string;

  constructor(name: string, label: string, metaData, context: Context, skyflowID?: string) {
    super();
    const frameValues = name.split(':');

    const fieldType = frameValues[1];
    const tempfield = atob(frameValues[2]);

    const removeAfter = tempfield.indexOf(':');
    const field = removeAfter === -1 ? tempfield : tempfield.substring(0, removeAfter);
    // set frame name as frame type of the string besides : is number
    const [tableName, fieldName] = [
      field.substr(0, field.indexOf('.')),
      field.substr(field.indexOf('.') + 1),
    ];
    this.iFrameName = name;
    this.fieldType = fieldType;

    this.tableName = tableName;
    this.fieldName = fieldName;
    this.label = label;
    this.skyflowID = skyflowID;

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
        error: this.clientErrorText || this.errorText,
      });
    } else {
      this._emit(ELEMENT_EVENTS_TO_CLIENT.FOCUS, {
        ...this.getStatus(),
        value: this.state.value,
        error: this.clientErrorText || this.errorText,
      });
    }
  };

  changeFocus = (focus: boolean) => {
    this.state.isFocused = focus;
    // this.sendChangeStatus();
    // this.setValue(this.state.value, true);
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

  setFormat(format: string) {
    this.format = format;
  }

  setSensitive(sensitive: boolean = this.sensitive) {
    if (this.sensitive === false && sensitive === true) {
      this.sensitive = sensitive;
    } else if (this.sensitive === true && sensitive === false) {
      throw Error('Sensitivity is not backward compatible');
    }
  }

  // todo: send error message of the field
  setValue = (value: any = '', valid: boolean = true) => {
    if (this.fieldType === ELEMENTS.checkbox.name) {
      // toggle for checkbox
      if (this.state.value === value) {
        this.state.value = '';
      } else {
        this.state.value = value;
      }
    } else if (this.fieldType === ELEMENTS.EXPIRATION_MONTH.name && value) {
      if (value.length === 1 && Number(value) >= 2) {
        this.state.value = `0${value}`;
      } else {
        this.state.value = value;
      }
    } else if (this.fieldType === ELEMENTS.EXPIRATION_DATE.name && value) {
      if (this.format.startsWith('MM')) {
        if (value.length === 1 && Number(value) >= 2) {
          this.state.value = `0${value}`;
        } else {
          this.state.value = value;
        }
      } else if (this.format.startsWith('YYYY')) {
        const lastChar = (value.length > 0 && value.charAt(value.length - 1)) || '';
        if (value.length === 6 && Number(lastChar) >= 2) {
          this.state.value = `${value.substring(0, 5)}0${lastChar}`;
        } else {
          this.state.value = value;
        }
      } else if (this.format.startsWith('YY')) {
        const lastChar = (value.length > 0 && value.charAt(value.length - 1)) || '';
        if (value.length === 4 && Number(lastChar) >= 2) {
          this.state.value = `${value.substring(0, 3)}0${lastChar}`;
        } else {
          this.state.value = value;
        }
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
    if (valid && !this.doesClientHasError && this.validator(this.state.value)) {
      this.state.isValid = true;
      this.state.isComplete = true;
    } else {
      this.state.isValid = false;
      this.state.isComplete = false;
      if (!this.errorText) {
        this.errorText = this.label
          ? `${parameterizedString(logs.errorLogs.INVALID_COLLECT_VALUE_WITH_LABEL,
            this.label)}`
          : logs.errorLogs.INVALID_COLLECT_VALUE;
      }
      if (!this.state.isValid && this.state.isEmpty) {
        this.state.isRequired = true;
        this.errorText = this.label ? `${parameterizedString(logs.errorLogs.REQUIRED_COLLECT_VALUE,
          this.label)}` : logs.errorLogs.DEFAULT_REQUIRED_COLLECT_VALUE;
      }
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

  getUnformattedValue = () => {
    if (!this.mask) return this.state.value;
    if (this.fieldType === ELEMENTS.CARD_NUMBER.name && this.state.value) {
      return removeSpaces(this.state.value as string);
    }
    // return unMask(this.state.value, this.mask);;
    return this.state.value;
  };

  getStatus = () => ({
    isFocused: this.state.isFocused,
    isValid: this.state.isValid && !this.doesClientHasError,
    isEmpty: this.state.isEmpty,
    isComplete: this.state.isComplete,
    isRequired: this.state.isRequired,
    // Card Number should return 8 digit bin data
    value: this.state.value
      && getReturnValue(this.state.value, this.fieldType,
        EnvOptions[this.context?.env]?.doesReturnValue),
  });

  validator(value: any) {
    let resp = true;
    if (this.fieldType === ElementType.CARD_NUMBER && value) {
      if (this.regex) {
        resp = this.regex.test(value)
          && validateCreditCardNumber(value)
          && validateCardNumberLengthCheck(value);
      }
    } else if (this.fieldType === ElementType.EXPIRATION_DATE && value) {
      resp = validateExpiryDate(value, this.format);
    } else if (this.fieldType === ElementType.EXPIRATION_MONTH && value) {
      resp = validateExpiryMonth(value);
    } else if (this.fieldType === ElementType.EXPIRATION_YEAR && value) {
      resp = validateExpiryYear(value, this.format);
    } else if (this.fieldType === ElementType.FILE_INPUT) {
      resp = fileValidation(value);
    } else {
      // eslint-disable-next-line no-lonely-if
      if (this.regex && value) {
        resp = this.regex.test(value);
      }
    }
    if (!resp) {
      this.errorText = this.label
        ? `${parameterizedString(logs.errorLogs.INVALID_COLLECT_VALUE_WITH_LABEL,
          this.label)}`
        : logs.errorLogs.INVALID_COLLECT_VALUE;
      return resp;
    }

    resp = this.validateCustomValidations(value);
    if (resp) {
      this.errorText = '';
    }
    return resp && !this.doesClientHasError;
  }

  validateCustomValidations(value: string = '') {
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
            let elementIFrame;
            try {
              elementIFrame = window.parent.frames[elementName];
            } catch (err) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE, [`${i}`], true);
            }
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
            break;
          }
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
      .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data: any) => {
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

    // for connection
    // bus
    //   .target(properties.IFRAME_SECURE_ORGIN)
    //   .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data:any) => {
    //     if (data.name === this.iFrameName) {
    //       if (data.options.value !== undefined) {
    //         // for setting value
    //         this.setValue(<string | undefined>data.options.value);
    //       }
    //     }
    //   });

    bus.target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR, (data) => {
        if (data.name === this.iFrameName) {
          this.doesClientHasError = data.isTriggerError as boolean;
          this.clientErrorText = data.isTriggerError ? data.clientErrorText as string : undefined;
          this._emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR, {
            ...data,
            state: { ...this.getStatus(), error: this.errorText },
          });
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
    // bus.target(window.location.origin).on(ELEMENT_EVENTS_TO_IFRAME.GET_COLLECT_ELEMENT,
    //   (data, callback) => {
    //     if (data.name === this.iFrameName) {
    //       callback({ ...this.getStatus(), value: this.getUnformattedValue() });
    //     }
    //   });
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
      isRequired: false,
    };
  }

  destroy() {
    this.resetData();
    this.resetEvents();
  }
}

const CLASS_NAME = 'IFrameForm';
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

  private context!: Context;

  private logLevel: LogLevel;

  constructor(controllerId: string, clientDomain: string, logLevel: LogLevel) {
    this.controllerId = controllerId;
    this.clientDomain = clientDomain;
    this.logLevel = logLevel;

    printLog(
      parameterizedString(
        logs.infoLogs.IFRAMEFORM_CONSTRUCTOR_FRAME_READY_LISTNER,
        CLASS_NAME,
      ),
      MessageType.LOG,
      logLevel,
    );

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + this.controllerId,
        (data: any) => {
          printLog(
            parameterizedString(
              logs.infoLogs.ENTERED_COLLECT_FRAME_READY_CB,
              CLASS_NAME,
            ),
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
              CLASS_NAME,
              getElementName(frameGlobalName),
            ),
            MessageType.LOG,
            logLevel,
          );
          if (this.clientMetaData) this.initializeFrame(window.parent, frameGlobalName);
          else {
            printLog(
              parameterizedString(
                logs.infoLogs.CLIENT_METADATA_NOT_SET,
                CLASS_NAME,
              ),
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
      parameterizedString(
        logs.infoLogs.IFRAMEFORM_CONSTRUCTOR_TOKENIZATION_LISTNER,
        CLASS_NAME,
      ),
      MessageType.LOG,
      logLevel,
    );

    bus
      .target(this.clientDomain)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + this.controllerId,
        (data, callback) => {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
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

    bus
      .target(this.clientDomain)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD + this.controllerId,
        (data, callback) => {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
          MessageType.LOG, this.context.logLevel);
          this.paralleUploadFiles()
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

  setContext(context: Context) {
    this.context = context;
  }

  private getOrCreateIFrameFormElement = (frameName, label, skyflowID) => {
    this.iFrameFormElements[frameName] = this.iFrameFormElements[frameName]
      || new IFrameFormElement(frameName, label, {
        ...this.clientMetaData,
      }, this.context, skyflowID);
    return this.iFrameFormElements[frameName];
  };

  paralleUploadFiles = () => new Promise((rootResolve, rootReject) => {
    const formElements = Object.keys(this.iFrameFormElements);

    Promise.allSettled(
      formElements.map(async (element) => {
        let res;
        if (
          this.iFrameFormElements[element].fieldType
          === ELEMENTS.FILE_INPUT.name
        ) {
          res = await this.uploadFiles(this.iFrameFormElements[element]);
        }
        return res;
      }),

    ).then((resultSet) => {
      const fileUploadResponse: Record<string, any>[] = [];
      const errorResponse: Record<string, any>[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value !== undefined) {
            if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
              errorResponse.push(result.value);
            } else {
              fileUploadResponse.push(result.value);
            }
          }
        } else if (result.status === 'rejected') {
          errorResponse.push(result.reason);
        }
      });
      if (errorResponse.length === 0) {
        rootResolve({ fileUploadResponse });
      } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
      else rootReject({ fileUploadResponse, errorResponse });
    });
  });

  uploadFiles = (fileElement) => {
    if (!this.client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const fileUploadObject: any = {};

    const {
      state, tableName, skyflowID, onFocusChange,
    } = fileElement;

    if (state.isRequired) {
      onFocusChange(false);
    }

    const validatedFileState = fileValidation(state.value);

    if (!validatedFileState) {
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true));
    }
    fileUploadObject[state.name] = state.value;

    const formData = new FormData();

    const column = Object.keys(fileUploadObject)[0];

    const value: Blob = Object.values(fileUploadObject)[0] as Blob;

    formData.append(column, value);

    const { client } = this;
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        client
          .request({
            body: formData,
            requestMethod: 'POST',
            url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${tableName}/${skyflowID}/files`,
            headers: {
              authorization: `Bearer ${authToken}`,
              'content-type': 'multipart/form-data',
            },
          })
          .then((response: any) => {
            rootResolve(constructUploadResponse(response));
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
        .catch((err) => {
          reject(err);
        });
    });
  };

  tokenize = (options) => {
    if (!this.client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const responseObject: any = {};

    const formElements = Object.keys(this.iFrameFormElements);
    let errorMessage = '';
    for (let i = 0; i < formElements.length; i += 1) {
      const {
        state, doesClientHasError, clientErrorText, errorText, onFocusChange,
      } = this.iFrameFormElements[formElements[i]];

      if (state.isRequired) {
        onFocusChange(false);
      }

      if (!state.isValid || !state.isComplete) {
        if (doesClientHasError) {
          errorMessage += `${state.name}:${clientErrorText}`;
        } else { errorMessage += `${state.name}:${errorText} `; }
      }
    }

    if (errorMessage.length > 0) {
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.COMPLETE_AND_VALID_INPUTS, [`${errorMessage}`], true));
    }

    for (let i = 0; i < formElements.length; i += 1) {
      const { state, tableName, validations } = this.iFrameFormElements[formElements[i]];
      if (
        this.iFrameFormElements[formElements[i]].fieldType
        !== ELEMENTS.FILE_INPUT.name
      ) {
        if (
          this.iFrameFormElements[formElements[i]].fieldType
          === ELEMENTS.checkbox.name
        ) {
          if (responseObject[state.name]) {
            responseObject[state.name] = `${responseObject[state.name]},${state.value
            }`;
          } else {
            responseObject[state.name] = state.value;
          }
        } else if (responseObject[tableName]) {
          if (get(responseObject[tableName], state.name)
            && !(validations && checkForElementMatchRule(validations))) {
            return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT,
              [state.name, tableName], true));
          }
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
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        client
          .request({
            body: {
              records: finalRequest,
            },
            requestMethod: 'POST',
            url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}`,
            headers: {
              authorization: `Bearer ${authToken}`,
              'content-type': 'application/json',
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
        parameterizedString(
          logs.infoLogs.EXECUTE_COLLECT_ELEMENT_INIT,
          CLASS_NAME,
        ),
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
