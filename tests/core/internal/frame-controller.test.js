/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import 'jquery-mask-plugin/dist/jquery.mask.min';
import {
  IFrameFormElement
} from '../../../src/core/internal/iframe-form';
import {
  FrameController,
  FrameElement
} from '../../../src/core/internal/index';
import {
  Env,
  LogLevel,
  ValidationRuleType
} from '../../../src/utils/common';
import EventEmitter from '../../../src/event-emitter';
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  CardType,
  ELEMENTS,
  CUSTOM_ROW_ID_ATTRIBUTE,
  INPUT_KEYBOARD_EVENTS
} from '../../../src/core/constants';
import {
  detectCardType
} from '../../../src/utils/validators/index';
import { ContainerType } from '../../../src/skyflow';
jest.mock('../../../src/event-emitter');

const on = jest.fn();

const tableCol = btoa('table.col');
const collect_element = `element:CVV:${tableCol}`;

const context = {
  logLevel: LogLevel.ERROR,
  env: Env.PROD,
};

const inputStyles = {
  base: {
    border: '1px solid #eae8ee',
    padding: '10px 16px',
    borderRadius: '4px',
    color: '#1d1d1d',
    marginTop: '4px',
  },
  complete: {
    color: '#4caf50',
  },
  empty: {},
  focus: {},
  invalid: {
    color: '#f44336',
  },
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

const state = {
  value: '1',
  isFocused: false,
  isValid: true,
  isEmpty: true,
  isComplete: true,
};

describe('test frame controller', () => {
  let emitSpy;
  // let onSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    // onSpy = jest.spyOn(bus, 'on');

    Object.defineProperty(document, 'referrer', {
      value: ''
    });
    
  });

  test('FrameController constructor', () => {
    const controller = FrameController.init('uuid', LogLevel.ERROR);
    const frameReadyCb = emitSpy.mock.calls[0][2];
    frameReadyCb({
      context,
      clientJSON: {
        config: {
          getBearerToken: jest.fn(),
        },
      },
    });
    expect(controller.controllerId).toBe('uuid');
  });

  test('FrameElement constructor', () => {
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(collect_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const focusCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCb[0][1](state);

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);


    blurCb[0][1](state);

    blurCb[0][1]({
      ...state,
      isValid: false,
      isEmpty: false,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.SET_VALUE);
    setCb[0][1]({
      options: {
        label: 'label',
        inputStyles,
        labelStyles,
        errorTextStyles,
      },
    });

    element.setupInputField();
  });

  test('FrameElement constructor', () => {
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(collect_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const focusCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCb[0][1](state);

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);


    blurCb[0][1](state);

    blurCb[0][1]({
      ...state,
      isValid: false,
      isEmpty: false,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.SET_VALUE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        validations:[
          {
            type:ValidationRuleType.LENGTH_MATCH_RULE,
            params:{
              min:2,
            }
          }
        ]
      },
    });

    element.setupInputField();
  });

  test('card element FrameElement with card type', () => {

    const cardElement = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(cardElement, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      enableCardIcon: true,
    }, div);
  })

  test('card element FrameElement without default card type', () => {

    const cardElement = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(cardElement, {}, context);
    const element = new FrameElement({
      resetEvents: jest.fn(),
      on: jest.fn(),
      getStatus: jest.fn(()=>({
          isFocused: false,
          isValid: false,
          isEmpty: true,
          isComplete: false,
      })),
      fieldType: 'CARD_NUMBER',
      state:{name:''}
  }, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      enableCardIcon: true,
    }, div);
  })


  test('expiration_month FrameElement', () => {

    const month_element = `element:EXPIRATION_MONTH:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(month_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    formElement.setValue("2")

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1]({...state, value:'2'});

    expect(formElement.getValue()).toBe('02')

    formElement.setValue("1")

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);


    blurCb[0][1](state);

    expect(formElement.getValue()).toBe('01')


  })

  test('expiration date FrameElement with YYYY/MM format', () => {

    const expirationDate = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(expirationDate, {}, context);
    const element = new FrameElement(formElement, {
      label: 'expiration_date',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);
    formElement.setFormat('YYYY/MM');
    formElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
    formElement.setValue("2032/1");
    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;
    formElement.onFocusChange(false);
    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);
    blurCb[0][1]({
      ...state,
      value:'2032/1',
    });
    expect(formElement.state.value).toBe('2032/01');

  })
  test('expiration date FrameElement with YY/MM format', () => {

    const expirationDate = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(expirationDate, {}, context);
    const element = new FrameElement(formElement, {
      label: 'expiration_date',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);
    formElement.setFormat('YY/MM');
    formElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
    formElement.setValue("32/1");
    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;
    formElement.onFocusChange(false);
    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);
    blurCb[0][1]({
      ...state,
      value:'32/1',
    });
    expect(formElement.state.value).toBe('32/01');

  })

  test('expiration date FrameElement with composable container', () => {

    const expirationDate = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');
    div.append(document.createElement('input'));
    div.append(document.createElement('input'));

    const formElement = new IFrameFormElement(expirationDate, {}, context);
    const element = new FrameElement(formElement, {
      label: 'expiration_date',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);
    formElement.setFormat('YY/MM');
    formElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
    formElement.containerType = ContainerType.COMPOSABLE;
    formElement.setValue("32/1");
    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1]({
      ...state,
      value:'32/1'
    });

    expect(formElement.state.value).toBe('32/1');

  });

  test('find next element',()=>{
    const expirationDate = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');
    
    const formElement = new IFrameFormElement(expirationDate, {}, context);
    formElement.iFrameName = expirationDate;
    const element = new FrameElement(formElement, {
      label: 'expiration_date',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);
    
    const testDiv = document.createElement('div');
    testDiv.setAttribute('id','row-0')
    testDiv.appendChild(document.createElement('input'));
    testDiv.appendChild(document.createElement('input'));
    testDiv.appendChild(div);
    jest.spyOn(document,'getElementById').mockImplementation(()=>(testDiv));
    
    const testInput = document.createElement('input');
    testInput.setAttribute(CUSTOM_ROW_ID_ATTRIBUTE,'row-0');
    testInput.id = expirationDate;
    div.appendChild(testInput);

    const ele = element.findNextElement(testInput);
    expect(ele).not.toBeNull();
  });

  test('find previous element',()=>{
    const expirationDate = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');
    
    const formElement = new IFrameFormElement(expirationDate, {}, context);
    formElement.iFrameName = expirationDate;
    const element = new FrameElement(formElement, {
      label: 'expiration_date',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);
    
    const testInput = document.createElement('input');
    testInput.setAttribute(CUSTOM_ROW_ID_ATTRIBUTE,'row-0');
    testInput.id = expirationDate;
    div.appendChild(testInput);
    
    const testDiv = document.createElement('div');
    testDiv.setAttribute('id','row-0')
    testDiv.appendChild(document.createElement('input'));
    testDiv.appendChild(document.createElement('input'));
    testDiv.appendChild(div);
    jest.spyOn(document,'getElementById').mockImplementation(()=>(testDiv));
    


    const ele = element.findPreviousElement(testInput);
    expect(ele).not.toBeNull();
  });

  test('test arrowkey functions',()=>{
    const expirationDate = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(expirationDate, {}, context);
    const element = new FrameElement(formElement, {
      label: 'expiration_date',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const spy = jest.spyOn(element,'findNextElement').mockImplementation(()=>(document.createElement('input')));
    const spy2 = jest.spyOn(element,'findPreviousElement').mockImplementation(()=>(document.createElement('input')));
    const mockPrevent = jest.fn();
    
    element.onArrowKeys({
      target:{value:'',selectionEnd:0},
      key:INPUT_KEYBOARD_EVENTS.RIGHT_ARROW,
      preventDefault:mockPrevent,
    });

    expect(mockPrevent).toBeCalled();
    element.onArrowKeys({
      target:{value:'',selectionEnd:0},
      key:INPUT_KEYBOARD_EVENTS.LEFT_ARROW,
      preventDefault:mockPrevent,
    });
    expect(mockPrevent).toBeCalled();

    element.onArrowKeys({
      target:{value:'',selectionEnd:0},
      key:INPUT_KEYBOARD_EVENTS.ENTER,
      preventDefault:mockPrevent,
    });
    expect(mockPrevent).toBeCalled();

    element.onArrowKeys({
      target:{value:'',selectionEnd:0},
      key:INPUT_KEYBOARD_EVENTS.BACKSPACE,
      preventDefault:mockPrevent,
    });
    expect(mockPrevent).toBeCalled();

    element.onArrowKeys({
      target:{value:'1'},
      key:'Digit1',
      preventDefault:mockPrevent,
    });
    

  });

  test('card_number FrameElement', () => {

    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(card_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    formElement.setValue("4111111111111111")
    element.setValue('4111111111111111')

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1]({...state, value:'4111111111111111'});

    expect(formElement.getValue()).toBe('4111 1111 1111 1111')
    expect(detectCardType(formElement.getValue())).toBe(CardType.VISA)

    formElement.setValue("")
    element.setValue('')

    const changeCbEvent = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCbEvent[0][1]({...state,value:''});

    expect(formElement.getValue()).toBe('')
    expect(detectCardType(formElement.getValue())).toBe(CardType.DEFAULT)

    const focusCbEvent = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCbEvent[0][1](state);

    expect(formElement.getValue()).toBe('')
  })

  test('card_number Input FrameElement', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      "target": {
        checkValidity: jest.fn(),
        "value": "4111111111111111"
      }
    }
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValue("4111111111111111");
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    element.onInputChange(inputEvent);
    // expect(formElement.getValue()).toBe('')
  })

  test('card_number Input With mask FrameElement', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      "target": {
        checkValidity: jest.fn(),
        "value": "4111111111111111"
      }
    }
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        "X": {}
      }
    ]);
    formElement.setValue("4111111111111111");
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    element.onInputChange(inputEvent);
    // expect(formElement.getValue()).toBe('')
  })


  test('card_number Input With mask sucess caseFrameElement', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      "target": {
        checkValidity: jest.fn(),
        "value": "41111111111111119"
      }
    }
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        "X": {}
      }
    ]);
    formElement.setValue("4");
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    element.onInputChange(inputEvent);
    // expect(formElement.getValue()).toBe('')
  })

  test('card_number extra input on FrameElement', () => {

    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(card_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    formElement.setValue("41111111111111112")
    element.setValue('41111111111111112')

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1]({...state, value:'41111111111111112'});

    expect(formElement.getValue()).toBe('4111 1111 1111 1111')
    expect(detectCardType(formElement.getValue())).toBe(CardType.VISA)
  })

  test('expiration_date FrameElement', () => {

    const date_element = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(date_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);
  })


  test('expiration_date FrameElement with required', () => {

    const date_element = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(date_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      required:true,
      inputStyles,
      labelStyles:{...labelStyles,requiredAsterisk:{ color:'green'}},
      errorTextStyles,
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);
  })

  test('expiration_date FrameElement with global styles', () => {

    const date_element = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(date_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles:{...inputStyles,global:{'@import':'https://font-url.com'}},
      labelStyles:{...labelStyles,global:{'@import':'https://font-url.com'}},
      errorTextStyles:{...errorTextStyles,global:{'@import':'https://font-url.com'}},
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);
  })


  test('copy feature in FrameElements', () => {

    const date_element = `element:EXPIRATION_DATE:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(date_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      enableCopy: true
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);
  })
});