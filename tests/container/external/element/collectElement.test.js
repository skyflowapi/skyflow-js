import bus from 'framebus';
import Element from '../../../../src/container/external/element';
import SkyflowError from '../../../../src/libs/SkyflowError';
import { LogLevel, Env, ValidationRuleType } from '../../../../src/utils/common';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/container/constants';
import SKYFLOW_ERROR_CODE from '../../../../src/utils/constants';

const elementName = 'element:CVV:cGlpX2ZpZWxkcy5wcmltYXJ5X2NhcmQuY3Z2';

const input = {
  table: 'pii_fields',
  column: 'primary_card.cvv',
  inputStyles: {
    base: {
      color: '#1d1d1d',
    },
  },

  placeholder: 'cvv',
  label: 'cvv',
  type: 'CVV',
};

const labelStyles = {
  base: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

const errorTextStyles = {
  base: {
    color: '#f44336',
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

const updateElementInput = {
  elementType: 'CVV',
  name: input.column,
  ...input,
};

const destroyCallback = jest.fn();
const updateCallback = jest.fn();

describe('collect element', () => {
  it('constructor', async () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new Element({
      elementName,
      rows,
    },
    {},
    'containerId',
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD });

    const inputEvent = onSpy.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT);
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
      value: {},
    }, cb2);
    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
      value: {},
    }, cb2);
    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
      value: {},
    }, cb2);
    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.READY,
      value: {},
    }, cb2);

    expect(() => {
      inputCb({
        name: elementName,
        event: 'Invalid event',
      }, cb2);
    }).toThrow(SkyflowError);

    expect(element.elementType).toBe(input.type);
    expect(element.isMounted()).toBe(false);
    expect(element.isValidElement()).toBe(true);
  });

  it('mount, invalid dom element', () => {
    const element = new Element({
      elementName,
      rows,
    },
    {},
    'containerId',
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD });

    expect(() => { element.mount('#123'); }).toThrow(SkyflowError);
  });

  it('mount, valid dom element', () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new Element({
      elementName,
      rows,
    },
    {},
    'containerId',
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD });

    const div = document.createElement('div');

    expect(element.isMounted()).toBe(false);
    element.mount(div);

    const frameReayEvent = onSpy.mock.calls
      .filter((data) => data[0] === `${ELEMENT_EVENTS_TO_IFRAME.FRAME_READY}containerId`);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: `${elementName}:containerId` + ':ERROR',
    }, cb2);
    expect(element.isMounted()).toBe(true);

    element.update(updateElementInput);
    element.unmount();
  });

  it('get options', async () => {
    const element = new Element(
      {
        elementName,
        rows,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
    );

    const options = element.getOptions();
    expect(options.name).toBe(input.column);
  });
});

const row = {
  elementName,
  elementType: 'CVV',
  name: input.column,
  labelStyles,
  errorTextStyles,
  ...input,
};

describe('collect element validations', () => {
  it('Invalid ElementType', () => {
    const invalidElementType = [
      {
        elements: [
          {
            ...row,
            elementType: 'inValidElementType',
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidElementType,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_TYPE, [], true),
    );
  });

  it('Invalid validations type', () => {
    const invalidValidations = [
      {
        elements: [
          {
            ...row,
            validations: '',
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidValidations,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATIONS_TYPE, [], true),
    );
  });

  it('Empty validations rule', () => {
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
      const element = new Element({
        elementName,
        rows: invalidValidationRule,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_TYPE, [0], true),
    );
  });

  it('Invalid validations RuleType', () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [{
              type: 'Invalid Rule',
            }],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidValidationRule,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_TYPE, [0], true),
    );
  });

  it('Missing params in validations Rule', () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [{
              type: ValidationRuleType.LENGTH_MATCH_RULE,
            }],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidValidationRule,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_PARAMS, [0], true),
    );
  });

  it('Invalid params in validations Rule', () => {
    const invalidValidationRule = [
      {
        elements: [
          {
            ...row,
            validations: [{
              type: ValidationRuleType.LENGTH_MATCH_RULE,
              params: '',
            }],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidValidationRule,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_PARAMS, [0], true),
    );
  });

  it('Missing regex in REGEX_MATCH_RULE', () => {
    const invalidParams = [
      {
        elements: [
          {
            ...row,
            validations: [{
              type: ValidationRuleType.REGEX_MATCH_RULE,
              params: {
                error: 'Regex match failed',
              },
            }],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidParams,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REGEX_IN_REGEX_MATCH_RULE, [0], true),
    );
  });

  it('Missing min,max in LENGTH_MATCH_RULE', () => {
    const invalidParams = [
      {
        elements: [
          {
            ...row,
            validations: [{
              type: ValidationRuleType.LENGTH_MATCH_RULE,
              params: {
                error: 'length match failed',
              },
            }],
          },
        ],
      },
    ];

    const createElement = () => {
      const element = new Element({
        elementName,
        rows: invalidParams,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    };

    expect(createElement).toThrow(
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE, [0], true),
    );
  });
});
