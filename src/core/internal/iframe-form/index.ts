/*
Copyright (c) 2022 Skyflow, Inc.
*/
/* eslint-disable no-underscore-dangle */
import bus from 'framebus';

import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS,
  ElementType,
  FRAME_ELEMENT,
  DEFAULT_ERROR_TEXT_ELEMENT_TYPES,
  DEFAULT_REQUIRED_TEXT_ELEMENT_TYPES,
  CardType,
  ELEMENT_TYPES,
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
} from '../../../core-utils/collect';
import {
  printLog,
  parameterizedString,
  EnvOptions,
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
  fileValidation,
  formatFrameNameToId,
  getReturnValue,
  removeSpaces,
  vaildateFileName,
} from '../../../utils/helpers';
import { ContainerType } from '../../../skyflow';

const RegexParser = require('regex-parser');

export default class IFrameFormElement extends EventEmitter {
  // All external Events and state events will be handled here
  state = {
    value: <any | string | undefined>undefined,
    isFocused: false,
    isValid: false,
    isEmpty: true,
    isComplete: false,
    name: '',
    isRequired: false,
    isTouched: false,
    selectedCardScheme: '',
  };

  readonly fieldType: string;

  private sensitive: boolean;

  tableName?: string;

  fieldName?: string;

  iFrameName: string;

  metaData;

  private regex?: RegExp;

  validations?: IValidationRule[];

  isCustomValidationFailed: boolean = false;

  errorText?: string;

  replacePattern?: [RegExp, string];

  mask?: any;

  context: Context;

  label?: string;

  doesClientHasError: boolean = false;

  clientErrorText: string | undefined = undefined;

  format: string = '';

  skyflowID?: string;

  containerType: string;

  cardType: string = CardType.DEFAULT;

  preserveFileName: boolean = true;

  allowedFileType: any;

  blockEmptyFiles: boolean = false;

  constructor(name: string, label: string, metaData, context: Context, skyflowID?: string) {
    super();
    const frameValues = name.split(':');
    const fieldType = frameValues[1];
    // const tempfield = atob(frameValues[2]);

    // const removeAfter = tempfield.indexOf(':');
    // const field = removeAfter === -1 ? tempfield : tempfield.substring(0, removeAfter);
    // set frame name as frame type of the string besides : is number
    // const [tableName, fieldName] = [
    //   field.substr(0, field.indexOf('.')),
    //   field.substr(field.indexOf('.') + 1),
    // ];
    this.containerType = metaData.containerType;
    this.iFrameName = name;
    this.fieldType = fieldType;

    // this.tableName = tableName;
    // this.fieldName = fieldName;
    this.label = label;
    this.skyflowID = skyflowID;

    this.sensitive = ELEMENTS[this.fieldType].sensitive;

    // this.state.name = fieldName;

    this.metaData = metaData;
    this.context = context;
    this.state.isRequired = metaData.isRequired;
    this.collectBusEvents();
  }

  isMatchEqual(index: number, value: string, validation: IValidationRule): boolean {
    try {
      const elementName = validation?.params?.element;
      const elementIFrame = window.parent.frames[elementName];
      if (!elementIFrame) return false;

      if (elementName.startsWith(`${FRAME_ELEMENT}:`)) {
        const elementId = elementName.includes('group:')
          ? validation.params.elementID
          : formatFrameNameToId(elementName);

        const inputElement = elementIFrame.document.getElementById(elementId) as HTMLInputElement;
        if (inputElement) {
          let elementValue = inputElement?.value;

          if (elementValue && this.fieldType === ElementType.CARD_NUMBER) {
            elementValue = elementValue.replace(/[\s-]/g, '');
          }

          return elementValue === value;
        }
      }
    } catch {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.ELEMENT_NOT_MOUNTED_IN_ELEMENT_MATCH_RULE,
        [`${index}`],
        true,
      );
    }

    return false;
  }

  checkMatch(index: number, validation: IValidationRule): void {
    const elementName = validation?.params?.element;
    const iframeName = this.metaData.containerType === ELEMENT_TYPES.COMPOSE
      ? validation?.params?.elementID
      : formatFrameNameToId(elementName);
    // listen to on blur or main element

    bus.on(ELEMENT_EVENTS_TO_CLIENT.BLUR + iframeName, () => {
      let { value } = this.state;
      if (value && this.fieldType === ElementType.CARD_NUMBER) {
        value = value.replace(/[\s-]/g, '');
      }
      // Validate the match and update the state accordingly
      const isValid = this.isMatchEqual(index, value, validation);
      this.state.isValid = isValid;
      this.setValue(this.state.value, isValid, true);
      if (!this.state.isFocused) {
        this.onFocusChange(false);
      }
    });
  }

  listenForMatchRule(): void {
    if (!this.validations || this.validations.length === 0) return;

    this.validations.forEach((validation, index) => {
      if (validation.type === ValidationRuleType.ELEMENT_VALUE_MATCH_RULE) {
        this.checkMatch(index, validation);
      }
    });
  }

  onFocusChange = (focus: boolean) => {
    this.changeFocus(focus);
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + this.iFrameName, {
      name: this.iFrameName,
      event: focus
        ? ELEMENT_EVENTS_TO_CLIENT.FOCUS
        : ELEMENT_EVENTS_TO_CLIENT.BLUR,
      value: { ...this.getStatus() },
    });
    if (!focus) {
      bus.emit(ELEMENT_EVENTS_TO_CLIENT.BLUR + this.iFrameName);
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

  onDropdownSelect = (cardType:string) => {
    this.state.selectedCardScheme = cardType;
    this.sendChangeStatus(true);
  };

  changeFocus = (focus: boolean) => {
    this.state.isTouched = true;
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
    try {
      if (newMask[2]) {
        Object.keys(newMask[2]).forEach((key) => {
          newMask[2][key] = new RegExp(newMask[2][key]);
        });
      } else {
        newMask[2]['9'] = /[0-9]/;
        newMask[2].a = /[a-zA-Z]/;
        newMask[2]['*'] = /[a-zA-Z0-9]/;
      }
    } catch (err) {
      printLog(parameterizedString(logs.warnLogs.INVALID_INPUT_TRANSLATION,
        this.fieldType),
      MessageType.WARN, this.context?.logLevel || LogLevel.ERROR);
      return;
    }
    this.mask = newMask;
  }

  setValidation(validations: IValidationRule[] | undefined) {
    if (ELEMENTS[this.fieldType].regex) {
      this.regex = ELEMENTS[this.fieldType].regex;
    }
    if (validations) {
      this.validations = validations;

      if (checkForElementMatchRule(validations)) {
        this.listenForMatchRule();
      }
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
  setValue = (value: any = '', valid: boolean = true, isReset: boolean = false) => {
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
        this.state.isComplete = true;
      } else {
        this.state.value = value;
        this.state.isComplete = (value.length === 2);
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
          this.state.isComplete = true;
        } else {
          this.state.value = value;
          this.state.isComplete = (value.length === 7);
        }
      } else if (this.format.startsWith('YY')) {
        const lastChar = (value.length > 0 && value.charAt(value.length - 1)) || '';
        if (value.length === 4 && Number(lastChar) >= 2) {
          this.state.value = `${value.substring(0, 3)}0${lastChar}`;
          this.state.isComplete = true;
        } else {
          this.state.value = value;
          this.state.isComplete = (value.length === 5);
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

    if (this.validator(this.state.value) && !this.doesClientHasError && valid) {
      this.state.isValid = true;
      if (this.fieldType === ELEMENTS.EXPIRATION_MONTH.name) {
        //
      } else if (this.fieldType === ELEMENTS.EXPIRATION_DATE.name && (this.format.endsWith('MM'))) {
        //
      } else {
        this.state.isComplete = true;
      }
    } else {
      this.state.isValid = false;
      this.state.isComplete = false;
      if (!this.errorText) {
        if (this.label) {
          this.errorText = `${parameterizedString(
            logs.errorLogs.INVALID_COLLECT_VALUE_WITH_LABEL,
            this.label,
          )}`;
        } else {
          this.errorText = this.containerType === ContainerType.COLLECT
            ? logs.errorLogs.INVALID_COLLECT_VALUE
            : DEFAULT_ERROR_TEXT_ELEMENT_TYPES[this.fieldType];
        }
      }
      if (!this.state.isValid && this.state.isEmpty && this.state.isRequired) {
        if (this.label) {
          this.errorText = `${parameterizedString(logs.errorLogs.REQUIRED_COLLECT_VALUE,
            this.label)}`;
        } else {
          this.errorText = this.containerType === ContainerType.COLLECT
            ? logs.errorLogs.DEFAULT_REQUIRED_COLLECT_VALUE
            : DEFAULT_REQUIRED_TEXT_ELEMENT_TYPES[this.fieldType];
        }
      }
    }
    if (!isReset) {
      this.sendChangeStatus(true);
    }
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
    isTouched: this.state.isTouched,
    // Card Number should return 8 digit bin data
    value: this.state.value
      && getReturnValue(this.state.value, this.fieldType,
        EnvOptions[this.context?.env]?.doesReturnValue),
    ...(this.state.selectedCardScheme ? { selectedCardScheme: this.state.selectedCardScheme } : {}),
  });

  validator(value: any) {
    let resp = true;
    let vaildateFileNames = true;

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
      try {
        resp = fileValidation(value, this.state.isRequired, {
          allowedFileType: this.allowedFileType,
          blockEmptyFiles: this.blockEmptyFiles,
        });
      } catch (err) {
        resp = false;
      }
      if (this.preserveFileName) vaildateFileNames = vaildateFileName(value.name);
    } else if (this.fieldType === ElementType.MULTI_FILE_INPUT) {
      const files = this.state.value instanceof FileList
        ? Array.from(this.state.value)
        : [this.state.value];
      for (let i = 0; i < files.length; i += 1) {
        try {
          resp = fileValidation(files[i], this.state.isRequired, {
            allowedFileType: this.allowedFileType,
            blockEmptyFiles: this.blockEmptyFiles,
          });
        } catch (err) {
          resp = false;
        }
        if (this.preserveFileName) vaildateFileNames = vaildateFileName(files[i].name);
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (this.regex && value) {
        resp = this.regex.test(value);
      }
    }
    if (!resp || !vaildateFileNames) {
      this.isCustomValidationFailed = false;
      if (!resp) {
        if (this.label) {
          this.errorText = `${parameterizedString(
            logs.errorLogs.INVALID_COLLECT_VALUE_WITH_LABEL,
            this.label,
          )}`;
        } else {
          this.errorText = this.containerType === ContainerType.COLLECT
            ? logs.errorLogs.INVALID_COLLECT_VALUE
            : DEFAULT_ERROR_TEXT_ELEMENT_TYPES[this.fieldType];
        }
        return resp;
      }
      if (!vaildateFileNames) {
        this.errorText = this.containerType === ContainerType.COLLECT
          ? parameterizedString(
            logs.errorLogs.INVALID_FILE_NAME,
          )
          : DEFAULT_ERROR_TEXT_ELEMENT_TYPES[this.fieldType];
        return vaildateFileNames;
      }
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
        if (this.fieldType === ElementType.CARD_NUMBER) {
          value = value.replace(/[\s-]/g, '');
        }
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
          case ValidationRuleType.ELEMENT_VALUE_MATCH_RULE:
            resp = this.isMatchEqual(i, value, this.validations[i]);
            break;
          default:
            this.errorText = parameterizedString(logs.errorLogs.INVALID_VALIDATION_RULE_TYPE);
            resp = false;
        }

        if (resp) {
          this.isCustomValidationFailed = false;
        }

        if (!resp) {
          this.errorText = this.validations[i].params.error || parameterizedString(
            logs.errorLogs.VALIDATION_FAILED,
          );
          this.isCustomValidationFailed = true;
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
      .on(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + this.iFrameName, (data) => {
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
      .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + this.iFrameName, (data: any) => {
        if (data.options.elementName === this.iFrameName) {
          if (data.options.value !== undefined) {
            // for setting value
            this.setValue(<string | undefined>data.options.value);
            if (
              !(
                this.fieldType === ELEMENTS.EXPIRATION_MONTH.name
                || this.fieldType === ELEMENTS.EXPIRATION_DATE.name
              )
            ) {
              bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + this.iFrameName, {
                name: this.iFrameName,
                event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
                value: this.getStatus(),
              });
            }
          } else if (
            data.options !== undefined
            && data.isSingleElementAPI === true
          ) {
            // for updating options
            this._emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + this.iFrameName, {
              options: data.options,
            });
          }
        }
      });

    // for connection
    // bus
    //   .target(properties.IFRAME_SECURE_ORIGIN)
    //   .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + this.iFrameName, (data:any) => {
    //     if (data.name === this.iFrameName) {
    //       if (data.options.value !== undefined) {
    //         // for setting value
    //         this.setValue(<string | undefined>data.options.value);
    //       }
    //     }
    //   });

    bus.target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE + this.iFrameName, (data) => {
        if (data.name === this.iFrameName) {
          this._emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE
            + this.iFrameName, {
            ...data,
            state: { ...this.getStatus(), error: this.errorText },
          });
        }
      });

    bus.target(this.metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR + this.iFrameName, (data) => {
        if (data.name === this.iFrameName) {
          this.doesClientHasError = data.isTriggerError as boolean;
          this.clientErrorText = data.isTriggerError ? data.clientErrorText as string : undefined;
          this._emit(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR + this.iFrameName, {
            ...data,
            state: { ...this.getStatus(), error: this.errorText },
          });
        }
      });

    // for radio buttons
    if (this.fieldType === ELEMENTS.radio.name) {
      bus
        .target(window.location.origin)
        .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + this.iFrameName, (data) => {
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
    if (this.state.isFocused) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + this.iFrameName, {
        name: this.iFrameName,
        event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
        value: this.getStatus(),
      });
    } else if (
      this.state.value
      && (this.fieldType === ELEMENTS.EXPIRATION_DATE.name
        || this.fieldType === ELEMENTS.EXPIRATION_MONTH.name
        || this.fieldType === ELEMENTS.FILE_INPUT.name
        || this.fieldType === ELEMENTS.MULTI_FILE_INPUT.name)
    ) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + this.iFrameName, {
        name: this.iFrameName,
        event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
        value: this.getStatus(),
      });
    } else if (!this.state.isEmpty) {
      bus.emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + this.iFrameName, {
        name: this.iFrameName,
        event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
        value: this.getStatus(),
      });
    }

    this._emit(ELEMENT_EVENTS_TO_CLIENT.CHANGE, {
      ...this.getStatus(),
      value: this.state.value,
    });

    // send change states for radio button(sync)
    if (inputEvent && this.fieldType === ELEMENTS.radio.name) {
      bus.target(window.location.origin).emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE
        + this.iFrameName, {
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
      isTouched: false,
      selectedCardScheme: '',
    };
  }

  destroy() {
    this.resetData();
    this.resetEvents();
  }
}
