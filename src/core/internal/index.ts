/* eslint-disable max-len */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import Client from '../../client';
import { setAttributes } from '../../iframe-libs/iframer';
import { validateElementOptions } from '../../libs/element-options';
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
  INPUT_KEYBOARD_EVENTS,
  CUSTOM_ROW_ID_ATTRIBUTE,
  DROPDOWN_STYLES,
  DROP_DOWN_ICON,
  DROPDOWN_ICON_STYLES,
  CardTypeValues,
} from '../constants';
import { IFrameForm, IFrameFormElement } from './iframe-form';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../libs/jss-styles';
import { parameterizedString, printLog } from '../../utils/logs-helper';
import logs from '../../utils/logs';
import { detectCardType } from '../../utils/validators';
import { LogLevel, MessageType } from '../../utils/common';
import {
  addSeperatorToCardNumberMask,
  appendMonthFourDigitYears,
  appendMonthTwoDigitYears,
  appendZeroToOne,
  domReady, getAtobValue, getMaskedOutput, getValueFromName, handleCopyIconClick, styleToString,
} from '../../utils/helpers';
import { ContainerType } from '../../skyflow';

export class FrameController {
  controller?: FrameController;

  controllerId: string;

  #iFrameForm: IFrameForm;

  private clientDomain: string;

  private CLASS_NAME = 'FrameController';

  constructor(controllerId: string, logLevel: LogLevel) {
    const encodedClientDomain = getValueFromName(window.name, 3);
    const clientDomain = getAtobValue(encodedClientDomain);
    this.clientDomain = document.referrer.split('/').slice(0, 3).join('/') || clientDomain;
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

  private dropdownIcon?: HTMLImageElement;

  private dropdownSelect?: HTMLSelectElement;

  private actualValue = '';

  private excludeFormatIndex: number[] = [];

  private selectionStart?: number = undefined;

  private selectionEnd?: number = undefined;

  private selectedData?: number = undefined;

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
    this.iFrameFormElement.fieldName = options.column;
    this.iFrameFormElement.tableName = options.table;
    this.iFrameFormElement.state.name = options.column;
    if (Object.prototype.hasOwnProperty.call(options, 'preserveFileName')) {
      this.iFrameFormElement.preserveFileName = options?.preserveFileName;
    }
    if (Object.prototype.hasOwnProperty.call(options, 'allowedFileType')) {
      this.iFrameFormElement.allowedFileType = options?.allowedFileType;
    }
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
    inputElement.setAttribute(CUSTOM_ROW_ID_ATTRIBUTE, this.htmlDivElement?.id?.split(':')[0] || '');
    this.inputParent.append(inputElement);

    if (this.iFrameFormElement.fieldType === ELEMENTS.CARD_NUMBER.name
      && this.options.enableCardIcon) {
      this.domImg = document.createElement('img');
      this.domImg.src = CARD_ENCODED_ICONS[this.iFrameFormElement?.cardType]
        || CARD_ENCODED_ICONS.DEFAULT;
      this.domImg.setAttribute('style', this.options?.inputStyles?.cardIcon ? styleToString(this.options.inputStyles.cardIcon) : INPUT_ICON_STYLES);

      this.inputParent.append(this.domImg); // added card

      this.dropdownIcon = document.createElement('img');
      this.dropdownIcon.src = DROP_DOWN_ICON;
      this.dropdownIcon.setAttribute('style', this.options?.inputStyles?.dropdownIcon ? (DROPDOWN_ICON_STYLES + styleToString(this.options.inputStyles.dropdownIcon)) : DROPDOWN_ICON_STYLES);

      this.dropdownSelect = document.createElement('select');
      this.dropdownSelect.setAttribute('style', this.options?.inputStyles?.dropdown ? (DROPDOWN_STYLES + styleToString(this.options.inputStyles.dropdown)) : DROPDOWN_STYLES);

      this.dropdownSelect.addEventListener('change', (event:any) => {
        event.preventDefault();
        if (this.domImg && CARD_ENCODED_ICONS[event.target.value]) {
          this.domImg.src = CARD_ENCODED_ICONS[event.target.value]
            || CARD_ENCODED_ICONS.DEFAULT;
          this.iFrameFormElement.onDropdownSelect(event.target.value);
        }
      });
    }

    if (this.options?.enableCopy) {
      this.domCopy = document.createElement('img');
      this.domCopy.src = COPY_UTILS.copyIcon;
      this.domCopy.title = COPY_UTILS.toCopy;
      this.domCopy.setAttribute('style', this.options?.inputStyles?.copyIcon ? styleToString(this.options.inputStyles.copyIcon) : COLLECT_COPY_ICON_STYLES);
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
      this.isRequiredLabel.className = `SkyflowElement-label-${this.options.elementName}-${STYLE_TYPE.REQUIRED_ASTERISK}`;
      this.labelDiv.append(this.isRequiredLabel);
    }
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.FOCUS, (state) => {
      this.focusChange(true);
      state.isEmpty = !state.value;
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
      this.updateStyleClasses(state);
      if (state.value && this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_MONTH.name) {
        const { isAppended, value } = appendZeroToOne(state.value);
        if (isAppended) {
          this.iFrameFormElement.setValue(value);
        }
      }

      if (state.value && this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_DATE.name) {
        if (this.iFrameFormElement.format === 'YYYY/MM') {
          const { isAppended, value } = appendMonthFourDigitYears(state.value);
          if (isAppended) {
            this.iFrameFormElement.setValue(value);
          }
        } else if (this.iFrameFormElement.format === 'YY/MM') {
          const { isAppended, value } = appendMonthTwoDigitYears(state.value);
          if (isAppended) {
            this.iFrameFormElement.setValue(value);
          }
        }
      }
    });

    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.CHANGE, (state) => {
      if (!state.isEmpty && state.isValid && this.domCopy) {
        this.domCopy.style.display = 'block';
      } else if (this.domCopy) {
        this.domCopy.style.display = 'none';
      }

      // On CHANGE set isEmpty to false
      state.isEmpty = !state.value;

      if (
        state.value
        && this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        (<HTMLInputElement> this.domInput).checked = this.options.value === state.value;
      }
      if (this.options.enableCopy) {
        this.copyText = this.iFrameFormElement.getUnformattedValue();
      }
      if (this.iFrameFormElement.fieldType === ELEMENTS.CARD_NUMBER.name) {
        const cardType = detectCardType(state.value);
        if (cardType !== this.iFrameFormElement.cardType) {
          if (this.options.enableCardIcon) {
            if (this.domImg) {
              this.domImg.src = CARD_ENCODED_ICONS[cardType] || 'none';
              this.iFrameFormElement.cardType = cardType;
            }
          }
        }
        const cardNumberMask = addSeperatorToCardNumberMask(
          CARD_NUMBER_MASK[cardType],
          this.options?.cardSeperator,
        );
        this.iFrameFormElement.setMask(cardNumberMask as string[]);
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
          const inputElements = document.getElementsByTagName('input') as any;
          let elementList = [];
          if (inputElements) {
            elementList = Array.from(inputElements);
          }

          let nextIndex;
          elementList?.forEach((element:HTMLInputElement, index) => {
            if (element.id === this.iFrameFormElement.iFrameName
            && (index + 1) !== elementList.length) { nextIndex = index + 1; }
          });
          if (nextIndex) {
            const nextElement = elementList[nextIndex] as HTMLInputElement;
            nextElement?.focus();
          }
        }
      }

      if (
        !state.isFocused
        && (this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_DATE.name
          || this.iFrameFormElement.fieldType === ELEMENTS.EXPIRATION_MONTH.name)
      ) {
        this.updateStyleClasses(state);
      }
      if (this.iFrameFormElement.mask) {
        this.applyMask();
      }
    });

    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
      if (data.options) {
        const {
          validations,
          table,
          column,
          label,
          placeholder,
          inputStyles,
          labelStyles,
          errorTextStyles,
          skyflowID,
          cardMetadata,
        } = data.options;
        if (validations) {
          this.iFrameFormElement.setValidation(validations);
        }
        if (table) {
          this.iFrameFormElement.tableName = table;
        }
        if (column) {
          this.iFrameFormElement.state.name = column;
        }
        if (label) {
          if (this.domLabel) {
            this.domLabel.textContent = label;
            this.options.label = label;
            this.iFrameFormElement.label = label;
            this.updateParentDiv(this.htmlDivElement);
          }
        }
        if (placeholder) {
          this.domInput?.setAttribute('placeholder', placeholder);
        }
        if (inputStyles) {
          this.injectInputStyles(inputStyles);
        }
        if (errorTextStyles) {
          this.injectInputStyles(errorTextStyles, 'error');
        }
        if (labelStyles) {
          this.injectInputStyles(labelStyles, 'label');
        }
        if (skyflowID) {
          this.iFrameFormElement.skyflowID = skyflowID;
        }
        if (cardMetadata?.scheme) {
          if (Array.isArray(cardMetadata.scheme) && cardMetadata.scheme.length >= 2) {
            this.appendDropdown(cardMetadata.scheme);
            if (this.domImg && CARD_ENCODED_ICONS[cardMetadata.scheme[0]]) {
              this.domImg.src = CARD_ENCODED_ICONS[cardMetadata.scheme[0]];
              // Fire change event to update selectedCardScheme
              this.iFrameFormElement.onDropdownSelect(cardMetadata.scheme[0]);
            }
          } else if (this.dropdownIcon && this.dropdownSelect && this.domInput && this.domImg) {
            this.domInput.style.textIndent = '36px';
            this.iFrameFormElement.onDropdownSelect('');
            this.domImg.src = CARD_ENCODED_ICONS[this.iFrameFormElement?.cardType]
            || CARD_ENCODED_ICONS.DEFAULT;
            if (this.inputParent?.contains(this.dropdownIcon)) {
              this.inputParent?.removeChild(this.dropdownIcon);
            }
            if (this.inputParent?.contains(this.dropdownSelect)) {
              this.inputParent?.removeChild(this.dropdownSelect);
            }
          }
        }
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

    this.iFrameFormElement.on(
      ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE,
      (data) => {
        if (
          this.domError && data.customErrorText
          && !this.iFrameFormElement.doesClientHasError
        ) {
          if (data.state.isEmpty && data.state.isRequired) {
            this.domError.innerText = data.customErrorText;
          } else if (!data.isEmpty && !data.state.isValid) {
            if (
              data.state.error
              && !this.iFrameFormElement.validations?.length
            ) {
              this.domError.innerText = data.customErrorText;
            } else if (
              data.state.error
              && this.iFrameFormElement.validations?.length
              && this.iFrameFormElement.isCustomValidationFailed
            ) {
              this.domError.innerText = data.state.error;
            } else {
              this.domError.innerText = data.customErrorText;
            }
          } else if (data.state.isEmpty || data.state.isValid) {
            this.domError.innerText = '';
          }
        }
        this.updateStyleClasses(data.state);
      },
    );

    // this.setupInputField();
    this.updateOptions(this.options);

    this.updateParentDiv(this.htmlDivElement);

    bus
      .emit(ELEMENT_EVENTS_TO_CLIENT.MOUNTED, {
        name: this.iFrameFormElement.iFrameName,
      });

    this.updateStyleClasses(this.iFrameFormElement.getStatus());
  };

  setupInputField(newValue: boolean = false) {
    // todo: attr for textarea
    const attr = {
      ...ELEMENTS[this.iFrameFormElement.fieldType || ''].attributes,
      name: this.iFrameFormElement.fieldName,
      id: this.iFrameFormElement.iFrameName,
      placeholder: this.options.placeholder,
      accept: this.options.accept,
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
        domReady(() => {
          const domInput = this.domInput;
          if (domInput) {
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            domInput.dispatchEvent(inputEvent);
          }
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
    if (Object.prototype.hasOwnProperty.call(this.options, 'label') && this.options.label) this.htmlDivElement.append(this.labelDiv || '');
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
      const { mask } = this.iFrameFormElement;
      const value = this.domInput?.value || this.iFrameFormElement.getValue();
      let updatedMask;
      if (mask) {
        updatedMask = [...mask];
      }
      if (
        this.iFrameFormElement.fieldType === ELEMENTS.CARD_NUMBER.name
        && this.iFrameFormElement.mask
      ) {
        let cardType = '';
        if (Object.prototype.hasOwnProperty.call(this.options, 'masking') && (this.options.masking === true)) {
          if (this.actualValue === '' && value.length > 0) {
            cardType = detectCardType(value);
          } else {
            cardType = detectCardType(this.actualValue);
          }
        } else {
          cardType = detectCardType(value);
        }
        const cardNumberMask = addSeperatorToCardNumberMask(
          CARD_NUMBER_MASK[cardType],
          this.options?.cardSeperator,
        );
        updatedMask[0] = cardNumberMask[0];
        updatedMask[1] = null;
        updatedMask[2] = cardNumberMask[1];
        this.iFrameFormElement.setMask(cardNumberMask as string[]);
      }
      if (updatedMask) {
        const translation = {};
        if (updatedMask[2]) {
          Object.keys(updatedMask[2]).forEach((key) => {
            translation[key] = { pattern: updatedMask[2][key] };
          });
        }
        if (value.length === 0 && this.actualValue.length > 0) {
          this.actualValue = '';
        }
        if (Object.prototype.hasOwnProperty.call(this.options, 'masking') && (this.options.masking === true) && this.actualValue !== undefined) {
          const excludeFormatIndex = this.getNonTranslatedIndexes(updatedMask[0], translation);
          this.excludeFormatIndex = excludeFormatIndex;
          const input = target;
          // eslint-disable-next-line @typescript-eslint/no-shadow
          let cursorPosition = input.selectionStart;
          const currentValue = input.value;
          let rangeMaskedOutput = '';
          const { formattedOutput, maskedOutput: previousMaskedValue } = getMaskedOutput(
            this.actualValue,
            updatedMask[0],
            translation,
            this.options.maskingChar,
          );

          rangeMaskedOutput = previousMaskedValue;
          const isCursorAtEnd = cursorPosition === currentValue.length;
          if (this.actualValue.length === 0 && currentValue.length > 0) {
            this.actualValue = currentValue;
          } else if (this.actualValue.length > 0 && currentValue.length === 0) {
            this.actualValue = currentValue;
          } else if (currentValue.length > formattedOutput.length && cursorPosition != null && currentValue.length <= updatedMask[0].length) {
            const addedChar = currentValue[cursorPosition - 1];
            const count = this.countExcludedDigits(excludeFormatIndex, currentValue.slice(0, cursorPosition - 1).length);
            cursorPosition -= count;
            this.actualValue = this.actualValue.substring(0, cursorPosition - 1)
            + addedChar
            + this.actualValue.substring(cursorPosition - 1);
          } else if (this.selectionStart !== undefined && this.selectionEnd !== undefined && this.selectedData !== undefined && cursorPosition != null) {
            const startIgnoreCount = this.countExcludedDigits(excludeFormatIndex, currentValue.slice(0, this.selectionStart).length - 1);
            const count = this.countExcludedDigits(excludeFormatIndex, currentValue.slice(0, this.selectionEnd).length - 1);
            // const actualEnd = this.countExcludedDigits(excludeFormatIndex, currentValue.length - 1);
            const newActual = this.actualValue.substring(0, this.selectionStart - startIgnoreCount)
                                      + this.selectedData
                                      + this.actualValue.substring(this.selectionEnd - count);
            if (currentValue.length < (newActual.length)) {
              input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
              const removedCount = rangeMaskedOutput.length - currentValue.length;
              this.actualValue = this.handleDeletion(this.actualValue, rangeMaskedOutput, excludeFormatIndex, cursorPosition, cursorPosition + removedCount);
            } else {
              this.actualValue = newActual;
            }

            this.selectedData = undefined;
            this.selectionStart = undefined;
            this.selectionEnd = undefined;
          }
          else if (cursorPosition != null) {
            // if (input instanceof HTMLInputElement && typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            // }
            const removedCount = rangeMaskedOutput.length - currentValue.length;
            this.actualValue = this.handleDeletion(this.actualValue, rangeMaskedOutput, excludeFormatIndex, cursorPosition, cursorPosition + removedCount);
          }
          const { formattedOutput: newFormattedOutput, maskedOutput: newMaskedOutput } = getMaskedOutput(
            this.actualValue,
            updatedMask[0],
            translation,
            this.options.maskingChar,
          );
          rangeMaskedOutput = newMaskedOutput;
          if (cursorPosition != null) {
            const newCursorPosition = isCursorAtEnd
              ? newFormattedOutput.length
              : cursorPosition + (newFormattedOutput.length - formattedOutput.length);
            // if (input instanceof HTMLInputElement && typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(newCursorPosition, newCursorPosition);
            // }
          }
          if (newFormattedOutput.length >= value.length) {
            this.iFrameFormElement.setValue(newFormattedOutput, target?.checkValidity());
            target.value = rangeMaskedOutput;
          } else if (newFormattedOutput === '' && target?.value === '') {
            target.value = rangeMaskedOutput;
            this.iFrameFormElement.setValue(target?.value, target?.checkValidity());
          } else if (newFormattedOutput.length <= updatedMask[0].length) {
            target.value = rangeMaskedOutput;
            this.iFrameFormElement.setValue(newFormattedOutput, target?.checkValidity());
          }
        } else {
          const { formattedOutput: output } = getMaskedOutput(target?.value, updatedMask[0], translation);
          if (output.length >= value.length) {
            this.iFrameFormElement.setValue(output, target?.checkValidity());
          } else if (output === '' && target?.value === '') {
            this.iFrameFormElement.setValue(target?.value, target?.checkValidity());
          } else {
            target.value = output;
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (Object.prototype.hasOwnProperty.call(this.options, 'masking') && (this.options.masking === true)) {
          const input = event.target as HTMLInputElement;
          const cursorPosition = input.selectionStart;
          const currentValue = input.value;

          if (currentValue.length > this.actualValue.length && cursorPosition != null) {
            const diff = currentValue.length - this.actualValue.length;
            if (diff > 1) {
              const pastedData = currentValue.substring(cursorPosition - diff, cursorPosition);
              // Modify the pasted data as needed
              this.actualValue = this.actualValue.substring(0, cursorPosition - diff)
                    + pastedData
                    + this.actualValue.substring(cursorPosition - diff);
            } else {
              this.actualValue = this.actualValue.substring(0, cursorPosition - 1)
                    + currentValue[cursorPosition - 1]
                    + this.actualValue.substring(cursorPosition - 1);
            }
          } else {
            const removedCount = this.actualValue.length - currentValue.length;
            if (removedCount > 0 && cursorPosition !== null) {
              this.actualValue = this.actualValue.substring(0, cursorPosition)
                    + this.actualValue.substring(cursorPosition + removedCount);
            }
          }
          input.value = this.options.maskingChar.repeat(this.actualValue.length);
          // if (input instanceof HTMLInputElement && typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(cursorPosition, cursorPosition);
          // }
          this.iFrameFormElement.setValue(this.actualValue, target?.checkValidity());
        } else {
          this.iFrameFormElement.setValue(target?.value, target?.checkValidity());
        }
      }
    }
  };

  countExcludedDigits = (excludeFormatIndex: number[], length: number): number => {
    const filteredIndexes = excludeFormatIndex.filter((index) => index < length);

    return filteredIndexes.length;
  };

  getNonTranslatedIndexes = (
    format: string,
    translation: { [key: string]: string },
  ): number[] => {
    const nonTranslatedIndexes: number[] = [];

    // Loop through the format string
    for (let i = 0; i < format.length; i += 1) {
      const formatChar = format[i];

      // If the format character doesn't have a translation, add the index
      if (!translation[formatChar]) {
        nonTranslatedIndexes.push(i);
      }
    }

    return nonTranslatedIndexes;
  };

  handleDeletion = (
    actualValue,
    maskedValue,
    excludeFormatIndexes,
    selectionStart,
    selectionEnd,
  ) => {
    const filteredIndexes: number[] = [];

    for (let i = selectionStart; i < selectionEnd; i += 1) {
      if (!excludeFormatIndexes.includes(i)) {
        filteredIndexes.push(i);
      } else {
        selectionEnd -= 1;
      }
    }
    let newActualValue = '';
    let actualIndex = 0;

    for (let i = 0; i < maskedValue.length; i += 1) {
      if (!excludeFormatIndexes.includes(i)) {
        if (!filteredIndexes.includes(i)) {
          newActualValue += actualValue[actualIndex];
        }
        actualIndex += 1;
      }
    }
    return newActualValue;
  };

  findPreviousElement = (currentInput) => {
    let elementList = [];
    const inputElements = document.getElementById(currentInput.getAttribute(CUSTOM_ROW_ID_ATTRIBUTE) || '')?.getElementsByTagName('input') as any;
    if (inputElements) {
      elementList = Array.from(inputElements);
    }
    let prevIndex;
    elementList.forEach((element:HTMLInputElement, index) => {
      if (element.id === this.iFrameFormElement.iFrameName
      && (index - 1) !== -1) { prevIndex = index - 1; }
    });
    return elementList[prevIndex] as HTMLInputElement;
  };

  findNextElement = (currentInput) => {
    let elementList = [];
    const inputElements = document.getElementById(currentInput.getAttribute(CUSTOM_ROW_ID_ATTRIBUTE) || '')?.getElementsByTagName('input') as any;
    if (inputElements) {
      elementList = Array.from(inputElements);
    }
    let nextIndex;
    elementList.forEach((element:HTMLInputElement, index) => {
      if (element.id === this.iFrameFormElement.iFrameName
      && (index + 1) !== elementList.length) { nextIndex = index + 1; }
    });
    return elementList[nextIndex] as HTMLInputElement;
  };

  onSubmit = () => {
    bus
      .emit(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT, {
        name: this.iFrameFormElement.iFrameName,
        event: ELEMENT_EVENTS_TO_CLIENT.SUBMIT,
      });
  };

  onArrowKeys = (keyBoardEvent: KeyboardEvent) => {
    const currentInput = keyBoardEvent?.target as HTMLInputElement;
    const cursorPosition = currentInput.selectionEnd;

    switch (keyBoardEvent?.key) {
      case INPUT_KEYBOARD_EVENTS.RIGHT_ARROW:
        if (cursorPosition === currentInput.value.length) {
          const nextElement = this.findNextElement(currentInput);
          if (nextElement) {
            nextElement?.focus();
            keyBoardEvent.preventDefault();
          }
        }
        break;

      case INPUT_KEYBOARD_EVENTS.LEFT_ARROW:
        if (cursorPosition === 0) {
          const previousElement = this.findPreviousElement(currentInput);
          if (previousElement) {
            previousElement?.focus();
            keyBoardEvent.preventDefault();
          }
        }
        break;

      case INPUT_KEYBOARD_EVENTS.BACKSPACE:
        if (cursorPosition === 0) {
          const previousElement = this.findPreviousElement(currentInput);
          if (previousElement) {
            previousElement?.focus();
            keyBoardEvent.preventDefault();
          }
        }
        break;

      case INPUT_KEYBOARD_EVENTS.ENTER:
        this.onSubmit();
        keyBoardEvent.preventDefault();
        break;

      default: break;
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
      if (type === STYLE_TYPE.GLOBAL) {
        if (styles && styles[type]) {
          generateCssWithoutClass(styles[type]);
        }
      } else if (Object.prototype.hasOwnProperty.call(styles, type)) {
        customStyles[type] = styles[type];
      }
    });
    getCssClassesFromJss(customStyles, `${preText}-${this.options.elementName}`);
  }

  updateStyleClasses(state: {
    isFocused: boolean;
    isValid: boolean;
    isEmpty: boolean;
    isComplete: boolean;
    value: string | Blob | undefined;
    isTouched: boolean;
  }) {
    const classes: string[] = [];
    const labelClasses: string[] = [];

    if (state.isFocused) {
      classes.push(STYLE_TYPE.FOCUS);
      labelClasses.push(STYLE_TYPE.FOCUS);
    }
    if (state.isTouched && !state.isFocused && !state.isValid) {
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
        (type) => `SkyflowElement-${preText}-${this.options.elementName}-${type}`,
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
    if (options?.inputStyles) {
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
        labelStyles[STYLE_TYPE.REQUIRED_ASTERISK] = {
          ...COLLECT_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.REQUIRED_ASTERISK],
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
        if (options.labelStyles?.[STYLE_TYPE.REQUIRED_ASTERISK]) {
          labelStyles[STYLE_TYPE.REQUIRED_ASTERISK] = {
            ...labelStyles[STYLE_TYPE.REQUIRED_ASTERISK],
            ...options.labelStyles[STYLE_TYPE.REQUIRED_ASTERISK],
          };
        }
        if (options.labelStyles?.[STYLE_TYPE.GLOBAL]) {
          labelStyles[STYLE_TYPE.GLOBAL] = {
            ...options.labelStyles[STYLE_TYPE.GLOBAL],
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

      if (options?.errorTextStyles?.[STYLE_TYPE.GLOBAL]) {
        errorStyles[STYLE_TYPE.GLOBAL] = {
          ...options?.errorTextStyles?.[STYLE_TYPE.GLOBAL],
        };
      }

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

    domReady(() => {
      const id: any = this.domInput;
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

      // $(id).off('input');

      // $(id).unmask();
      this.applyMask();

      if (this.domInput) {
        const { replacePattern } = this.iFrameFormElement;
        if (replacePattern) {
          id.addEventListener('input', (event) => {
            event.target.value = event.target.value.replace(
              replacePattern[0],
              replacePattern[1],
            );
          });
        }
        id.addEventListener('paste', (event) => {
          this.selectionEnd = event.target.selectionEnd;
          this.selectionStart = event.target.selectionStart;
          this.selectedData = event.clipboardData.getData('text/plain');
        });
        id.addEventListener('input', this.onInputChange);
        id.addEventListener('keydown', this.onArrowKeys);
      }

      this.setupInputField(
        options.value !== undefined
          && options.value !== null
          && options.value !== this.iFrameFormElement.getValue(),
      );
    });
  }

  private applyMask() {
    const { mask } = this.iFrameFormElement;
    // let output = '';x
    if (mask) {
      const translation = {};
      Object.keys(mask[2]).forEach((key) => {
        translation[key] = { pattern: mask[2][key] };
      });
      try {
        const value = this.domInput?.value || this.iFrameFormElement.getValue();
        if (this.domInput) {
          if (value?.length === 0 && this.actualValue.length > 0) {
            this.actualValue = '';
          }

          if (Object.prototype.hasOwnProperty.call(this.options, 'masking') && (this.options.masking === true)) {
            // eslint-disable-next-line @typescript-eslint/no-shadow, prefer-const
            let { maskedOutput } = getMaskedOutput(this.actualValue, mask[0], translation, this.options.maskingChar);
            this.domInput.value = maskedOutput;
          } else {
            const { formattedOutput } = getMaskedOutput(value, mask[0], translation);
            this.domInput.value = formattedOutput;
          }
          if (!this.domInput.getAttribute('maxlength')) { this.domInput.setAttribute('maxlength', mask[0].length); }
        }
      } catch (err) {
        printLog(parameterizedString(logs.warnLogs.INVALID_INPUT_TRANSLATION,
          this.iFrameFormElement.fieldType), MessageType.WARN,
        (this.iFrameFormElement?.context?.logLevel || LogLevel.ERROR));
      }
    }
  }

  private appendDropdown(cardBrandList:any) {
    if (this.dropdownSelect) {
      this.dropdownSelect.innerHTML = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = 'unknown';
      defaultOption.text = 'Select card brand (optional)';
      defaultOption.disabled = true;
      this.dropdownSelect.append(defaultOption);

      cardBrandList.forEach((cardOption) => {
        const option = document.createElement('option');
        option.value = cardOption;
        option.text = CardTypeValues[cardOption];
        this.dropdownSelect?.append(option);
      });

      if (this.inputParent && this.dropdownIcon && this.domInput && this.domImg) {
        this.dropdownSelect.selectedIndex = 0;
        this.domInput.style.textIndent = '48px';
        this.dropdownIcon.style.display = 'block';
        this.inputParent.append(this.dropdownIcon);
        this.inputParent.append(this.dropdownSelect);
      }
    }
  }
}
