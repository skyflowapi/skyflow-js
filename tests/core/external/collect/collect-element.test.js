/*
  Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import CollectElement from '../../../../src/core/external/collect/collect-element';
import SkyflowError from '../../../../src/libs/skyflow-error';
import { LogLevel, Env, ValidationRuleType } from '../../../../src/utils/common';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, SDK_DETAILS } from '../../../../src/core/constants';
import SKYFLOW_ERROR_CODE from '../../../../src/utils/constants';
import { checkForElementMatchRule } from '../../../../src/core-utils/collect';
import { ContainerType } from '../../../../src/skyflow';
import EventEmitter from '../../../../src/event-emitter';

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

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

const composableElementName = 'element:group:YXJ5X2NhcmQuY3Z2cGlpX2ZpZWxkcy5wcmlt';
const composableInput = {
  table: 'pii_fields',
  column: 'primary_card.card_numner',
  inputStyles: {
    base: {
      color: '#1d1d1d',
    },
  },

  placeholder: 'XXXX XXXX XXXX XXXX',
  label: 'card number',
  type: 'CARD_NUMBER',
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
  elementType: 'CVV',
  name: input.column,
  ...input,
};

const destroyCallback = jest.fn();
const updateCallback = jest.fn();

const groupEmittFn = jest.fn();
let groupOnCb;
const groupEmiitter = {
  _emit: groupEmittFn,
  on:jest.fn().mockImplementation((args,cb)=>{
    groupOnCb = cb;
  })
}

jest.mock('../../../../src/event-emitter');
let emitterSpy;
EventEmitter.mockImplementation(() => ({
  on: jest.fn().mockImplementation((name, cb) => {emitterSpy = cb}),
  _emit: jest.fn()
}));

const on = jest.fn();
describe('collect element', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off: jest.fn()
    });
  });

  it('constructor',  () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id,
      {
        elementName,
        rows,
      },
      {},
      {type:ContainerType.COLLECT,containerId:'containerId'},
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

    element.updateElement({table:'table'});

    expect(element.elementType).toBe(input.type);
    expect(element.isMounted()).toBe(false);
    expect(element.isValidElement()).toBe(true);

    const heightCb = emitSpy.mock.calls[1][2];
    heightCb({
      height:'123'
    })

  });

  it('constructor with element mounted',  () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id,
      {
        elementName,
        rows,
      },
      {},
      {type:ContainerType.COLLECT,containerId:'containerId'},
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });

    const inputEvent = onSpy.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT);
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls
      .filter((data)=> data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED);
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

  
    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.READY,
      value: {},
    }, cb2);

    expect(element.isMounted()).toBe(false);

    mountCb({
      name:elementName,
    },cb3)

    
    setTimeout(()=>{
        expect(element.isMounted()).toBe(true);
    },0)
    cb3();
    const heightCb = emitSpy.mock.calls[1][2];
      heightCb({
        height:'123'
      })
  });

  it('constructor with composable ',  () => {
    const onSpy = jest.spyOn(bus, 'on');
    
    const element = new CollectElement(id,
      {
        elementName,
        rows:composableRows,
      },
      {},
      {type:ContainerType.COMPOSABLE, containerId:'containerId',isMounted:true},
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
      );

    const inputEvent = onSpy.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT);
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    inputCb({
      name: composableElementName,
      event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
      value: {},
    }, cb2);
    inputCb({
      name: composableElementName,
      event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
      value: {},
    }, cb2);
    inputCb({
      name: composableElementName,
      event: ELEMENT_EVENTS_TO_CLIENT.CHANGE,
      value: {},
    }, cb2);
    inputCb({
      name: composableElementName,
      event: ELEMENT_EVENTS_TO_CLIENT.READY,
      value: {},
    }, cb2);

    expect(element.elementType).toBe(input.type);
    expect(element.isMounted()).toBe(false);
    expect(element.isValidElement()).toBe(true);
    expect(element.getID()).toBe(id)

    cb2();
  });

  it('constructor with composable mounted',  () => {
    const onSpy = jest.spyOn(bus, 'on');
    
    const element = new CollectElement(
      id,
      {
        elementName,
        rows:composableRows,
      },
      {},
      {type:ContainerType.COMPOSABLE, containerId:'containerId',isMounted:true},
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD },
      groupEmiitter
      );

    const inputEvent = onSpy.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT);
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls
    .filter((data)=> data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED);
  const mountCb = mountedEvent[0][1];
  const cb3 = jest.fn();

    inputCb({
      name: composableElementName,
      event: ELEMENT_EVENTS_TO_CLIENT.READY,
      value: {},
    }, cb2);

    expect(element.isMounted()).toBe(false);


    mountCb({
      name:elementName,
    },cb3)

    
    setTimeout(()=>{
        expect(element.isMounted()).toBe(true);
    },0)
    cb3();
  
  });

  it('mount, invalid dom element', () => {
    const element = new CollectElement(id, {
      elementName,
      rows,
    },
    {},
    {type:ContainerType.COLLECT,containerId:'containerId',isMounted:false},
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD },groupEmiitter);
    groupOnCb({containerId:'containerId'});
    expect(() => { element.mount('#123'); }).not.toThrow(SkyflowError);

  });

  it('collect element, not a single element', () => {
    try {
      const element = new CollectElement(id, {
        elementName,
        rows,
      },
      {},
      {containerId:'containerId',isMounted:false},
      false,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD });
    } catch (err) {
      console.log(err);
      expect(err).toBeDefined();
    }
  });

  it('mount after container mount, valid dom element ', () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id, {
      elementName,
      rows,
    },
    {},
    {containerId:'containerId',isMounted:false},
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD },groupEmiitter);

    const div = document.createElement('div');

    expect(element.isMounted()).toBe(false);

    groupOnCb({containerId:'containerId'});
    element.mount(div);
    const frameReayEvent = onSpy.mock.calls
      .filter((data) => data[0] === `${ELEMENT_EVENTS_TO_IFRAME.FRAME_READY}containerId`);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: `${elementName}:containerId` + ':ERROR',
    }, cb2);
    setTimeout(()=>{
      expect(element.isMounted()).toBe(true);
    },0);  
    element.updateElementGroup(updateElementInput);
    element.unmount();
  });

  it('mount composable, valid dom element ', () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id, {
      elementName,
      rows:composableRows,
    },
    {},
    {type:ContainerType.COMPOSABLE, containerId:'containerId',isMounted:true},
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD },groupEmiitter);

    const div = document.createElement('div');

    expect(element.isMounted()).toBe(false);

    groupOnCb({containerId:'containerId'});
    element.mount(div);
    const frameReayEvent = onSpy.mock.calls
      .filter((data) => data[0] === `${ELEMENT_EVENTS_TO_IFRAME.FRAME_READY}containerId`);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: `${elementName}:containerId` + ':ERROR',
    }, cb2);
    setTimeout(()=>{
      expect(element.isMounted()).toBe(true);
    },0);  
    element.updateElementGroup(updateElementInput);
    element.unmount();
  });


  it('mount before conatiner mount, valid dom element ', () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id, {
      elementName,
      rows,
    },
    {},
    {type:ContainerType.COLLECT, containerId:'containerId',isMounted:true},
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD },groupEmiitter);

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
    groupOnCb({containerId:'containerId'});
    setTimeout(()=>{
      expect(element.isMounted()).toBe(true);
    },0);  
    element.updateElementGroup(updateElementInput);
    element.unmount();
  });

  it('mount before conatiner mount, valid dom element  isMounted false ', () => {
    const onSpy = jest.spyOn(bus, 'on');

    const element = new CollectElement(id, {
      elementName,
      rows,
    },
    {},
    {type:ContainerType.COLLECT, containerId:'containerId',isMounted:false},
    true,
    destroyCallback,
    updateCallback,
    { logLevel: LogLevel.ERROR, env: Env.PROD },groupEmiitter);

    const div = document.createElement('div');

    expect(element.isMounted()).toBe(false);
   
    element.mount(div);

    groupOnCb({containerId:'containerId'});
    setTimeout(()=>{
      expect(element.isMounted()).toBe(true);
    },0);  
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

  it('updates element properties when element is mounted',  () => {
    const onSpy = jest.spyOn(bus, 'on');
    const element = new CollectElement(id,
      { elementName, rows },
      {},
      { type: ContainerType.COLLECT, containerId: 'containerId' },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputEvent = onSpy.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT);
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls
      .filter((data)=> data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED);
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.READY,
      value: {},
    }, cb2);

    expect(element.isMounted()).toBe(false);
    mountCb({name: elementName}, cb3);
    expect(element.isMounted()).toBe(true);
    element.update({ label :'Henry' });
  });

  it('updates element properties when element is not mounted',  () => {
    const element = new CollectElement(id,
      { elementName, rows },
      {},
      { type: ContainerType.COLLECT, containerId: 'containerId' },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    expect(element.isMounted()).toBe(false);
    expect(element.isUpdateCalled()).toBe(false);
    element.update({ label :'Henry' });
    emitterSpy();
    expect(element.isMounted()).toBe(true);
  });

  it('update element group', () => {
    const onSpy = jest.spyOn(bus, 'on');
    const element = new CollectElement(id,
      { elementName, rows },
      {},
      { type: ContainerType.COLLECT, containerId: 'containerId' },
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const inputEvent = onSpy.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT);
    const inputCb = inputEvent[0][1];
    const cb2 = jest.fn();

    const mountedEvent = onSpy.mock.calls
      .filter((data)=> data[0] === ELEMENT_EVENTS_TO_CLIENT.MOUNTED);
    const mountCb = mountedEvent[0][1];
    const cb3 = jest.fn();

    inputCb({
      name: elementName,
      event: ELEMENT_EVENTS_TO_CLIENT.READY,
      value: {},
    }, cb2);

    expect(element.isMounted()).toBe(false);
    mountCb({name: elementName}, cb3);
    expect(element.isMounted()).toBe(true);
    element.updateElementGroup({ elementName, rows });
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
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_TYPE, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATIONS_TYPE, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_TYPE, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion, 0], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_TYPE, [SDK_DETAILS.sdkName,SDK_DETAILS.sdkVersion, 0], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_VALIDATION_RULE_PARAMS, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion, 0], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_VALIDATION_RULE_PARAMS, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion, 0], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_REGEX_IN_REGEX_MATCH_RULE, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion, 0], true),
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
      new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_MIN_AND_MAX_IN_LENGTH_MATCH_RULE, [SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion, 0], true),
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
    } catch (err) {
      console.log(err);
      expect(err).toBeUndefined();
    }
  });
});

describe('collect element methods', () => {
  const emitSpy = jest.spyOn(bus, 'emit');
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

  it('invalid on listener - 4', () => {
    try {
      testCollectElementDev.on('CHANGE', {key:'value'});
    } catch (err) {
      expect(err).toBeDefined();
    }
  });


  it('valid on listener return state in handler - 1', () => {
    let handlerState;
    const handler = (state)=>{
      handlerState = state
    };
    const mockState = {
      "name":"cardnumberiframe",
      "isEmpty": false,
      "isValid": false,
      "isFocused": true,
      "value": "4111",
      "elementType": "CARD_NUMBER",
      "isRequired": true,
      "selectedCardScheme": "",
      "isComplete":false
  }
    // try {
      testCollectElementDev.on('CHANGE', handler);
      emitterSpy(mockState);
      expect(handlerState).toEqual(mockState)
    // } catch (err) {
    //   expect(err).toBeUndefined();
    // }
  });

  it('valid on listener return state in handler - 2', () => {
    let handlerState;
    const handler = (state)=>{
      handlerState = state
    };
    const mockState = {
      "name":"cardnumberiframe",
      "isEmpty": false,
      "isValid": false,
      "isFocused": true,
      "value": undefined,
      "elementType": "CVV",
      "isRequired": true,
      "selectedCardScheme": "",
      "isComplete":false
  }
    // try {
      testCollectElementDev.on('CHANGE', handler);
      emitterSpy(mockState);
      expect(handlerState).toEqual(mockState)
    // } catch (err) {
    //   expect(err).toBeUndefined();
    // }
  });

  it('should create a ResizeObserver when mounted', () => {
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
    let div = document.createElement('div')
    div.setAttribute('id', 'id1')
    testCollectElementProd.mount(div);
    
    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver.observe).toHaveBeenCalledWith(
      div
    );
    div.style.display = 'none'
    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver.observe).toHaveBeenCalledWith(
      div
    );
    testCollectElementProd.unmount();
    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver.disconnect).toHaveBeenCalled();

  });
  it('ResizeObserver should get disconnect when unmounted', () => {
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
    let div = document.createElement('div')
    div.setAttribute('id', 'id1')
    document.body.appendChild(div);
    testCollectElementProd.mount('#id1');

    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver.observe).toHaveBeenCalledWith(document.querySelector('#id1'))

    testCollectElementProd.unmount();
    expect(ResizeObserver).toHaveBeenCalled();
    expect(testCollectElementProd.resizeObserver.disconnect).toHaveBeenCalled();
  });

  // it('update element in DEV environment', () => {
  //   const collectElement = new CollectElement(id,
  //     { elementName,rows },
  //     {},
  //     'containerId',
  //     true,
  //     destroyCallback,
  //     updateCallback,
  //     { logLevel: LogLevel.ERROR, env: Env.DEV },
  //   );

  //   const testUpdateOptions = {
  //     table: 'table',
  //     inputStyles: {
  //       base: {
  //         color: 'blue'
  //       }
  //     }
  //   };
  //   expect(collectElement.isMounted()).toBe(false);
  //   expect(collectElement.isUpdateCalled()).toBe(false);
  //   collectElement.update(testUpdateOptions);
  // });

  // it('update element in DEV environment when element is mounted', () => {
  //   const collectElement = new CollectElement(id,
  //     { elementName,rows },
  //     {},
  //     'containerId',
  //     true,
  //     destroyCallback,
  //     updateCallback,
  //     { logLevel: LogLevel.ERROR, env: Env.PROD }
  //   );

  //   const testUpdateOptions = {
  //     table: 'table',
  //     inputStyles: {
  //       base: {
  //         color: 'blue'
  //       }
  //     }
  //   };

  //   expect(collectElement.isMounted()).toBe(false);
  //   expect(collectElement.isUpdateCalled()).toBe(false);

  //   const div = document.createElement('div');
  //   collectElement.mount(div)
  //   collectElement.update(testUpdateOptions);

  //   setTimeout(() => {
  //     expect(collectElement.isMounted()).toBe(true);
  //     expect(collectElement.updateElement).toBeCalledTimes(1);
  //     expect(collectElement.isUpdateCalled()).toBe(false);
  //   }, 0);
  //   collectElement.unmount();
  // });
  
  // it('update element in PROD environment', () => {
  //   const testUpdateOptions = {
  //     table: 'table',
  //     inputStyles: {
  //       base: {
  //         color: 'blue'
  //       }
  //     }
  //   };
  //   expect(testCollectElementProd.isMounted()).toBe(false);
  //   expect(testCollectElementProd.isUpdateCalled()).toBe(false);
  //   testCollectElementProd.update(testUpdateOptions);
  // });
});