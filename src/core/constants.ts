/*
Copyright (c) 2022 Skyflow, Inc.
*/
import defaultCardIcon from '../../assets/default.svg';
import amexIcon from '../../assets/amex.svg';
import dinnersClubIcon from '../../assets/diners-club.svg';
import discoverIcon from '../../assets/discover.svg';
import hipperCardIcon from '../../assets/hipercard.svg';
import jcbIcon from '../../assets/jcb.svg';
import maestroIcon from '../../assets/maestro.svg';
import maseterCardIcon from '../../assets/mastercard.svg';
import unionPayIcon from '../../assets/unionpay.svg';
import visaCardIcon from '../../assets/visa.svg';
import copyIcon from '../../assets/copyIcon.svg';
import successIcon from '../../assets/path.svg';
import dropDownIcon from '../../assets/drop-down.svg';
import cartesBancairesIcon from '../../assets/carter-banceris.svg';

import logs from '../utils/logs';

export const SESSION_ID = 'session_id';
export const SKY_METADATA_HEADER = 'sky-metadata';
export const SDK_VERSION = 'sdkVersion';
export const COLLECT_FRAME_CONTROLLER = 'collect_controller';
export const REVEAL_FRAME_CONTROLLER = 'reveal_controller';
export const SKYFLOW_FRAME_CONTROLLER = 'skyflow_controller';
export const FRAME_REVEAL = 'reveal';

export const SDK_IFRAME_EVENT = 'SDK IFRAME EVENT';
export const DOMAIN = 'US2';
export const CORALOGIX_DOMAIN = 'https://cdn.rum-ingress-coralogix.com/coralogix/browser/latest/coralogix-browser-sdk.js';
export const FRAME_ELEMENT = 'element';

export const ELEMENT_TYPES = {
  COLLECT: 'COLLECT',
  REVEAL: 'REVEAL',
  COMPOSE: 'COMPOSABLE',
};

export const EVENT_TYPES = {
  MOUNTED: 'MOUNTED',
  READY: 'FRAME_READY',
};

export const STATUS_TYPES = {
  SUCCESS: 'SUCCESS',
  INITIALIZED: 'INITIALIZED',
  PARTIAL_RENDER: 'PARTIAL_RENDER',
  FAILED: 'FAILED',
};

export const METRIC_TYPES = {
  ELEMENT_ID: 'element_id',
  ELEMENT_TYPE: ELEMENT_TYPES,
  ELEMENT_TYPE_KEY: 'element_type',
  DIV_ID: 'div_id',
  CONTAINER_ID: 'container_id',
  CONTAINER_NAME: 'container_name',
  SESSION_ID: 'session_id',
  VAULT_ID: 'vault_id',
  VAULT_URL: 'vault_url',
  EVENTS: EVENT_TYPES,
  EVENTS_KEY: 'events',
  CREATED_AT: 'created_at',
  REGION: 'region',
  MOUNT_START_TIME: 'mount_start_time',
  MOUNT_END_TIME: 'mount_end_time',
  ERROR: 'error',
  LATENCY: 'latency',
  STATUS: STATUS_TYPES,
};

export const PUREJS_TYPES = {
  INSERT: 'INSERT',
  DETOKENIZE: 'DETOKENIZE',
  GET_BY_SKYFLOWID: 'GET_BY_SKYFLOWID',
  GET: 'GET',
  DELETE: 'DELETE',
};

export const COLLECT_TYPES = {
  COLLECT: 'COLLECT',
  FILE_UPLOAD: 'FILE_UPLOAD',
};

export const REVEAL_TYPES = {
  REVEAL: 'REVEAL',
  RENDER_FILE: 'RENDER_FILE',
};

export const ELEMENT_EVENTS_TO_CLIENT = {
  CHANGE: 'CHANGE',
  READY: 'READY',
  FOCUS: 'FOCUS',
  BLUR: 'BLUR',
  ESCAPE: 'ESCAPE',
  CLICK: 'CLICK',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  SUBMIT: 'SUBMIT',
  CREATED: 'CREATED',
  MOUNTED: 'MOUNTED',
  HEIGHT: 'HEIGHT',
};

export const ELEMENT_EVENTS_TO_IFRAME = {
  COLLECT_CALL_REQUESTS: 'COLLECT_CALL_REQUESTS',
  REVEAL_CALL_REQUESTS: 'REVEAL_CALL_REQUESTS',
  FRAME_READY: 'FRAME_READY',
  READY_FOR_CLIENT: 'READY_FOR_CLIENT',
  TOKENIZATION_REQUEST: 'TOKENIZATION_REQUEST',
  INPUT_EVENT: 'INPUT_EVENT',
  DESTROY_FRAME: 'DESTROY FRAME',
  SET_VALUE: 'SET_VALUE',
  CLIENT_REQUEST: 'CLIENT_REQUEST',
  GET_ACCESS_TOKEN: 'GET_ACCESS_TOKEN',
  REVEAL_REQUEST: 'REVEAL_REQUEST',
  REVEAL_RESPONSE_READY: 'REVEAL_RESPONSE_READY',
  REVEAL_FRAME_READY: 'REVEAL_FRAME_READY',
  REVEAL_GET_ACCESS_TOKEN: 'REVEAL_GET_ACCESS_TOKEN',
  PUREJS_REQUEST: 'PUREJS_REQUEST',
  PUREJS_FRAME_READY: 'PUREJS_FRAME_READY',
  PUREJS_GET_ACCESS_TOKEN: 'PUREJS_GET_ACCESS_TOKEN',
  GET_BEARER_TOKEN: 'GET_BEARER_TOKEN',
  GET_COLLECT_ELEMENT: 'GET_COLLECT_ELEMENT',
  GET_REVEAL_ELEMENT: 'GET_REVEAL_ELEMENT',
  COLLECT_ELEMENT_SET_ERROR: 'COLLECT_ELEMENT_SET_ERROR',
  COLLECT_ELEMENT_SET_ERROR_OVERRIDE: 'COLLECT_ELEMENT_SET_ERROR_OVERRIDE',
  REVEAL_ELEMENT_SET_ERROR: 'REVEAL_ELEMENT_SET_ERROR',
  REVEAL_ELEMENT_UPDATE_OPTIONS: 'REVEAL_ELEMENT_UPDATE_OPTIONS',
  FILE_UPLOAD: 'FILE_UPLOAD',
  COMPOSABLE_UPDATE_OPTIONS: 'COMPOSABLE_UPDATE_OPTIONS',
  RENDER_FILE_RESPONSE_READY: 'RENDER_FILE_RESPONSE_READY',
  RENDER_FILE_REQUEST: 'RENDER_FILE_REQUEST',
  PUSH_EVENT: 'PUSH_EVENT',
  SKYFLOW_FRAME_CONTROLLER_READY: 'SKYFLOW_FRAME_CONTROLLER_READY',
  COLLECT_ELEMENT_READY: 'COLLECT_ELEMENT_READY',
};

export const REVEAL_ELEMENT_OPTIONS_TYPES = {
  TOKEN: 'TOKEN',
  ALT_TEXT: 'ALT_TEXT',
  ELEMENT_PROPS: 'ELEMENT_PROPS',
};

export const ELEMENT_EVENTS_TO_CONTAINER = {
  ELEMENT_MOUNTED: 'ELEMENT_MOUNTED',
  ALL_ELEMENTS_MOUNTED: 'ALL_ELEMENTS_MOUNTED',
  COMPOSABLE_CONTAINER_MOUNTED: 'COMPOSABLE_CONTAINER_MOUNTED',
  COLLECT_CONTAINER_MOUNTED: 'COLLECT_CONTAINER_MOUNTED',
  REVEAL_CONTAINER_MOUNTED: 'REVEAL_CONTAINER_MOUNTED',
  RENDER_FILE_REQUEST: 'RENDER_FILE_REQUEST',
};

export enum ElementType {
  CVV = 'CVV',
  EXPIRATION_DATE = 'EXPIRATION_DATE',
  CARD_NUMBER = 'CARD_NUMBER',
  CARDHOLDER_NAME = 'CARDHOLDER_NAME',
  INPUT_FIELD = 'INPUT_FIELD',
  PIN = 'PIN',
  EXPIRATION_MONTH = 'EXPIRATION_MONTH',
  EXPIRATION_YEAR = 'EXPIRATION_YEAR',
  FILE_INPUT = 'FILE_INPUT',
}

export enum CardType {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  DINERS_CLUB = 'DINERS_CLUB',
  DISCOVER = 'DISCOVER',
  JCB = 'JCB',
  MAESTRO = 'MAESTRO',
  UNIONPAY = 'UNIONPAY',
  HIPERCARD = 'HIPERCARD',
  DEFAULT = 'DEFAULT',
  UNKNOWN = 'UNKNOWN',
  CARTES_BANCAIRES = 'CARTES BANCAIRES',
}

export const CardTypeValues = {
  [CardType.VISA]: 'Visa',
  [CardType.MASTERCARD]: 'Mastercard',
  [CardType.AMEX]: 'Amex',
  [CardType.DINERS_CLUB]: 'DinersClub',
  [CardType.DISCOVER]: 'Discover',
  [CardType.JCB]: 'Jcb',
  [CardType.MAESTRO]: 'Maestro',
  [CardType.UNIONPAY]: 'Unionpay',
  [CardType.HIPERCARD]: 'Hipercard',
  [CardType.DEFAULT]: 'Default',
  [CardType.UNKNOWN]: 'Unknown',
  [CardType.CARTES_BANCAIRES]: 'Cartes Bancaires',
};

export const CARD_NUMBER_MASK = {
  [CardType.AMEX]: ['XXXX XXXXXX XXXXX', { X: '[0-9]' }],
  [CardType.VISA]: ['XXXX XXXX XXXX XXXX', { X: '[0-9]' }],
  [CardType.MASTERCARD]: ['XXXX XXXX XXXX XXXX', { X: '[0-9]' }],
  [CardType.DISCOVER]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
  [CardType.DINERS_CLUB]: ['XXXX XXXXXX XXXXXX', { X: '[0-9]' }],
  [CardType.JCB]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
  [CardType.MAESTRO]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
  [CardType.UNIONPAY]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
  [CardType.HIPERCARD]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
  [CardType.DEFAULT]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
  [CardType.UNKNOWN]: ['XXXX XXXX XXXX XXXX XXX', { X: '[0-9]' }],
};

export const ELEMENTS = {
  textarea: {
    name: 'textarea',
    attributes: {
      type: 'textarea',
    },
    sensitive: false,
  },
  checkbox: {
    name: 'checkbox',
    attributes: {
      type: 'checkbox',
    },
    sensitive: false,
  },
  radio: {
    name: 'radio',
    attributes: {
      type: 'radio',
    },
    sensitive: false,
  },
  dropdown: {
    name: 'dropdown',
    attributes: {
      type: 'select',
    },
    sensitive: false,
  },
  [ElementType.CARDHOLDER_NAME]: {
    name: 'cardHolderName',
    attributes: {
      type: 'text',
      autocomplete: 'cc-name',
    },
    sensitive: true,
    regex: /^([a-zA-Z\\ \\,\\.\\-\\']{2,})$/,
  },
  [ElementType.CARD_NUMBER]: {
    name: 'CARD_NUMBER',
    attributes: {
      type: 'text',
      autocomplete: 'cc-number',
      inputmode: 'numeric',
    },
    sensitive: true,
    mask: CARD_NUMBER_MASK[CardType.DEFAULT],
    regex: /$|^[\s]*?([0-9]{2,6}[ -]?){3,5}[\s]*/,
  },
  [ElementType.EXPIRATION_DATE]: {
    name: 'EXPIRATION_DATE',
    attributes: {
      type: 'text',
      autocomplete: 'cc-exp',
      inputmode: 'numeric',
    },
    sensitive: true,
    // mask: ["XY/YYYY", { X: "[0-1]", Y: "[0-9]" }],
    // regex: /^(0[1-9]|1[0-2])\/([0-9]{4})$/,
  },
  [ElementType.EXPIRATION_MONTH]: {
    name: 'EXPIRATION_MONTH',
    attributes: {
      maxLength: 2,
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'cc-exp-month',
    },
    sensitive: true,
    mask: ['XX', { X: '[0-9]' }],
  },
  [ElementType.EXPIRATION_YEAR]: {
    name: 'EXPIRATION_YEAR',
    attributes: {
      // maxLength: 4,
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'cc-exp-year',
    },
    sensitive: true,
  },
  [ElementType.CVV]: {
    name: 'CVV',
    attributes: {
      type: 'text',
      inputmode: 'numeric',
      maxLength: 4,
    },
    sensitive: true,
    regex: /^$|^[0-9]{3,4}$/,
  },
  [ElementType.INPUT_FIELD]: {
    name: 'INPUT_FIELD',
    sensitive: true,
    attributes: {
      type: 'text',
    },
  },
  [ElementType.PIN]: {
    name: 'PIN',
    attributes: {
      type: 'text',
      inputmode: 'numeric',
      maxLength: 12,
      minLength: 4,
    },
    sensitive: true,
    regex: /^$|^[0-9]{4,12}$/,
  },
  [ElementType.FILE_INPUT]: {
    name: 'FILE_INPUT',
    sensitive: true,
    attributes: {
      type: 'file',
    },
  },
};

export const CARDNUMBER_INPUT_FORMAT = {
  SPACE_FORMAT: 'XXXX XXXX XXXX XXXX',
  DASH_FORMAT: 'XXXX-XXXX-XXXX-XXXX',
  AMEX_FORMAT: 'XXXX XXXXXX XXXXX',
};

export const IFRAME_DEFAULT_STYLES = {
  height: '100%',
  width: '100%',
  margin: 0,
  padding: 0,
  border: 0,
  position: 'absolute',
  top: 0,
  left: 0,
  'user-select': 'none',
};

export const CONTROLLER_STYLES = {
  position: 'absolute',
  top: 0,
  width: 0,
  height: 0,
  visibility: 'hidden',
  left: '-99999999px',
  'user-select': 'none',
};

export const INPUT_STYLES = {
  width: '100%',
  height: '100%',
  border: '0',
  padding: '0',
  margin: '0',
  outline: 'none',
};

export const INPUT_WITH_ICON_STYLES = {
  'background-position': '7px 7px',
  'background-repeat': 'no-repeat',
  'text-indent': '36px',
};

export const INPUT_WITH_ICON_DEFAULT_STYLES = {
  'background-repeat': 'no-repeat',
  'text-indent': '42px',
  padding: '4px',
};

export const INPUT_ICON_STYLES = 'position: absolute; left:8px; bottom:calc(50% - 12px); cursor:pointer;';
export const DROPDOWN_ICON_STYLES = 'position: absolute; left:46px; bottom:calc(50% - 12px);cursor:pointer;display:none;';
export const DROPDOWN_STYLES = 'position: absolute; left:8px; bottom:calc(50% - 12px);appearance: none;padding: unset; box-shadow: none;background: transparent;cursor:pointer;outline:none;opacity:0;width:54px;';
export const COLLECT_COPY_ICON_STYLES = 'position: absolute; right:8px; bottom:calc(50% - 12px); cursor:pointer;';
export const REVEAL_COPY_ICON_STYLES = 'position: absolute; right:8px; top:calc(50% - 12px); cursor:pointer;';

export const ERROR_TEXT_STYLES = {
  color: '#f44336',
  padding: '2px',
};

export const ALLOWED_ATTRIBUTES = {
  'aria-invalid': 'boolean',
  'aria-required': 'boolean',
  disabled: 'boolean',
  placeholder: 'string',
  accept: 'string',
};

export const ALLOWED_STYLES = [
  '-moz-appearance',
  '-moz-osx-font-smoothing',
  '-moz-tap-highlight-color',
  '-moz-transition',
  '-webkit-appearance',
  '-webkit-font-smoothing',
  '-webkit-tap-highlight-color',
  '-webkit-transition',
  'appearance',
  'background-color',
  'border',
  'border-radius',
  'color',
  'direction',
  'font',
  'font-family',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-variant-alternates',
  'font-variant-caps',
  'font-variant-east-asian',
  'font-variant-ligatures',
  'font-variant-numeric',
  'font-weight',
  'height',
  'letter-spacing',
  'line-height',
  'margin',
  'opacity',
  'outline',
  'padding',
  'text-decoration',
  'text-shadow',
  'text-transform',
  'transition',
  'width',
];

export const ALLOWED_PSEUDO_STYLES = [
  ':hover',
  ':focus',
  '::placeholder',
  '::accept',
  '::selection',
  ':disabled',
  ':-webkit-autofill',
];

export const ALLOWED_MULTIPLE_FIELDS_STYLES = [
  'height',
  'width',
  'padding',
  'margin',
  'position',
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'border',
];

// should be in the order of applying the styles
export const STYLE_TYPE = {
  WEBPACKAUTOFILL: '-webkit-autofill',
  BASE: 'base',
  FOCUS: 'focus',
  COMPLETE: 'complete',
  EMPTY: 'empty',
  INVALID: 'invalid',
  GLOBAL: 'global',
  REQUIRED_ASTERISK: 'requiredAsterisk',
};
export const REVEAL_ELEMENT_DIV_STYLE = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
};
export const RENDER_ELEMENT_IMAGE_STYLES = {
  [STYLE_TYPE.BASE]: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
};

export const REVEAL_ELEMENT_LABEL_DEFAULT_STYLES = {
  [STYLE_TYPE.BASE]: {
    'margin-bottom': '4px',
  },
};
export const RENDER_FILE_ELEMENT_ALT_TEXT_DEFAULT_STYLES = {
  [STYLE_TYPE.BASE]: {
    'margin-bottom': '4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
};

export const REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES = {
  [STYLE_TYPE.BASE]: {
    marginTop: '4px',
  },
};

export const REVEAL_ELEMENT_ERROR_TEXT = 'Invalid Token';

export const COLLECT_ELEMENT_LABEL_DEFAULT_STYLES = {
  [STYLE_TYPE.BASE]: {
    marginBottom: '4px',
  },
  [STYLE_TYPE.REQUIRED_ASTERISK]: {
    display: 'inline',
    color: 'red',
  },
};

export const ALLOWED_NAME_FOR_FILE = /^[a-zA-Z0-9!\-_.*()]+$/;

export const CARD_TYPE_REGEX = {
  [CardType.VISA]: {
    regex: /^4\d*/,
    maxCardLength: 19,
    cardLengthRange: [13, 16],
  },
  [CardType.MASTERCARD]: {
    regex: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)\d*/,
    maxCardLength: 16,
    cardLengthRange: [16],
  },
  [CardType.AMEX]: {
    regex: /^3[47]\d*/,
    maxCardLength: 15,
    cardLengthRange: [15],
  },
  [CardType.DINERS_CLUB]: {
    regex: /^(36|38|30[0-5])\d*/,
    maxCardLength: 16,
    cardLengthRange: [14, 15, 16, 17, 18, 19],
  },
  [CardType.DISCOVER]: {
    regex: /^(6011|65|64[4-9]|622)\d*/,
    maxCardLength: 16,
    cardLengthRange: [16, 17, 18, 19],
  },
  [CardType.JCB]: {
    regex: /^35\d*/,
    maxCardLength: 19,
    cardLengthRange: [16, 17, 18, 19],
  },
  [CardType.HIPERCARD]: {
    regex: /^606282\d*/,
    maxCardLength: 19,
    cardLengthRange: [14, 15, 16, 17, 18, 19],
  },
  [CardType.UNIONPAY]: {
    regex: /^62\d*/,
    maxCardLength: 19,
    cardLengthRange: [16, 17, 18, 19],
  },
  [CardType.MAESTRO]: {
    regex: /^(5018|5020|5038|5043|5[6-9]|6020|6304|6703|6759|676[1-3])\d*/,
    maxCardLength: 19,
    cardLengthRange: [12, 13, 14, 15, 16, 17, 18, 19],
  },
};
export const DEFAULT_CARD_LENGTH_RANGE = [0, 12, 13, 14, 15, 16, 17, 18, 19];

export const CARD_ENCODED_ICONS = {
  [CardType.DEFAULT]: defaultCardIcon,
  [CardType.AMEX]: amexIcon,
  [CardType.CARTES_BANCAIRES]: cartesBancairesIcon,
  [CardType.DINERS_CLUB]: dinnersClubIcon,
  [CardType.DISCOVER]: discoverIcon,
  [CardType.HIPERCARD]: hipperCardIcon,
  [CardType.JCB]: jcbIcon,
  [CardType.MAESTRO]: maestroIcon,
  [CardType.MASTERCARD]: maseterCardIcon,
  [CardType.UNIONPAY]: unionPayIcon,
  [CardType.VISA]: visaCardIcon,
};

export const COPY_UTILS = {
  copyIcon,
  successIcon,
  toCopy: 'Copy text',
  copied: 'Copied to Clipboard',
};

export const EXPIRY_DATE_MASK = {
  'MM/YYYY': ['YY/YYYY', { Y: '[0-9]' }],
  'MM/YY': ['YY/YY', { Y: '[0-9]' }],
  'YYYY/MM': ['YYYY/YY', { Y: '[0-9]' }],
  'YY/MM': ['YY/YY', { Y: '[0-9]' }],
};
export const EXPIRY_YEAR_MASK = {
  YYYY: ['YYYY', { Y: '[0-9]' }],
  YY: ['YY', { Y: '[0-9]' }],
};
export const DEFAULT_EXPIRATION_DATE_FORMAT = 'MM/YY';
export const ALLOWED_EXPIRY_DATE_FORMATS = [
  DEFAULT_EXPIRATION_DATE_FORMAT,
  'YYYY/MM',
  'YY/MM',
  'MM/YYYY',
];

export const DEFAULT_EXPIRATION_YEAR_FORMAT = 'YY';
export const ALLOWED_EXPIRY_YEAR_FORMATS = [
  DEFAULT_EXPIRATION_YEAR_FORMAT,
  'YYYY',
];

export enum ContentType {
  APPLICATIONORJSON = 'application/json',
  TEXTORPLAIN = 'text/plain',
  TEXTORXML = 'text/xml',
  FORMURLENCODED = 'application/x-www-form-urlencoded',
  FORMDATA = 'multipart/form-data',
}

export const ALLOWED_FOCUS_AUTO_SHIFT_ELEMENT_TYPES = [
  ElementType.CARD_NUMBER,
  ElementType.EXPIRATION_DATE,
  ElementType.EXPIRATION_MONTH,
  ElementType.EXPIRATION_YEAR,
];

export const DEFAULT_ERROR_TEXT_ELEMENT_TYPES = {
  [ElementType.CVV]: 'Invalid cvv',
  [ElementType.EXPIRATION_DATE]: 'Invalid expiration date',
  [ElementType.CARD_NUMBER]: 'Invalid card number',
  [ElementType.CARDHOLDER_NAME]: 'Invalid cardholder name',
  [ElementType.INPUT_FIELD]: logs.errorLogs.INVALID_COLLECT_VALUE,
  [ElementType.PIN]: 'Invalid pin',
  [ElementType.EXPIRATION_MONTH]: 'Invalid expiration month',
  [ElementType.EXPIRATION_YEAR]: 'Invalid expiration year',
  [ElementType.FILE_INPUT]: logs.errorLogs.INVALID_COLLECT_VALUE,
};

export const DEFAULT_REQUIRED_TEXT_ELEMENT_TYPES = {
  [ElementType.CVV]: 'cvv is required',
  [ElementType.EXPIRATION_DATE]: 'expiration date is required',
  [ElementType.CARD_NUMBER]: 'card number is required',
  [ElementType.CARDHOLDER_NAME]: 'cardholder name is required',
  [ElementType.INPUT_FIELD]: logs.errorLogs.DEFAULT_REQUIRED_COLLECT_VALUE,
  [ElementType.PIN]: 'pin is required',
  [ElementType.EXPIRATION_MONTH]: 'expiration month is required',
  [ElementType.EXPIRATION_YEAR]: 'expiration year is required',
  [ElementType.FILE_INPUT]: logs.errorLogs.DEFAULT_REQUIRED_COLLECT_VALUE,
};

export const INPUT_KEYBOARD_EVENTS = {
  ENTER: 'Enter',
  RIGHT_ARROW: 'ArrowRight',
  LEFT_ARROW: 'ArrowLeft',
  BACKSPACE: 'Backspace',
};

export const CUSTOM_ROW_ID_ATTRIBUTE = 'data-row-id';

export const INPUT_FORMATTING_NOT_SUPPORTED_ELEMENT_TYPES = [
  ElementType.CARDHOLDER_NAME,
  ElementType.EXPIRATION_MONTH,
  ElementType.FILE_INPUT,
  ElementType.PIN,
  ElementType.CVV,
];

export const DEFAULT_CARD_NUMBER_SEPERATOR = ' ';
export const CARD_NUMBER_HYPEN_SEPERATOR = '-';

export const DEFAULT_INPUT_FORMAT_TRANSLATION = { X: '[0-9]' };

export const DEFAULT_FILE_RENDER_ERROR = 'File rendering failed. Please try again later.';

export const FILE_DOWNLOAD_URL_PARAM = 'downloadURL=true&contentDisposition=INLINE';

export const DROP_DOWN_ICON = dropDownIcon;
