/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  REVEAL_ELEMENT_ERROR_TEXT,
  REVEAL_ELEMENT_LABEL_DEFAULT_STYLES,
  REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
  REVEAL_ELEMENT_DIV_STYLE,
  REVEAL_ELEMENT_OPTIONS_TYPES,
  COPY_UTILS,
  REVEAL_COPY_ICON_STYLES,
	CARDNUMBER_REVEAL_FORMAT,
} from '../../constants';
import getCssClassesFromJss from '../../../libs/jss-styles';
import {
  printLog, parameterizedString,
} from '../../../utils/logs-helper';
import logs from '../../../utils/logs';
import { Context, MessageType } from '../../../utils/common';
import { handleCopyIconClick, styleToString } from '../../../utils/helpers';

const CLASS_NAME = 'RevealFrame';
class RevealFrame {
  static revealFrame: RevealFrame;

  #elementContainer: HTMLDivElement;

  #dataElememt: HTMLSpanElement;

  #labelElement: HTMLSpanElement;

  #errorElement: HTMLSpanElement;

  #name: string;

  #record: any;

  #containerId: string;

  #inputStyles!: object;

  #labelStyles!: object;

  #errorTextStyles!: object;

  #revealedValue!: string;

  #context: Context;

  private domCopy?: HTMLImageElement;

  private isRevealCalled?: boolean;

  static init() {
    bus
      // .target(document.referrer.split("/").slice(0, 3).join("/"))
      .emit(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY,
        { name: window.name },
        (data: any) => {
          RevealFrame.revealFrame = new RevealFrame(data.record, data.context);
        },
      );
  }

  constructor(record, context) {
    this.#name = window.name;
    this.#containerId = this.#name.split(':')[2];
    this.#record = record;
    this.#context = context;
    this.isRevealCalled = false;

    this.#elementContainer = document.createElement('div');
    this.#elementContainer.className = 'SkyflowElement-div-container';
    getCssClassesFromJss(REVEAL_ELEMENT_DIV_STYLE, 'div');

    this.#labelElement = document.createElement('span');
    this.#labelElement.className = `SkyflowElement-label-${STYLE_TYPE.BASE}`;

    this.#dataElememt = document.createElement('span');
    this.#dataElememt.className = `SkyflowElement-content-${STYLE_TYPE.BASE}`;
    this.#dataElememt.id = this.#name;

    this.#errorElement = document.createElement('span');
    this.#errorElement.className = `SkyflowElement-error-${STYLE_TYPE.BASE}`;

    if (this.#record.enableCopy) {
      this.domCopy = document.createElement('img');
      this.domCopy.src = COPY_UTILS.copyIcon;
      this.domCopy.title = COPY_UTILS.toCopy;
      this.domCopy.setAttribute('style', this.#record?.inputStyles?.copyIcon ? styleToString(this.#record.inputStyles.copyIcon) : REVEAL_COPY_ICON_STYLES);
      this.#elementContainer.append(this.domCopy);

      this.domCopy.onclick = () => {
        if (this.isRevealCalled) {
          handleCopyIconClick(this.#revealedValue, this.domCopy);
        } else {
          handleCopyIconClick(this.#record.token, this.domCopy);
        }
      };
    }

    if (Object.prototype.hasOwnProperty.call(this.#record, 'label')) {
      this.#labelElement.innerText = this.#record.label;
      this.#elementContainer.append(this.#labelElement);

      if (Object.prototype.hasOwnProperty.call(this.#record, 'labelStyles')) {
        this.#labelStyles = this.#record.labelStyles;
        this.#labelStyles[STYLE_TYPE.BASE] = {
          ...REVEAL_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.BASE],
          ...this.#labelStyles[STYLE_TYPE.BASE],
        };
        getCssClassesFromJss(this.#labelStyles, 'label');
      } else {
        getCssClassesFromJss(REVEAL_ELEMENT_LABEL_DEFAULT_STYLES, 'label');
      }
    }
    this.updateDataView();
    if (Object.prototype.hasOwnProperty.call(this.#record, 'inputStyles')) {
      this.#inputStyles = this.#record.inputStyles;
      getCssClassesFromJss(this.#inputStyles, 'content');
    }

    this.#elementContainer.appendChild(this.#dataElememt);

    document.body.append(this.#elementContainer);

    const sub = (data) => {
      if (Object.prototype.hasOwnProperty.call(data, this.#record.token)) {
        const responseValue = data[this.#record.token] as string;
        this.#revealedValue = responseValue;
        this.isRevealCalled = true;
        // TODO: Hardcoded as the regex provide from SDK side is not getting escaped.
				let formattedString = ''
				if (this.#record.format !== undefined && (responseValue.length === 16 || responseValue.length === 15)) {
					for (const [k, v] of Object.entries(CARDNUMBER_REVEAL_FORMAT)) {
						if (CARDNUMBER_REVEAL_FORMAT.SPACE_FORMAT === this.#record.format) {
							formattedString = responseValue.replace(/(\d{4}(?!\s))/g, '$1 ');
						} else if (CARDNUMBER_REVEAL_FORMAT.DASH_FORMAT === this.#record.format) {
							formattedString = responseValue.replace(/^(\d{4})(\d{4})(\d{4})(\d{4})$/, '$1-$2-$3-$4');
						} else if (CARDNUMBER_REVEAL_FORMAT.AMEX_FORMAT === this.#record.format) {
							formattedString = responseValue.replace(/^(\d{4})(\d{6})(\d{5})$/, '$1 $2 $3');
						}
						else {
							formattedString = responseValue
						}
					}
				} else {
					formattedString = responseValue
				}

				this.#dataElememt.innerText = this.#record.format === undefined ? responseValue : formattedString;
        printLog(parameterizedString(logs.infoLogs.ELEMENT_REVEALED,
          CLASS_NAME, this.#record.token), MessageType.LOG, this.#context.logLevel);

        // bus
        //   .target(window.location.origin)
        //   .off(
        //     ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
        //     sub,
        //   );
      } else {
        this.setRevealError(REVEAL_ELEMENT_ERROR_TEXT);
      }
      // this.updateDataView();
    };

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
        sub,
      );

    bus.target(document.referrer.split('/').slice(0, 3).join('/')).on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR, (data) => {
      if (this.#name === data.name) {
        if (data.isTriggerError) { this.setRevealError(data.clientErrorText as string); } else { this.setRevealError(''); }
      }
    });
    this.updateRevealElementOptions();
  }

  private setRevealError(errorText: string) {
    this.#errorElement.innerText = errorText;
    if (
      Object.prototype.hasOwnProperty.call(this.#record, 'errorTextStyles')
      && Object.prototype.hasOwnProperty.call(this.#record.errorTextStyles, STYLE_TYPE.BASE)
    ) {
      this.#errorTextStyles = this.#record.errorTextStyles;
      this.#errorTextStyles[STYLE_TYPE.BASE] = {
        ...REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES[STYLE_TYPE.BASE],
        ...this.#errorTextStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#errorTextStyles, 'error');
    } else {
      getCssClassesFromJss(
        REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
        'error',
      );
    }
    this.#elementContainer.appendChild(this.#errorElement);
  }

  private updateRevealElementOptions() {
    bus.target(document.referrer.split('/').slice(0, 3).join('/')).on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS, (data) => {
      if (data.name === this.#name) {
        if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT) {
          if (data.updatedValue) {
            this.#record = {
              ...this.#record,
              altText: data.updatedValue,
            };
          } else {
            delete this.#record.altText;
          }

          this.updateDataView();
        } else if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN) {
          this.#record = {
            ...this.#record,
            token: data.updatedValue,
          };
          this.updateDataView();
        }
      }
    });
  }

  private updateDataView() {
    if (Object.prototype.hasOwnProperty.call(this.#record, 'altText')) {
      this.#dataElememt.innerText = this.#record.altText;
    } else if (this.#revealedValue) {
      this.#dataElememt.innerText = this.#revealedValue;
    } else if (Object.prototype.hasOwnProperty.call(this.#record, 'token')) {
      this.#dataElememt.innerText = this.#record.token;
    }
  }
}

export default RevealFrame;
