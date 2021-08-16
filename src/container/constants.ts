export const FRAME_CONTROLLER = "controller";

export const FRAME_REVEAL = "reveal";

export const FRAME_ELEMENT = "element";

export const ELEMENT_EVENTS_TO_CLIENT = {
  CHANGE: "Change",
  READY: "Ready",
  FOCUS: "Focus",
  BLUR: "Blur",
  ESCAPE: "Escape",
  CLICK: "Click",
  ERROR: "Error",
  SUCCESS: "Success",
};

export const ELEMENT_EVENTS_TO_IFRAME = {
  FRAME_READY: "FRAME_READY",
  READY_FOR_CLIENT: "READY_FOR_CLIENT",
  TOKENIZATION_REQUEST: "TOKENIZATION_REQUEST",
  INPUT_EVENT: "INPUT_EVENT",
  DESTROY_FRAME: "DESTROY FRAME",
  SET_VALUE: "SET_VALUE",
  CLIENT_REQUEST: "CLIENT_REQUEST",
  GET_ACCESS_TOKEN: "GET_ACCESS_TOKEN"
};

export const ELEMENTS = {
  text: {
    name: "text",
    attributes: {
      type: "text",
    },
    sensitive: false,
    // mask: ["XXX-XX-XXXX", { X: "[0-9]" }]
  },
  textarea: {
    name: "textarea",
    attributes: {
      type: "textarea",
    },
    sensitive: false,
  },
  checkbox: {
    name: "checkbox",
    attributes: {
      type: "checkbox",
    },
    sensitive: false,
  },
  radio: {
    name: "radio",
    attributes: {
      type: "radio",
    },
    sensitive: false,
  },
  password: {
    name: "password",
    attributes: {
      type: "password",
    },
    sensitive: false,
  },
  number: {
    name: "number",
    attributes: {
      type: "number",
    },
    sensitive: false,
  },
  dropdown: {
    name: "dropdown",
    attributes: {
      type: "select",
    },
    sensitive: false,
  },
  firstName: {
    name: "firstName",
    attributes: {
      type: "text",
    },
    sensitive: false,
    replacePattern: ["/[^a-zA-Z'-\\s]/g"],
    regex: /^([A-Z][a-z]+([ ]?[a-z]?['-]?[A-Z][a-z]+)*)$/,
  },
  lastName: {
    name: "lastName",
    attributes: {
      type: "text",
    },
    sensitive: false,
    replacePattern: ["/[^a-zA-Z'-\\s]/g"],
    regex: /^([A-Z][a-z]+([ ]?[a-z]?['-]?[A-Z][a-z]+)*)$/,
  },
  email: {
    name: "email",
    attributes: {
      type: "email",
    },
    sensitive: false,
    regex: /^([a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)$/i,
  },
  dob: {
    name: "dob",
    attributes: {
      type: "date",
      pattern: "\\d{2}/\\d{2}/\\d{4}",
    },
    sensitive: false,
    regex: /^(((0[1-9]|[12][0-9]|3[01])[- /.](0[13578]|1[02])|(0[1-9]|[12][0-9]|30)[- /.](0[469]|11)|(0[1-9]|1\d|2[0-8])[- /.]02)[- /.]\d{4}|29[- /.]02[- /.](\d{2}(0[48]|[2468][048]|[13579][26])|([02468][048]|[1359][26])00))$/,
  },
  mobileNumber: {
    name: "mobileNumber",
    attributes: {
      type: "text",
    },
    replacePattern: ["/[^0-9()+-\\s]/g"],
    sensitive: false,
    regex: /^((\+?( |-|\.)?\d{1,2}( |-|\.)?)?(\(?\d{3}\)?|\d{3})( |-|\.)?(\d{3}( |-|\.)?\d{4}))$/,
  },
  ssn: {
    name: "ssn",
    attributes: {
      type: "text",
    },
    sensitive: true,
    replacePattern: ["/[^0-9-]/g"],
    regex: /^(([0-9]{9})|([0-9]{3}-[0-9]{2}-[0-9]{4})|([0-9]{2}-[0-9]{7}))$/,
  },
  address: {
    name: "address",
    attributes: {
      type: "text",
    },
    sensitive: false,
    regex: /^[#.0-9a-zA-Z\s,-]+$/,
  },
  street: {
    name: "street",
    attributes: {
      type: "text",
    },
    sensitive: false,
  },
  zipCode: {
    name: "zipCode",
    attributes: {
      type: "text",
    },
    sensitive: false,
    replacePattern: ["/[^0-9-\\s]/g"],
    regex: /^[0-9]{4,}$/,
  },
  city: {
    name: "city",
    attributes: {
      type: "text",
    },
    sensitive: false,
    regex: /^[A-Za-z]+(\s[A-Za-z]+)?$/,
  },
  state: {
    name: "state",
    attributes: {
      type: "text",
    },
    sensitive: false,
    regex: /^[A-Za-z]+(\s[A-Za-z]+)?$/,
  },
  income: {
    name: "income",
    attributes: {
      type: "number",
    },
    sensitive: false,
    regex: /^[0-9]+$/,
  },
  cardHolderName: {
    name: "cardHolderName",
    attributes: {
      type: "text",
    },
    sensitive: true,
    regex: /^([a-zA-Z0-9\\ \\,\\.\\-\\']{2,})$/,
  },
  cardNumber: {
    name: "cardNumber",
    attributes: {
      type: "text",
    },
    sensitive: true,
    mask: ["XXXX  XXXX XXXX XXXX", { X: "[0-9]" }],
    regex: /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11})$/
  },
  expireDate: {
    name: "expireDate",
    attributes: {
      type: "text",
    },
    sensitive: true,
    mask: ["XY/YYYY", { X: "[0-1]", Y: "[0-9]" }],
    regex: /^(0[1-9]|1[0-2])\/([0-9]{4}|[0-9]{2})$/
  },
  cvv:{
    name: "cvv",
    attributes: {
      type: "text",
    },
    sensitive: true,
    regex: /^$|^[0-9]{3,4}$/,
  }
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
  "user-select": "none",
};

export const CONTROLLER_STYLES = {
  position: "absolute",
  top: 0,
  width: 0,
  height: 0,
  visibility: "hidden",
  left: "-99999999px",
  "user-select": "none",
};

export const INPUT_STYLES = {
  width: "100%",
  height: "100%",
  border: "0",
  padding: "0",
  margin: "0",
  outline: "none",
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
  "background-color",
  "border",
  "border-radius",
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
  "height",
  "letter-spacing",
  "line-height",
  "margin",
  "opacity",
  "outline",
  "padding",
  "text-decoration",
  "text-shadow",
  "text-transform",
  "transition",
  "width",
];

export const ALLOWED_PSEUDO_STYLES = [
  ":hover",
  ":focus",
  "::placeholder",
  "::selection",
  ":disabled",
  ":-webkit-autofill",
];

export const ALLOWED_MULTIPLE_FIELDS_STYLES = [
  "height",
  "width",
  "padding",
  "margin",
  "position",
  "display",
  "flex-direction",
  "align-items",
  "justify-content",
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
