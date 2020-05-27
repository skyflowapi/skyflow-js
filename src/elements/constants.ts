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
  lastName: { sensitive: false },
  dob: { sensitive: true },
  phoneNumber: { sensitive: false },
  ssn: { sensitive: true },
};

export const ELEMENT_EVENTS_TO_IFRAME = {
  FRAME_READY: "FRAME_READY",
  READY_FOR_CLIENT: "READY_FOR_CLIENT",
  TOKENIZATION_REQUEST: "TOKENIZATION_REQUEST",
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
