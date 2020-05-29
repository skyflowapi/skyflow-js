export const FRAME_CONTROLLER = "controller";

export const ELEMENT_EVENTS_TO_CLIENT = {
  CHANGE: "Change",
  READY: "Ready",
  FOCUS: "Focus",
  BLUR: "Blur",
  ESCAPE: "Escape",
  CLICK: "Click",
  DESTROY: "Destroy",
};

export const ELEMENTS = {
  firstName: {
    attributes: {
      type: "text",
    },
    sensitive: false,
  },
  lastName: {
    attributes: {
      type: "text",
    },
    sensitive: false,
  },
  dob: {
    attributes: {
      type: "date",
    },
    sensitive: true,
  },
  phoneNumber: {
    attributes: {
      type: "number",
    },
    sensitive: false,
  },
  ssn: {
    attributes: {
      type: "text",
    },
    sensitive: true,
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

export const ELEMENT_EVENTS_TO_IFRAME = {
  FRAME_READY: "FRAME_READY",
  READY_FOR_CLIENT: "READY_FOR_CLIENT",
  TOKENIZATION_REQUEST: "TOKENIZATION_REQUEST",
  INPUT_EVENT: "INPUT_EVENT",
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
