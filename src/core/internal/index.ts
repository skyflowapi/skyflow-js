/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import $ from 'jquery';
import Client from '../../client';
import { setAttributes } from '../../iframe-libs/iframer';
import { validateElementOptions } from '../../libs/element-options';
import 'jquery-mask-plugin/dist/jquery.mask.min';
import {
  ELEMENTS,
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  COLLECT_FRAME_CONTROLLER,
  INPUT_STYLES,
  STYLE_TYPE,
  ERROR_TEXT_STYLES,
  COLLECT_ELEMENT_LABEL_DEFAULT_STYLES,
  CARD_ENCODED_ICONS,
  INPUT_WITH_ICON_STYLES,
  ElementType,
  INPUT_WITH_ICON_DEFAULT_STYLES,
  CARD_NUMBER_MASK,
  EXPIRY_DATE_MASK,
  INPUT_ICON_STYLES,
  EXPIRY_YEAR_MASK,
  COLLECT_COPY_ICON_STYLES,
  COPY_UTILS,
  ALLOWED_FOCUS_AUTO_SHIFT_ELEMENT_TYPES,
} from '../constants';
import { IFrameForm, IFrameFormElement } from './iframe-form';
import getCssClassesFromJss from '../../libs/jss-styles';
import { parameterizedString, printLog } from '../../utils/logs-helper';
import logs from '../../utils/logs';
import { detectCardType } from '../../utils/validators';
import { LogLevel, MessageType } from '../../utils/common';
import { appendZeroToOne, handleCopyIconClick, styleToString } from '../../utils/helpers';
import { ContainerType } from '../../skyflow';

export class FrameController {
  controller?: FrameController;

  controllerId: string;

  #client?: Client;

  #iFrameForm: IFrameForm;

  private clientDomain: string;

  private CLASS_NAME = 'FrameController';

  constructor(controllerId: string, logLevel: LogLevel) {
    this.clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    this.#iFrameForm = new IFrameForm(controllerId, this.clientDomain, logLevel);
    this.controllerId = controllerId;
    printLog(
      parameterizedString(
        logs.infoLogs.EMIT_COLLECT_FRAME_CONTROLLER_EVENT,
        this.CLASS_NAME,
      ),
      MessageType.LOG,
      logLevel,
    );
    bus
      // .target(this.clientDomain)
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + controllerId,
        { name: COLLECT_FRAME_CONTROLLER + controllerId },
        (data: any) => {
          const { context, ...clientMetaData } = data;
          printLog(
            parameterizedString(
              logs.infoLogs.EXECUTE_COLLECT_CONTROLLER_READY_CB,
              this.CLASS_NAME,
            ),
            MessageType.LOG,
            logLevel,
          );
          const { clientJSON } = clientMetaData;
          this.#iFrameForm.setClientMetadata(clientMetaData);
          this.#iFrameForm.setClient(Client.fromJSON(clientJSON));
          this.#iFrameForm.setContext(context);
          delete clientMetaData.clientJSON;
        },
      );
  }

  static init(uuid: string, logLevel) {
    return new FrameController(uuid, LogLevel[logLevel]);
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  options: any;

  private htmlDivElement: HTMLDivElement;

  private iFrameFormElement: IFrameFormElement;

  private domLabel?: HTMLLabelElement;

  private domInput?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLFormElement;

  public domError?: HTMLSpanElement;

  private domImg?: HTMLImageElement;

  private inputParent?: HTMLDivElement;

  private domCopy?: HTMLImageElement;

  private copyText?: string;

  private hasError?: boolean;

  private labelDiv?: HTMLDivElement;

  private isRequiredLabel?: HTMLLabelElement;

  constructor(
    iFrameFormElement: IFrameFormElement,
    options: any,
    htmlDivElement: HTMLDivElement,
  ) {
    this.iFrameFormElement = iFrameFormElement;
    this.options = options;
    this.htmlDivElement = htmlDivElement;
    this.hasError = false;
    this.mount();
  }

  // mount element onto dom
  mount = () => {
    this.iFrameFormElement.resetEvents();
    this.labelDiv = document.createElement('div');

    this.domLabel = document.createElement('label');

    this.labelDiv.setAttribute('style', styleToString(COLLECT_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.BASE]));
    this.labelDiv.append(this.domLabel);

    this.domLabel.htmlFor = this.iFrameFormElement.iFrameName;

    this.domError = document.createElement('span');

    let type;
    if (this.iFrameFormElement?.fieldType === ELEMENTS.dropdown.name) {
      type = 'select';
    } else if (this.iFrameFormElement?.fieldType === ELEMENTS.textarea.name) {
      type = 'textarea';
    } else {
      type = 'input';
    }

    this.inputParent = document.createElement('div');
    this.inputParent.style.position = 'relative';

    const inputElement = document.createElement(type);
    this.domInput = inputElement;
    this.inputParent.append(inputElement);

    if (this.iFrameFormElement.fieldType === ELEMENTS.CARD_NUMBER.name
      && this.options.enableCardIcon) {
      this.domImg = document.createElement('img');
      this.domImg.src = CARD_ENCODED_ICONS.DEFAULT;
      this.domImg.setAttribute('style', this.options.inputStyles.cardIcon ? styleToString(this.options.inputStyles.cardIcon) : INPUT_ICON_STYLES);
      this.inputParent.append(this.domImg);
    }

    if (this.options?.enableCopy) {
      this.domCopy = document.createElement('img');
      this.domCopy.src = COPY_UTILS.copyIcon;
      this.domCopy.title = COPY_UTILS.toCopy;
      this.domCopy.setAttribute('style', this.options.inputStyles.copyIcon ? styleToString(this.options.inputStyles.copyIcon) : COLLECT_COPY_ICON_STYLES);
      this.inputParent.append(this.domCopy);

      this.domCopy.onclick = () => {
        if (!this.hasError && this.copyText) {
          handleCopyIconClick(this.copyText, this.domCopy);
        }
      };
    }

    // events and todo: onclick, onescape ...???
    inputElement.onfocus = (event) => {
      this.onFocusChange(event, true);
    };
    inputElement.onblur = (event) => {
      this.onFocusChange(event, false);
    };

    // Required asterick
    if (this.options.required && this.domError) {
      this.isRequiredLabel = document.createElement('label');
      this.isRequiredLabel.textContent = ' *';
      this.isRequiredLabel.setAttribute('style', 'display:inline ; color:red');
      this.labelDiv.append(this.isRequiredLabel);
    }
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.FOCUS, (state) => {
      this.focusChange(true);
      state.isEmpty = false;
      // On Focus the error state should be false
      if (state.error && this.domError) {
        state.isValid = true;
        this.hasError = false;
        this.domError.innerText = '';
      }
      if (state) {
        this.updateStyleClasses(state);
      }
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, (state) => {
      if (state.value && this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_MONTH.name) {
        this.iFrameFormElement.setValue(appendZeroToOne(state.value));
      }
      if (state.value && this.iFrameFormElement.fieldType === ELEMENTS.FILE_INPUT.name) {
        this.focusChange(false);
      }

      this.focusChange(false);
      if (state.error && this.domError) {
        this.hasError = true;
        this.domError.innerText = state.error;
      }
      if (!state.error && this.domError) {
        this.domError.innerText = '';
        this.hasError = false;
      }
      // // FIELD IS EMPTY AND REQUIRED
      // if (this.options.required && state.value === '' && this.domError) {
      //   state.isComplete = false;
      //   state.isValid = false;
      //   state.isEmpty = true;
      //   this.hasError = true;
      //   this.domError.innerText = this.options.label ? `
      // ${parameterizedString(logs.errorLogs.REQUIRED_COLLECT_VALUE,
      //     this.options.label)}` : logs.errorLogs.DEFAULT_REQUIRED_COLLECT_VALUE;
      // } else if (this.options.required && !state.isRequired && this.domError) {
      //   // const spanElementId = this.htmlDivElement.id;
      //   // const error = document.getElementById(spanElementId);
      //   // console.log('ELE', error);
      //   this.domError.innerText = this.options.label ?
      // `${parameterizedString(logs.errorLogs.REQUIRED_COLLECT_VALUE,
      //     this.options.label)}` : logs.errorLogs.DEFAULT_REQUIRED_COLLECT_VALUE;
      // }
      // const spanElementId = this.htmlDivElement.id.split(':')[0];
      // const error = document.getElementById(`${spanElementId}-error`);
      // console.log('ELE', error);
      this.updateStyleClasses(state);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.CHANGE, (state) => {
      // On CHANGE set isEmpty to false
      state.isEmpty = false;

      if (
        state.value
        && this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        (<HTMLInputElement> this.domInput).checked = this.options.value === state.value;
      }
      if (this.options.enableCopy) {
        this.copyText = state.value;
      }
      if (this.iFrameFormElement.fieldType === ELEMENTS.CARD_NUMBER.name) {
        const cardType = detectCardType(state.value);
        if (this.options.enableCardIcon) {
          if (this.domImg) {
            this.domImg.src = CARD_ENCODED_ICONS[cardType] || 'none';
          }
        }
        const cardNumberMask = CARD_NUMBER_MASK[cardType];
        this.iFrameFormElement.setMask(cardNumberMask as string[]);
        this.applyMask();
      } else if (this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_MONTH.name
        || this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_DATE.name) {
        if (this.domInput) {
          this.domInput.value = state.value || '';
        }
      }
      if (this.iFrameFormElement.containerType === ContainerType.COMPOSABLE) {
        const elementType = this.iFrameFormElement.fieldType;
        const fieldTypeCheck = ALLOWED_FOCUS_AUTO_SHIFT_ELEMENT_TYPES
          .includes(elementType as ElementType);
        if (state.value && state.isComplete && state.isValid && fieldTypeCheck) {
          const elementList = document.getElementsByTagName('input') as any;

          let nextIndex;
          elementList.forEach((element:HTMLInputElement, index) => {
            if (element.id === this.iFrameFormElement.iFrameName
            && (index + 1) !== elementList.length) { nextIndex = index + 1; }
          });
          if (nextIndex) {
            const nextElement = elementList[nextIndex] as HTMLInputElement;
            nextElement?.focus();
          }
        }
      }
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
      if (data.options) {
        this.updateOptions(data.options);
      }
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR, (data) => {
      if (this.domError && data.isTriggerError && data.clientErrorText) {
        this.domError.innerText = data.clientErrorText;
      } else if (this.domError && (!data.isTriggerError)) {
        this.domError.innerText = data.state.error || '';
        if ((data.state.isEmpty || data.state.isValid) && this.domError) {
          this.domError.innerText = '';
        } else if (!data.state.isEmpty && !data.state.isValid && this.domError) {
          this.domError.innerText = data.state.error;
        }
      }
      this.updateStyleClasses(data.state);
    });

    // this.setupInputField();
    this.updateOptions(this.options);

    this.updateParentDiv(this.htmlDivElement);

    this.updateStyleClasses(this.iFrameFormElement.getStatus());
  };

  setupInputField(newValue: boolean = false) {
    // todo: attr for textarea
    const attr = {
      ...ELEMENTS[this.iFrameFormElement.fieldType || ''].attributes,
      name: this.iFrameFormElement.fieldName,
      id: this.iFrameFormElement.iFrameName,
      placeholder: this.options.placeholder,
      disabled: this.options.disabled ? true : undefined,
      readOnly: this.options.readOnly ? true : undefined,
      required: this.options.required ? true : undefined,
    };

    if (
      this.domInput
      && this.iFrameFormElement.fieldType === ELEMENTS.dropdown.name
    ) {
      this.domInput.innerHTML = '';
      this.options.options.forEach((option) => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        this.domInput?.append(optionElement);
      });
    }

    setAttributes(this.domInput, attr);

    let newInputValue = this.iFrameFormElement.getValue();

    // HTML don't support validity on radio
    if (this.iFrameFormElement.getValue() === undefined) {
      if (
        this.iFrameFormElement.fieldType === ELEMENTS.checkbox.name
        || this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        // this.iFrameFormElement.setValue("");
        newInputValue = '';
      } else if (this.options.value) {
        // this.iFrameFormElement.setValue(this.options.value);
        newInputValue = this.options.value;
      }
    }

    if (
      newValue
      && this.iFrameFormElement.fieldType !== ELEMENTS.checkbox.name
      && this.iFrameFormElement.fieldType !== ELEMENTS.radio.name
    ) {
      newInputValue = this.options.value;
    }

    if (this.domInput) {
      if (
        this.iFrameFormElement.fieldType === ELEMENTS.checkbox.name
        || this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        this.domInput.value = this.options.value;
        (<HTMLInputElement> this.domInput).checked = this.options.value === newInputValue;
      } else {
        this.domInput.value = newInputValue || '';
      }

      if (
        this.iFrameFormElement.mask
        || this.iFrameFormElement.replacePattern
      ) {
        $(document).ready(() => {
          $(this.domInput as any).trigger('input');
        });
      }
    }

    this.iFrameFormElement.setValue(
      newInputValue,
      this.domInput?.checkValidity(),
    );
  }

  updateParentDiv = (newDiv: HTMLDivElement) => {
    this.htmlDivElement = newDiv;
    if (Object.prototype.hasOwnProperty.call(this.options, 'label')) this.htmlDivElement.append(this.labelDiv || '');
    this.htmlDivElement.append(this.inputParent || '');
    if (this.iFrameFormElement.containerType === ContainerType.COLLECT) { this.htmlDivElement.append(this.domError || ''); }
  };

  setValue = (value) => {
    if (this.domInput) {
      this.domInput.value = value;
    }
  };

  // events from HTML
  onFocusChange = (event: FocusEvent, focus: boolean) => {
    // emit event to iFrameFormElement
    this.iFrameFormElement.onFocusChange(focus);
  };

  onInputChange = (event: Event) => {
    if (this.iFrameFormElement.fieldType === ELEMENTS.FILE_INPUT.name) {
      const target = event.target as HTMLFormElement;
      this.iFrameFormElement.setValue(target.files[0], target.checkValidity());
      this.focusChange(true);
    } else {
      const target = event.target as HTMLInputElement;
      this.iFrameFormElement.setValue(target.value, target.checkValidity());
    }
  };

  focusChange = (focus: boolean) => {
    if (focus) this.domInput?.focus();
    else this.domInput?.blur();
  };

  destroy = () => {};

  injectInputStyles(styles, preText: string = '') {
    const customStyles: Record<string, any> = {};
    Object.values(STYLE_TYPE).forEach((type) => {
      if (Object.prototype.hasOwnProperty.call(styles, type)) {
        customStyles[type] = styles[type];
      }
    });
    getCssClassesFromJss(customStyles, `${preText}-${this.options.name}`);
  }

  updateStyleClasses(state: {
    isFocused: boolean;
    isValid: boolean;
    isEmpty: boolean;
    isComplete: boolean;
    value: string | Blob | undefined;
  }) {
    const classes: string[] = [];
    const labelClasses: string[] = [];

    if (state.isFocused) {
      classes.push(STYLE_TYPE.FOCUS);
      labelClasses.push(STYLE_TYPE.FOCUS);
    }
    if (this.options.required && state.value === '' && !state.isFocused) {
      classes.push(STYLE_TYPE.INVALID);
    }

    if (!this.options.required && !state.isEmpty && state.isFocused) {
      classes.push(STYLE_TYPE.FOCUS);
    }
    if (state.isEmpty) {
      classes.push(STYLE_TYPE.EMPTY);
    } else {
      if (!state.isValid) {
        classes.push(STYLE_TYPE.INVALID);
      }
      if (!state.isFocused && state.isComplete) {
        classes.push(STYLE_TYPE.COMPLETE);
      }
    }

    this.setClass(classes, this.domInput);
    this.setClass(labelClasses, this.domLabel, 'label');

    if (!state.isValid) this.setClass([], this.domError, 'error');
  }

  setClass(types: string[], dom?: HTMLElement, preText: string = '') {
    if (dom) {
      let classes = ['base'];
      Object.values(STYLE_TYPE).forEach((type) => {
        if (types.includes(type)) classes.push(type);
      });
      classes = classes.map(
        (type) => `SkyflowElement-${preText}-${this.options.name}-${type}`,
      );
      dom.className = classes.join(' ');
    }
  }

  updateOptions(options) {
    const newOptions = { ...this.options, ...options };
    validateElementOptions(
      this.iFrameFormElement.fieldType,
      this.options,
      newOptions,
    );

    this.options = newOptions;
    if (options.inputStyles) {
      // update element styles
      options.inputStyles.base = {
        ...INPUT_STYLES,
        ...options.inputStyles.base,
      };
      if (options.elementType === ElementType.CARD_NUMBER && this.options.enableCardIcon) {
        options.inputStyles.base = {
          ...INPUT_WITH_ICON_STYLES,
          ...options.inputStyles.base,
        };
      }

      this.injectInputStyles(options.inputStyles);
    } else if (options.elementType === ElementType.CARD_NUMBER && this.options.enableCardIcon) {
      this.injectInputStyles({ base: { ...INPUT_WITH_ICON_DEFAULT_STYLES } });
    }
    if (Object.prototype.hasOwnProperty.call(options, 'label')) {
      if (options?.labelStyles) {
        const labelStyles = {};
        labelStyles[STYLE_TYPE.BASE] = {
          ...COLLECT_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.BASE],
        };
        if (options.labelStyles?.[STYLE_TYPE.BASE]) {
          labelStyles[STYLE_TYPE.BASE] = {
            ...labelStyles[STYLE_TYPE.BASE],
            ...options.labelStyles[STYLE_TYPE.BASE],
          };
        }
        if (options.labelStyles?.[STYLE_TYPE.FOCUS]) {
          labelStyles[STYLE_TYPE.FOCUS] = {
            ...options.labelStyles[STYLE_TYPE.FOCUS],
          };
        }
        this.injectInputStyles(labelStyles, 'label');
      } else {
        this.injectInputStyles(COLLECT_ELEMENT_LABEL_DEFAULT_STYLES, 'label');
      }
    }
    if (
      options?.errorTextStyles
      && Object.prototype.hasOwnProperty.call(options.errorTextStyles, STYLE_TYPE.BASE)
    ) {
      const errorStyles = {
        [STYLE_TYPE.BASE]: {
          ...ERROR_TEXT_STYLES,
          ...options.errorTextStyles[STYLE_TYPE.BASE],
        },
      };
      this.injectInputStyles(errorStyles, 'error');
    } else {
      const errorStyles = {
        [STYLE_TYPE.BASE]: {
          ...ERROR_TEXT_STYLES,
        },
      };
      this.injectInputStyles(errorStyles, 'error');
    }

    if (this.domLabel) this.domLabel.textContent = this.options.label;

    $(document).ready(() => {
      const id: any = this.domInput || `#${this.iFrameFormElement.iFrameName}`;

      this.iFrameFormElement.setValidation(this.options.validations);
      this.iFrameFormElement.setReplacePattern(this.options.replacePattern);
      if (options.elementType === ElementType.EXPIRATION_DATE) {
        this.iFrameFormElement.setFormat(options.format);
        this.iFrameFormElement.setMask(EXPIRY_DATE_MASK[options.format] as string[]);
      } else if (options.elementType === ElementType.EXPIRATION_YEAR) {
        this.iFrameFormElement.setFormat(options.format);
        this.iFrameFormElement.setMask(EXPIRY_YEAR_MASK[options.format] as string[]);
      } else {
        this.iFrameFormElement.setMask(this.options.mask);
      }

      // const { mask } = this.iFrameFormElement;
      $(id).off('input');
      (<any>$).jMaskGlobals.translation = {};
      (<any>$).jMaskGlobals.clearIfNotMatch = true;

      $(id).unmask();
      this.applyMask();

      if (this.domInput) {
        const { replacePattern } = this.iFrameFormElement;
        if (replacePattern) {
          $(id).on('input', (event) => {
            event.target.value = event.target.value.replace(
              replacePattern[0],
              replacePattern[1],
            );
          });
        }

        $(id).on('input', this.onInputChange);
      }

      this.setupInputField(
        options.value !== undefined
          && options.value !== null
          && options.value !== this.iFrameFormElement.getValue(),
      );
    });
  }

  private applyMask() {
    const id: any = this.domInput || `#${this.iFrameFormElement.iFrameName}`;
    const { mask } = this.iFrameFormElement;
    if (mask) {
      const translation = {};
      Object.keys(mask[2]).forEach((key) => {
        translation[key] = { pattern: mask[2][key] };
      });

      $(id).mask(mask[0], {
        translation,
      });
    }
  }
}
