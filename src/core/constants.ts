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
import SKYFLOW_ERROR_CODE from '../utils/constants';

export const COLLECT_FRAME_CONTROLLER = 'collect_controller';
export const REVEAL_FRAME_CONTROLLER = 'reveal_controller';
export const SKYFLOW_FRAME_CONTROLLER = 'skyflow_controller';
export const FRAME_REVEAL = 'reveal';

export const FRAME_ELEMENT = 'element';

export const PUREJS_TYPES = {
  INSERT: 'INSERT',
  DETOKENIZE: 'DETOKENIZE',
  GET_BY_SKYFLOWID: 'GET_BY_SKYFLOWID',
  INVOKE_CONNECTION: 'INVOKE_CONNECTION',
  INVOKE_SOAP_CONNECTION: 'INVOKE_SOAP_CONNECTION',
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
};

export const ELEMENT_EVENTS_TO_IFRAME = {
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
  REVEAL_ELEMENT_SET_ERROR: 'REVEAL_ELEMENT_SET_ERROR',
  REVEAL_ELEMENT_UPDATE_OPTIONS: 'REVEAL_ELEMENT_UPDATE_OPTIONS',
};

export const REVEAL_ELEMENT_OPTIONS_TYPES = {
  TOKEN: 'TOKEN',
  ALT_TEXT: 'ALT_TEXT',
};

export const ELEMENT_EVENTS_TO_CONTAINER = {
  ELEMENT_MOUNTED: 'ELEMENT_MOUNTED',
  ALL_ELEMENTS_MOUNTED: 'ALL_ELEMENTS_MOUNTED',
};

export enum ElementType {
  CVV = 'CVV',
  EXPIRATION_DATE = 'EXPIRATION_DATE',
  CARD_NUMBER = 'CARD_NUMBER',
  CARDHOLDER_NAME = 'CARDHOLDER_NAME',
  INPUT_FIELD = 'INPUT_FIELD',
  PIN = 'PIN',
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
}

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
    },
    sensitive: true,
    // mask: ["XY/YYYY", { X: "[0-1]", Y: "[0-9]" }],
    // regex: /^(0[1-9]|1[0-2])\/([0-9]{4})$/,
  },
  [ElementType.CVV]: {
    name: 'CVV',
    attributes: {
      type: 'text',
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
      maxLength: 12,
      minLength: 4,
    },
    sensitive: true,
    regex: /^$|^[0-9]{4,12}$/,
  },
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

export const INPUT_ICON_STYLES = 'position: absolute; left:8px; top:calc(50% - 10px)';

export const ERROR_TEXT_STYLES = {
  color: '#f44336',
  padding: '2px',
};

export const ALLOWED_ATTRIBUTES = {
  'aria-invalid': 'boolean',
  'aria-required': 'boolean',
  disabled: 'boolean',
  placeholder: 'string',
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
];

// should be in the order of applying the styles
export const STYLE_TYPE = {
  WEBPACKAUTOFILL: '-webkit-autofill',
  BASE: 'base',
  FOCUS: 'focus',
  COMPLETE: 'complete',
  EMPTY: 'empty',
  INVALID: 'invalid',
};
export const REVEAL_ELEMENT_DIV_STYLE = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
};

export const REVEAL_ELEMENT_LABEL_DEFAULT_STYLES = {
  [STYLE_TYPE.BASE]: {
    'margin-bottom': '4px',
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
};

export const connectionConfigParseKeys = ['pathParams', 'queryParams', 'requestBody'];

export const CARD_TYPE_REGEX = {
  [CardType.VISA]: { regex: /^4\d*/, maxCardLength: 19, cardLengthRange: [13, 16] },
  [CardType.MASTERCARD]: { regex: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)\d*/, maxCardLength: 16, cardLengthRange: [16] },
  [CardType.AMEX]: { regex: /^3[47]\d*/, maxCardLength: 15, cardLengthRange: [15] },
  [CardType.DINERS_CLUB]: { regex: /^(36|38|30[0-5])\d*/, maxCardLength: 16, cardLengthRange: [14, 15, 16, 17, 18, 19] },
  [CardType.DISCOVER]: { regex: /^(6011|65|64[4-9]|622)\d*/, maxCardLength: 16, cardLengthRange: [16, 17, 18, 19] },
  [CardType.JCB]: { regex: /^35\d*/, maxCardLength: 19, cardLengthRange: [16, 17, 18, 19] },
  [CardType.HIPERCARD]: { regex: /^606282\d*/, maxCardLength: 19, cardLengthRange: [14, 15, 16, 17, 18, 19] },
  [CardType.UNIONPAY]: { regex: /^62\d*/, maxCardLength: 19, cardLengthRange: [16, 17, 18, 19] },
  [CardType.MAESTRO]: { regex: /^(5018|5020|5038|5043|5[6-9]|6020|6304|6703|6759|676[1-3])\d*/, maxCardLength: 19, cardLengthRange: [12, 13, 14, 15, 16, 17, 18, 19] },
};
export const DEFAULT_CARD_LENGTH_RANGE = [0, 12, 13, 14, 15, 16, 17, 18, 19];

export const CARD_ENCODED_ICONS = {
  [CardType.DEFAULT]: defaultCardIcon,
  [CardType.AMEX]: amexIcon,
  [CardType.DINERS_CLUB]: dinnersClubIcon,
  [CardType.DISCOVER]: discoverIcon,
  [CardType.HIPERCARD]: hipperCardIcon,
  [CardType.JCB]: jcbIcon,
  [CardType.MAESTRO]: maestroIcon,
  [CardType.MASTERCARD]: maseterCardIcon,
  [CardType.UNIONPAY]: unionPayIcon,
  [CardType.VISA]: visaCardIcon,
};

export const EXPIRY_DATE_MASK = {
  'MM/YYYY': ['XY/YYYY', { X: '[0-1]', Y: '[0-9]' }],
  'MM/YY': ['XY/YY', { X: '[0-1]', Y: '[0-9]' }],
  'YYYY/MM': ['YYYY/XY', { X: '[0-1]', Y: '[0-9]' }],
  'YY/MM': ['YY/XY', { X: '[0-1]', Y: '[0-9]' }],
};
export const DEFAULT_EXPIRATION_DATE_FORMAT = 'MM/YY';
export const ALLOWED_EXPIRY_DATE_FORMATS = [DEFAULT_EXPIRATION_DATE_FORMAT, 'YYYY/MM', 'YY/MM', 'MM/YYYY'];

export const soapReqXmlErrors = [SKYFLOW_ERROR_CODE.INVALID_ELEMENT_ID_IN_SOAP_REQUEST_XML,
  SKYFLOW_ERROR_CODE.ELEMENT_NOT_MOUNTED_IN_SOAP_REQUEST_XML];
export const soapResXmlErrors = [SKYFLOW_ERROR_CODE.INVALID_ELEMENT_ID_IN_SOAP_RESPONSE_XML,
  SKYFLOW_ERROR_CODE.ELEMENT_NOT_MOUNTED_IN_SOAP_RESPONSE_XML,
  SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT_IN_SOAP_RESPONSE_XML];

export const PATH_NOT_FOUND_IN_RES_XML = 'skyflow: Path not found';

export const FORMAT_REGEX = ':FORMAT_REGEX:';

export const REPLACE_TEXT = ':REPLACE_TEXT:';

export enum ContentType {
  APPLICATIONORJSON = 'application/json',
  TEXTORPLAIN = 'text/plain',
  TEXTORXML = 'text/xml',
  FORMURLENCODED = 'application/x-www-form-urlencoded',
  FORMDATA = 'multipart/form-data',
}
