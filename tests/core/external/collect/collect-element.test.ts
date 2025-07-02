/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import bus from "framebus";
import CollectElement from "../../../../src/core/external/collect/collect-element";
import SkyflowError from "../../../../src/libs/skyflow-error";
import {
  LogLevel,
  Env,
  ValidationRuleType,
  CollectElementInput,
  LabelStyles,
  ErrorTextStyles,
  ElementState,
} from "../../../../src/utils/common";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  ElementType,
} from "../../../../src/core/constants";
import SKYFLOW_ERROR_CODE from "../../../../src/utils/constants";
import { ContainerType } from "../../../../src/skyflow";
import EventEmitter from "../../../../src/event-emitter";
import SkyflowContainer from "../../../../src/core/external/skyflow-container";
import { Metadata } from "../../../../src/core/internal/internal-types";

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const elementName = "element:CVV:cGlpX2ZpZWxkcy5wcmltYXJ5X2NhcmQuY3Z2";
const id = "id";
const input: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.cvv",
  inputStyles: {
    base: {
      color: "#1d1d1d",
    },
  },
  placeholder: "cvv",
  label: "cvv",
  type: ElementType.CVV,
};

const composableElementName =
  "element:group:YXJ5X2NhcmQuY3Z2cGlpX2ZpZWxkcy5wcmlt";

const composableInput: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.card_numner",
  inputStyles: {
    base: {
      color: "#1d1d1d",
    },
  },
  placeholder: "XXXX XXXX XXXX XXXX",
  label: "card number",
  type: ElementType.CARD_NUMBER,
};

const labelStyles: LabelStyles = {
  base: {
    fontSize: "16px",
    fontWeight: "bold",
  },
};

const errorTextStyles: ErrorTextStyles = {
  base: {
    color: "#f44336",
  },
};

const rows = [
  {
    elements: [
      {
        elementName,
        elementType: input.type,
        name: input.column,
        labelStyles,
        errorTextStyles,
        ...input,
      },
    ],
  },
];

const composableRows = [
  {
    elements: [
      {
        composableElementName,
        elementType: input.type,
        elementName,
        name: input.column,
        labelStyles,
        errorTextStyles,
        ...input,
      },
      {
        composableElementName,
        elementType: composableInput.type,
        name: composableInput.column,
        labelStyles,
        errorTextStyles,
        ...composableInput,
      },
    ],
  },
];

const updateElementInput = {
  elementType: ElementType.CVV,
  name: input.column,
  ...input,
};

const destroyCallback = jest.fn();
const updateCallback = jest.fn();
const groupEmittFn = jest.fn();
let groupOnCb: Function;
const groupEmiitter: EventEmitter = {
  _emit: groupEmittFn,
  on: jest.fn().mockImplementation((_, cb) => {
    groupOnCb = cb;
  }),
  events: {},
  off: jest.fn(),
  hasListener: jest.fn(),
  resetEvents: jest.fn(),
};

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());
const metaData: Metadata = {
  uuid: "123",
  sdkVersion: "",
  sessionId: "1234",
  clientDomain: "http://abc.com",
  containerType: ContainerType.COLLECT,
  clientJSON: {
    config: {
      vaultID: "vault123",
      vaultURL: "https://sb.vault.dev",
      getBearerToken,
    },
    metaData: {
      uuid: "123",
      clientDomain: "http://abc.com",
    },
  },
  skyflowContainer: {
    isFrameControllerReady: true,
  } as unknown as SkyflowContainer,
};

jest.mock("../../../../src/event-emitter");
let emitterSpy: Function;

(EventEmitter as unknown as jest.Mock).mockImplementation(() => ({
  on: jest.fn().mockImplementation((_, cb) => {
    emitterSpy = cb;
  }),
  _emit: jest.fn(),
}));

const on = jest.fn();
describe("testing collect element under various scenarios", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      off: jest.fn(),
    });
  });

  it("tests constructor for collect element", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      { elementName, rows },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName
    );
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
        value: {},
      },
      cb2
    );
    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
        value: {},
      },
      cb2
    );
    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
        value: {},
      },
      cb2
    );
    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(() => {
      inputCb(
        {
          name: elementName,
          event: "Invalid event",
        },
        cb2
      );
    }).toThrow(SkyflowError);

    element.updateElement({ table: "table", elementName: "element" });

    expect(element.elementType).toBe(input.type);
    expect(element.isMounted()).toBe(false);
    expect(element.isValidElement()).toBe(true);

    const heightCb = emitSpy.mock.calls[1][2];
    heightCb({
      height: "123",
    });
  });

  it("tests constructor for collect element with element mounted", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputEvent = onSpy.mock.calls[1][0];
    expect(inputEvent).toBe(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName);
    const inputCb = onSpy.mock.calls[1][1];
    const cb2 = jest.fn();

    const mountEvent = onSpy.mock.calls[2][0];
    expect(mountEvent).toBe(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + elementName);
    const mountCb = onSpy.mock.calls[2][1];
    const cb3 = jest.fn();

    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(element.isMounted()).toBe(false);

    mountCb(
      {
        name: elementName,
      },
      cb3
    );

    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    cb3();
    const heightCb = emitSpy.mock.calls[0][2];
    heightCb({
      name: elementName,
      height: "123",
    });
  });

  it("tests constructor with element mounted for different element", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputCb = onSpy.mock.calls[1][1];
    const inputEvent = onSpy.mock.calls[1][0];
    expect(inputEvent).toBe(ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName);
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED + elementName
    );
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(element.isMounted()).toBe(false);

    mountCb(
      {
        name: elementName,
      },
      cb3
    );

    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    cb3();
    const heightCb = emitSpy.mock.calls[0][2];
    heightCb({
      height: "123",
    });
  });

  it("tests constructor with composable elements", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows: composableRows,
      },
      metaData,
      {
        type: ContainerType.COMPOSABLE,
        containerId: "containerId",
        isMounted: true,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );

    const inputEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName
    );
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    inputCb(
      {
        name: composableElementName,
        event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
        value: {},
      },
      cb2
    );
    inputCb(
      {
        name: composableElementName,
        event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
        value: {},
      },
      cb2
    );
    inputCb(
      {
        name: composableElementName,
        event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
        value: {},
      },
      cb2
    );
    inputCb(
      {
        name: composableElementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(element.elementType).toBe(input.type);
    expect(element.isMounted()).toBe(false);
    expect(element.isValidElement()).toBe(true);
    expect(element.getID()).toBe(id);

    cb2();
  });

  it("tests constructor with composable elements mounted", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows: composableRows,
      },
      metaData,
      {
        type: ContainerType.COMPOSABLE,
        containerId: "containerId",
        isMounted: true,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );

    const inputEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName
    );
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED + elementName
    );
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

    inputCb(
      {
        name: composableElementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(element.isMounted()).toBe(false);

    mountCb(
      {
        name: elementName,
      },
      cb3
    );

    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    cb3();

    const heightCb = emitSpy.mock.calls[0][2];
    heightCb({
      name: elementName,
      height: "123",
    });
  });

  it("tests mount collect element for invalid dom element", () => {
    const element = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );
    expect(() => {
      element.mount("#123");
    }).not.toThrow(SkyflowError);
  });

  it("tests mount collect element after container mount for valid dom element", () => {
    const onSpy = jest.spyOn(bus, "on");
    const element = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );

    const div = document.createElement("div");

    expect(element.isMounted()).toBe(false);

    element.mount(div);
    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    element.updateElementGroup(updateElementInput);
    element.unmount();
  });

  it("tests mount composable element for valid dom element", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows: composableRows,
      },
      metaData,
      {
        type: ContainerType.COMPOSABLE,
        containerId: "containerId",
        isMounted: true,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );

    const div = document.createElement("div");

    expect(element.isMounted()).toBe(false);

    // groupOnCb({containerId:'containerId'});
    element.mount(div);
    // const frameReayEvent = onSpy.mock.calls
    //   .filter((data) => data[0] === `${ELEMENT_EVENTS_TO_IFRAME.FRAME_READY}containerId`);
    // const frameReadyCb = frameReayEvent[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({
    //   name: `${elementName}:containerId` + `:ERROR:${btoa(clientDomain)}`,
    // }, cb2);
    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    element.updateElementGroup(updateElementInput);
    element.unmount();
  });

  it("tests mount collect element before conatiner mount for valid dom element", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: true,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );

    const div = document.createElement("div");

    expect(element.isMounted()).toBe(false);

    element.mount(div);
    // const frameReayEvent = onSpy.mock.calls
    //   .filter((data) => data[0] === `${ELEMENT_EVENTS_TO_IFRAME.FRAME_READY}containerId`);
    // const frameReadyCb = frameReayEvent[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({
    //   name: `${elementName}:containerId` + ':ERROR',
    // }, cb2);
    // groupOnCb({containerId:'containerId'});
    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    element.updateElementGroup(updateElementInput);
    element.unmount();
  });

  it("tests mount collect element before conatiner mount for valid dom element with isMounted false", () => {
    const onSpy = jest.spyOn(bus, "on");

    const element = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
    );

    const div = document.createElement("div");

    expect(element.isMounted()).toBe(false);

    element.mount(div);

    // groupOnCb({containerId:'containerId'});
    setTimeout(() => {
      expect(element.isMounted()).toBe(true);
    }, 0);
    element.update(updateElementInput);
    element.unmount();
  });

  it("should update element properties when element is mounted", () => {
    const onSpy = jest.spyOn(bus, "on");
    const element = new CollectElement(
      id,
      { elementName, rows },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName
    );
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED + elementName
    );
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(element.isMounted()).toBe(false);
    mountCb({ name: elementName }, cb3);
    expect(element.isMounted()).toBe(true);
    element.update({ label: "Henry" });
  });

  it("should update element properties when element is not mounted", () => {
    const element = new CollectElement(
      id,
      { elementName, rows },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    expect(element.isMounted()).toBe(false);
    expect(element.isUpdateCalled()).toBe(false);
    element.update({ label: "Henry" });
    emitterSpy();
    expect(element.isMounted()).toBe(true);
  });

  it("should update element group", () => {
    const onSpy = jest.spyOn(bus, "on");
    const element = new CollectElement(
      id,
      { elementName, rows },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + elementName
    );
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls.filter(
      (data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED + elementName
    );
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

    inputCb(
      {
        name: elementName,
        event: ELEMENT_EVENTS_TO_CLIENT.READY,
        value: {},
      },
      cb2
    );

    expect(element.isMounted()).toBe(false);
    mountCb({ name: elementName }, cb3);
    expect(element.isMounted()).toBe(true);
    element.updateElementGroup({ elementName, rows });
  });
});

const row = {
  elementName,
  elementType: "CVV",
  name: input.column,
  labelStyles,
  errorTextStyles,
  ...input,
};

describe("testing collect element validations", () => {
  it("Invalid ElementType", () => {
    const invalidElementType = [
      {
        elements: [
          {
            ...row,
            elementType: "inValidElementType",
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidElementType,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_TYPE, [], true)
    );
  });

  it("Invalid validations type", () => {
    const invalidValidations = [
      {
        elements: [
          {
            ...row,
            validations: "",
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidValidations,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATIONS_TYPE, [], true)
    );
  });

  it("Empty validations rule", () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [{}],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidValidationRule,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_TYPE,
        [0],
        true
      )
    );
  });

  it("Invalid validations RuleType", () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [
              {
                type: "Invalid Rule",
              },
            ],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidValidationRule,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_TYPE,
        [0],
        true
      )
    );
  });

  it("Missing params in validations Rule", () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [
              {
                type: ValidationRuleType.LENGTH_MATCH_RULE,
              },
            ],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidValidationRule,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_PARAMS,
        [0],
        true
      )
    );
  });

  // above tests in this block are not necessary for typescript ideally.

  it("should throw error for invalid params in validations Rule", () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [
              {
                type: ValidationRuleType.LENGTH_MATCH_RULE,
                params: "",
              },
            ],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidValidationRule,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_PARAMS,
        [0],
        true
      )
    );
  });

  it("should throw error for missing regex param in REGEX_MATCH_RULE", () => {
    const invalidParams = [
      {
        elements: [
          {
            ...row,
            validations: [
              {
                type: ValidationRuleType.REGEX_MATCH_RULE,
                params: {
                  error: "Regex match failed",
                },
              },
            ],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidParams,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_REGEX_IN_REGEX_MATCH_RULE,
        [0],
        true
      )
    );
  });

  it("should throw error for missing min,max params in LENGTH_MATCH_RULE", () => {
    const invalidParams = [
      {
        elements: [
          {
            ...row,
            validations: [
              {
                type: ValidationRuleType.LENGTH_MATCH_RULE,
                params: {
                  error: "length match failed",
                },
              },
            ],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidParams,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    };

    expect(createElement).toThrow(
      new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE,
        [0],
        true
      )
    );
  });

  it("should throw error for missing element param in ELEMENT_VALUE_MATCH_RULE", () => {
    const invalidParams = [
      {
        elements: [
          {
            ...row,
            validations: [
              {
                type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
                params: {
                  error: "length match failed",
                },
              },
            ],
          },
        ],
      },
    ];

    try {
      const element = new CollectElement(
        id,
        {
          elementName,
          rows: invalidParams,
        },
        metaData,
        {
          type: ContainerType.COLLECT,
          containerId: "containerId",
          isMounted: false,
        },
        true,
        destroyCallback,
        updateCallback,
        { logLevel: LogLevel.ERROR, env: Env.PROD }
      );
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });
});

describe("testing collect element methods", () => {
  // const emitSpy = jest.spyOn(bus, "emit");
  // const onSpy = jest.spyOn(bus, "on");
  const testCollectElementProd = new CollectElement(
    id,
    {
      elementName,
      rows,
    },
    metaData,
    {
      type: ContainerType.COLLECT,
      containerId: "containerId",
      isMounted: false,
    },
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD }
  );

  const testCollectElementDev = new CollectElement(
    id,
    {
      elementName,
      rows,
    },
    metaData,
    {
      type: ContainerType.COLLECT,
      containerId: "containerId",
      isMounted: false,
    },
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.DEV }
  );

  it("tests valid on listener return state in handler for element in DEV env", () => {
    let handlerState;
    const handler = (state: ElementState) => {
      handlerState = state;
    };
    const mockState = {
      name: "cardnumberiframe",
      isEmpty: false,
      isValid: false,
      isFocused: true,
      value: "4111",
      elementType: "CARD_NUMBER",
      isRequired: true,
      selectedCardScheme: "",
      isComplete: false,
    };
    testCollectElementDev.on("CHANGE", handler);
    emitterSpy(mockState);
    expect(handlerState).toEqual(mockState);
  });

  it("tests valid on listener return state in handler for element in PROD env", () => {
    let handlerState;
    const handler = (state: ElementState) => {
      handlerState = state;
    };
    const mockState = {
      name: "cardnumberiframe",
      isEmpty: false,
      isValid: false,
      isFocused: true,
      value: undefined,
      elementType: "CVV",
      isRequired: true,
      selectedCardScheme: "",
      isComplete: false,
    };
    testCollectElementProd.on("CHANGE", handler);
    emitterSpy(mockState);
    expect(handlerState).toEqual(mockState);
  });

  it("should create a ResizeObserver when mounted", () => {
    const testCollectElementProd = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    let div = document.createElement("div");
    div.setAttribute("id", "id1");
    testCollectElementProd.mount(div);

    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver?.observe).toHaveBeenCalledWith(
      div
    );
    div.style.display = "none";
    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver?.observe).toHaveBeenCalledWith(
      div
    );
    testCollectElementProd.unmount();
    expect(ResizeObserver).toHaveBeenCalled();
    expect(
      testCollectElementProd.resizeObserver?.disconnect
    ).toHaveBeenCalled();
  });

  it("ResizeObserver should get disconnect when unmounted", () => {
    const testCollectElementProd = new CollectElement(
      id,
      {
        elementName,
        rows,
      },
      metaData,
      {
        type: ContainerType.COLLECT,
        containerId: "containerId",
        isMounted: false,
      },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    let div = document.createElement("div");
    div.setAttribute("id", "id1");
    document.body.appendChild(div);
    testCollectElementProd.mount("#id1");

    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver?.observe).toHaveBeenCalledWith(
      document.querySelector("#id1")
    );

    testCollectElementProd.unmount();
    expect(ResizeObserver).toHaveBeenCalled();
    expect(
      testCollectElementProd.resizeObserver?.disconnect
    ).toHaveBeenCalled();
  });
});
