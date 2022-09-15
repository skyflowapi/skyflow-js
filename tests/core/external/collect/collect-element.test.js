/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import CollectElement from '../../../../src/core/external/collect/collect-element';
import SkyflowError from '../../../../src/libs/skyflow-error';
import { LogLevel, Env, ValidationRuleType } from '../../../../src/utils/common';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/core/constants';
import SKYFLOW_ERROR_CODE from '../../../../src/utils/constants';
import { checkForElementMatchRule } from '../../../../src/core-utils/collect';

const elementName = 'element:CVV:cGlpX2ZpZWxkcy5wcmltYXJ5X2NhcmQuY3Z2';
const id = 'id';
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

    const element = new CollectElement(id,
      {
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
    const element = new CollectElement(id, {
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

  it('collect element, not a single element', () => {
    try {
      const element = new CollectElement(id, {
        elementName,
        rows,
      },
      {},
      'containerId',
      false,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    } catch (err) {
      console.log(err);
      expect(err).toBeDefined();
    }
  });

  it('mount, valid dom element', () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id, {
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
    const element = new CollectElement(id,
      {
        elementName,
        rows,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });

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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
      const element = new CollectElement(id, {
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
  it('Missing element in LENGTH_MATCH_RULE', () => {
    const invalidParams = [
      {
        elements: [
          {
            ...row,
            validations: [{
              type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
              params: {
                error: 'length match failed',
              },
            }],
          },
        ],
      },
    ];

    try {
      const element = new CollectElement(id, {
        elementName,
        rows: invalidParams,
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
      console.log(element);
    } catch (err) {
      console.log(err);
      expect(err).toBeUndefined();
    }
  });
});

describe('collect element methods', () => {
  const onSpy = jest.spyOn(bus, 'on');
  const testCollectElementProd = new CollectElement(id,
    {
      elementName,
      rows,
    },
    {},
    'containerId',
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD });

  const testCollectElementDev = new CollectElement(id, {
    elementName,
    rows,
  },
  {},
  'containerId',
  true,
  destroyCallback,
  updateCallback,
  { logLevel: LogLevel.ERROR, env: Env.DEV });

  it('setError method', () => {
    testCollectElementProd.setError('ErrorText');
  });
  it('resetError method', () => {
    testCollectElementProd.resetError();
  });
  it('setValue method prod env', () => {
    testCollectElementProd.setValue('testValue');
  });
  it('setValue method dev env', () => {
    testCollectElementDev.setValue('testValue');
  });
  it('clearValue method prod env', () => {
    testCollectElementProd.clearValue();
  });
  it('clearValue method dev env', () => {
    testCollectElementDev.clearValue();
  });

  it('unmount method', () => {
    testCollectElementDev.unmount();
  });

  it('checkForElement Match Rule', () => {
    const testValidationsWithElementRule = [{
      type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
    }];
    const testValidationsWithoutElementRule = [{
      type: ValidationRuleType.LENGTH_MATCH_RULE,
    }];
    expect(checkForElementMatchRule(testValidationsWithElementRule)).toBe(true);
    expect(checkForElementMatchRule(testValidationsWithoutElementRule)).toBe(false);
  });
  it('invalid on listener - 1', () => {
    try {
      testCollectElementDev.on('invalid_listener', (state) => {
        console.log(state);
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid on listener - 2', () => {
    try {
      testCollectElementDev.on('CHANGE', null);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid on listener - 3', () => {
    try {
      testCollectElementDev.on('CHANGE', (state) => {
        console.log(state);
      });
    } catch (err) {
      console.log(err);
    }
  });
});
