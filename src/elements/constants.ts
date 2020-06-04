export const FRAME_CONTROLLER = "controller";

export const ELEMENT_EVENTS_TO_CLIENT = {
  CHANGE: "Change",
  READY: "Ready",
  FOCUS: "Focus",
  BLUR: "Blur",
  ESCAPE: "Escape",
  CLICK: "Click",
  ERROR: "Error",
};

export const ELEMENT_EVENTS_TO_IFRAME = {
  FRAME_READY: "FRAME_READY",
  READY_FOR_CLIENT: "READY_FOR_CLIENT",
  TOKENIZATION_REQUEST: "TOKENIZATION_REQUEST",
  INPUT_EVENT: "INPUT_EVENT",
  DESTROY_FRAME: "DESTROY FRAME",
};
//   'ADD_CLASS',
//   'AUTOFILL_EXPIRATION_DATE',
//   'BIN_AVAILABLE',
//   'CARD_FORM_ENTRY_HAS_BEGUN',
//   'CLEAR_FIELD',
//   'CONFIGURATION',
//   'FRAME_READY',
//   'INPUT_EVENT',
//   'READY_FOR_CLIENT',
//   'REMOVE_ATTRIBUTE',
//   'REMOVE_CLASS',
//   'REMOVE_FOCUS_INTERCEPTS',
//   'SET_ATTRIBUTE',
//   'SET_MESSAGE',
//   'SET_MONTH_OPTIONS',
//   'TOKENIZATION_REQUEST',
//   'TRIGGER_FOCUS_CHANGE',
//   'TRIGGER_INPUT_FOCUS',
//   'VALIDATE_STRICT'

export const ELEMENTS: Record<
  string,
  { attributes: any; sensitive: boolean; validator: (string) => boolean }
> = {
  firstName: {
    attributes: {
      type: "text",
    },
    sensitive: false,
    validator: function (value: string) {
      return /^([A-Z][a-z]+([ ]?[a-z]?['-]?[A-Z][a-z]+)*)$/.test(value);
    },
  },
  lastName: {
    attributes: {
      type: "text",
    },
    sensitive: false,
    validator: function (value: string) {
      return /^([A-Z][a-z]+([ ]?[a-z]?['-]?[A-Z][a-z]+)*)$/.test(value);
    },
  },
  dob: {
    attributes: {
      type: "date",
      pattern: "\\d{2}/\\d{2}/\\d{4}",
    },
    sensitive: true,
    validator: function (value: string) {
      return /^(((0[1-9]|[12][0-9]|3[01])[- /.](0[13578]|1[02])|(0[1-9]|[12][0-9]|30)[- /.](0[469]|11)|(0[1-9]|1\d|2[0-8])[- /.]02)[- /.]\d{4}|29[- /.]02[- /.](\d{2}(0[48]|[2468][048]|[13579][26])|([02468][048]|[1359][26])00))$/s.test(
        value
      );
    },
  },
  phoneNumber: {
    attributes: {
      type: "number",
    },
    sensitive: false,
    validator: function (value: string) {
      return /^((\+?( |-|\.)?\d{1,2}( |-|\.)?)?(\(?\d{3}\)?|\d{3})( |-|\.)?(\d{3}( |-|\.)?\d{4}))$/.test(
        value
      );
    },
  },
  ssn: {
    attributes: {
      type: "text",
    },
    sensitive: true,
    validator: function (value: string) {
      return /^(([0-9]{9})|([0-9]{3}-[0-9]{2}-[0-9]{4})|([0-9]{2}-[0-9]{7}))$/.test(
        value
      );
    },
  },
};

export const INPUT_DEFAULT_STYLES = {
  height: "100%",
  width: "100%",
  margin: 0,
  padding: 0,
  border: 0,
  position: "relative",
};

export const IFRAME_DEFAULT_STYLES = {
  height: "100%",
  width: "100%",
  margin: 0,
  padding: 0,
  border: 0,
  position: "absolute",
  top: 0,
  left: 0,
};

export const CONTROLLER_STYLES = {
  position: "absolute",
  top: 0,
  width: 0,
  height: 0,
  visibility: "hidden",
  left: "-99999999px",
};

export const ALLOWED_ATTRIBUTES = {
  "aria-invalid": "boolean",
  "aria-required": "boolean",
  disabled: "boolean",
  placeholder: "string",
};

export const ALLOWED_STYLES = [
  "-moz-appearance",
  "-moz-osx-font-smoothing",
  "-moz-tap-highlight-color",
  "-moz-transition",
  "-webkit-appearance",
  "-webkit-font-smoothing",
  "-webkit-tap-highlight-color",
  "-webkit-transition",
  "appearance",
  "color",
  "direction",
  "font",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-variant-alternates",
  "font-variant-caps",
  "font-variant-east-asian",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-weight",
  "letter-spacing",
  "line-height",
  "margin",
  "opacity",
  "outline",
  "padding",
  "text-shadow",
  "transition",
];

// should be in the order of applying the styles
export const STYLE_TYPE = {
  WEBPACKAUTOFILL: "-webkit-autofill",
  BASE: "base",
  FOCUS: "focus",
  COMPLETE: "complete",
  EMPTY: "empty",
  INVALID: "invalid",
};
