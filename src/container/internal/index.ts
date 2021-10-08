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
} from '../constants';
import { IFrameForm, IFrameFormElement } from './iFrameForm';
import getCssClassesFromJss from '../../libs/jss-styles';

export class FrameController {
  controller?: FrameController;

  controllerId: string;

  #client?: Client;

  #iFrameForm: IFrameForm;

  private clientDomain: string;

  constructor(controllerId: string) {
    this.clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    this.#iFrameForm = new IFrameForm(controllerId, this.clientDomain);
    this.controllerId = controllerId;
    bus
      // .target(this.clientDomain)
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + controllerId,
        { name: COLLECT_FRAME_CONTROLLER + controllerId },
        (data: any) => {
          let { context, ...clientMetaData } = data;
          clientMetaData = {
            ...clientMetaData,
            clientJSON: {
              ...clientMetaData.clientJSON,
              config: {
                ...clientMetaData.clientJSON.config,
                getBearerToken: new Function(
                  `return ${clientMetaData.clientJSON.config.getBearerToken}`,
                )(),
              },
            },
          };
          const { clientJSON } = clientMetaData;
          this.#iFrameForm.setClientMetadata(clientMetaData);
          this.#iFrameForm.setClient(Client.fromJSON(clientJSON));
          this.#iFrameForm.setLogLevel(context.logLevel);
          delete clientMetaData.clientJSON;
        },
      );
  }

  static init(uuid: string) {
    return new FrameController(uuid);
  }
}

export class FrameElement {
  // all html events like focus blur events will be handled here
  options: any;

  private htmlDivElement: HTMLDivElement;

  private iFrameFormElement: IFrameFormElement;

  private domLabel?: HTMLLabelElement;

  private domInput?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  private domError?: HTMLSpanElement;

  constructor(
    iFrameFormElement: IFrameFormElement,
    options: any,
    htmlDivElement: HTMLDivElement,
  ) {
    this.iFrameFormElement = iFrameFormElement;
    this.options = options;
    this.htmlDivElement = htmlDivElement;

    this.mount();
  }

  // mount element onto dom
  mount = () => {
    this.iFrameFormElement.resetEvents();
    this.domLabel = document.createElement('label');
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
    const inputElement = document.createElement(type);

    this.domInput = inputElement;

    // events and todo: onclick, onescape ...???
    inputElement.onfocus = (event) => {
      this.onFocusChange(event, true);
    };
    inputElement.onblur = (event) => {
      this.onFocusChange(event, false);
    };

    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.FOCUS, () => {
      this.focusChange(true);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, () => {
      this.focusChange(false);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.CHANGE, (state) => {
      if (
        state.value
        && this.iFrameFormElement.fieldType === ELEMENTS.radio.name
      ) {
        (<HTMLInputElement> this.domInput).checked = this.options.value === state.value;
      }
      if ((state.isEmpty || state.isValid) && this.domError) {
        this.domError.innerText = '';
      } else if (!state.isEmpty && !state.isValid && this.domError) {
        this.domError.innerText = this.options.label
          ? `Invalid ${this.options.label}`
          : 'Invalid value';
      }
      this.updateStyleClasses(state);
    });
    this.iFrameFormElement.on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
      if (data.options) {
        this.updateOptions(data.options);
      }
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
    if (Object.prototype.hasOwnProperty.call(this.options, 'label')) this.htmlDivElement.append(this.domLabel || '');

    this.htmlDivElement.append(this.domInput || '', this.domError || '');
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
    const target = event.target as HTMLInputElement;
    this.iFrameFormElement.setValue(target.value, target.checkValidity());
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
  }) {
    const classes: string[] = [];
    const labelClasses: string[] = [];

    if (state.isFocused) {
      classes.push(STYLE_TYPE.FOCUS);
      labelClasses.push(STYLE_TYPE.FOCUS);
    }
    if (state.isEmpty) {
      classes.push(STYLE_TYPE.EMPTY);
    } else {
      if (!state.isValid) {
        classes.push(STYLE_TYPE.INVALID);
      }
      if (state.isComplete) {
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
      this.injectInputStyles(options.inputStyles);
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

      this.iFrameFormElement.setValidation();
      this.iFrameFormElement.setReplacePattern(this.options.replacePattern);
      this.iFrameFormElement.setMask(this.options.mask);

      const { mask } = this.iFrameFormElement;
      $(id).off('input');
      (<any>$).jMaskGlobals.translation = {};
      (<any>$).jMaskGlobals.clearIfNotMatch = true;

      $(id).unmask();

      if (mask) {
        const translation = {};
        Object.keys(mask[2]).forEach((key) => {
          translation[key] = { pattern: mask[2][key] };
        });

        $(id).mask(mask[0], {
          translation,
        });
      }

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
}
