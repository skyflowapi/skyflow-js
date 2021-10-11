import bus from 'framebus';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  REVEAL_ELEMENT_ERROR_TEXT,
  REVEAL_ELEMENT_LABEL_DEFAULT_STYLES,
  REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
  REVEAL_ELEMENT_DIV_STYLE,
  MessageType,
} from '../../constants';
import getCssClassesFromJss from '../../../libs/jss-styles';
import {
  printLog, parameterizedString,
  LogLevelOptions,
} from '../../../utils/logsHelper';
import logs from '../../../utils/logs';

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

  #revealedValue!:string;

  #showInfoLogs!:boolean;

  #showErrorLogs!:boolean;

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
    const { showInfoLogs, showErrorLogs } = LogLevelOptions[context.logLevel];
    this.#showInfoLogs = showInfoLogs;
    this.#showErrorLogs = showErrorLogs;
    this.#name = window.name;
    this.#containerId = this.#name.split(':')[2];
    this.#record = record;

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

    if (Object.prototype.hasOwnProperty.call(this.#record, 'altText')) this.#dataElememt.innerText = this.#record.altText;
    else if (Object.prototype.hasOwnProperty.call(this.#record, 'token')) this.#dataElememt.innerText = this.#record.token;

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
        this.#dataElememt.innerText = responseValue;
        printLog(parameterizedString(logs.infoLogs.ELEMENT_REVEALED,
          this.#record.token), MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
        bus
          .target(window.location.origin)
          .off(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
            sub,
          );
      } else {
        this.#errorElement.innerText = REVEAL_ELEMENT_ERROR_TEXT;
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
    };

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
        sub,
      );

    // for gateway
    bus.target(window.location.origin).on(
      ELEMENT_EVENTS_TO_IFRAME.GET_REVEAL_ELEMENT,
      (data, callback) => {
        if (data.name === this.#name) {
          if (this.#revealedValue) {
            callback(this.#revealedValue);
          } else { callback(this.#record.token); }
        }
      },
    );
  }
}

export default RevealFrame;
