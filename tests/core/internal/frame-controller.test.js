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
  INPUT_KEYBOARD_EVENTS,
  CARD_ENCODED_ICONS
} from '../../../src/core/constants';
import {
  detectCardType
} from '../../../src/utils/validators/index';
import { ContainerType } from '../../../src/skyflow';
import Skyflow from "../../../src/skyflow";
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
        ],
        skyflowID: 'updated-skyflow-id',
      },
    });

    element.setupInputField();
  });

  test('FrameElement constructor with card number to create card choice dropdown', () => {
    const cardElement = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(cardElement, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      enableCardIcon:true,
      inputStyles:{...inputStyles,cardIcon:{left:'34px'},dropdown:{'background-color':'green'},dropdownIcon:{'left':'36px'}},
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
      label:'cardnumber',
      options: {
        cardMetadata:{
          scheme:[CardType.VISA,CardType.CARTES_BANCAIRES]
        }
      },
    });
    expect(div.getElementsByTagName('select')).toBeDefined();
    expect(div.getElementsByTagName('select').length).toBe(1);
    expect(div.getElementsByTagName('option').length).toBe(3);

    // Verfiy updated icon, should be fist option provided in cardMetadata scheme
    expect(element.domImg.src).toContain(CARD_ENCODED_ICONS.VISA); 

    const select = div.getElementsByTagName('select')[0];
    select.value = CardType.CARTES_BANCAIRES;
    select.dispatchEvent(new Event('change'))
    expect(select.selectedIndex).toBe(2) // cartes bancaries
    expect(element.domImg.src).toContain(CARD_ENCODED_ICONS["CARTES BANCAIRES"]); // Verify updated icon

    select.value = CardType.VISA;
    select.dispatchEvent(new Event('change'))
    expect(select.selectedIndex).toBe(1) // visa
    expect(element.domImg.src).toContain(CARD_ENCODED_ICONS.VISA); // Verify updated icon

    expect(div.getElementsByTagName('img').length).toBe(2); // dropdown + card icon

    setCb[0][1]({
      label:'cardnumber',
      options: {
        cardMetadata:{
          scheme:['visa',CardType.CARTES_BANCAIRES]
        }
      },
    });

    // Should be SDK detected card type since fist option provided in cardMetadata scheme is not supported
    expect(element.domImg.src).toContain(CARD_ENCODED_ICONS.DEFAULT); 

    setCb[0][1]({
      label:'cardnumber',
      options: {
        cardMetadata:{
          scheme:[]
        }
      },
    });

    expect(div.getElementsByTagName('select').length).toBe(0);
    expect(div.getElementsByTagName('img').length).toBe(1); // only cardicon

    element.setupInputField();
  });

  test('FrameElement constructor with card number should not create card choice dropdown, when enableCardIcon is false', () => {
    const cardElement = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(cardElement, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      enableCardIcon:false,
      inputStyles:{...inputStyles,cardIcon:{left:'34px'},dropdown:{'background-color':'green'},dropdownIcon:{'left':'36px'}},
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
      label:'cardnumber',
      options: {
        cardMetadata:{
          scheme:[CardType.VISA,CardType.CARTES_BANCAIRES]
        }
      },
    });
    expect(div.getElementsByTagName('select')).toBeDefined();

    // Card image should not exist
    expect(element.domImg).not.toBeDefined();

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

  test('file element validator should return true, for invalid file name when preserveFileName is false', () => {

    const month_element = `element:FILE_INPUT:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(month_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      preserveFileName:false
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    expect(formElement.validator({
      lastModified: '',
      lastModifiedDate: '',
      name: "sample@ #2 @@1.png", // invalid file name
      size: 48848,
      type: "image/jpeg",
      webkitRelativePath: ""
  })).toBe(true)



  })

  test('file element validator should return false, for invalid file name when preserveFileName is true', () => {

    const month_element = `element:FILE_INPUT:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(month_element, {}, context);
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      preserveFileName:true
    }, div);

    const inst = EventEmitter.mock.instances[0];
    const onSpy = inst.on.mock.calls;

    expect(formElement.validator({
      lastModified: '',
      lastModifiedDate: '',
      name: "sample@ #2 @@1.png", // invalid file name
      size: 48848,
      type: "image/jpeg",
      webkitRelativePath: ""
  })).toBe(false)



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

    formElement.setValue("4111 1111 1111 1111")
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

  test('should verify setErrorOverride when the value is invalid', () => {
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
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      state: {
        error: 'test error'
      }
    });

    element.setupInputField();
  });

  test('should verify setErrorOverride when the field is required and empty', () => {
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
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      state: {
        error: 'test error',
        isRequired: true,
        isEmpty: true
      }
    });

    element.setupInputField();
  });

  test('should verify setErrorOverride when the field is valid and not empty', () => {
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

    const focusCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCb[0][1](state);

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);


    blurCb[0][1](state);

    blurCb[0][1]({
      ...state,
      isValid: true,
      isEmpty: false,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      state: {
        error: 'test error',
        isRequired: true,
        isEmpty: false,
        isValid: true
      }
    });

    element.setupInputField();
  });

  test('should verify setErrorOverride when doesClientHasError i.e., setError is called', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.doesClientHasError = true;
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
      isEmpty: true,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      state: {
        error: 'test error',
        isRequired: true,
        isEmpty: true,
        isValid: false
      }
    });

    element.setupInputField();
  });

  test('should verify setErrorOverride when custom validation is present', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const lengthMatchRule = {
      type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
      params: {
        min : 4, // Optional.
        max : 8, // Optional.
        error: 'Type 4 to 8 characters'
      }
    }

    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValidation([lengthMatchRule]);
    formElement.isCustomValidationFailed = true;
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
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      state: {
        error: 'test error',
        isRequired: false,
        isEmpty: false,
        isValid: false
      }
    });

    element.setupInputField();
  });

  test('should verify setErrorOverride when custom validation is present but validation passed', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');

    const lengthMatchRule = {
      type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
      params: {
        min : 4, // Optional.
        max : 8, // Optional.
        error: 'Type 4 to 8 characters'
      }
    }

    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValidation([lengthMatchRule]);
    formElement.isCustomValidationFailed = false;
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
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      state: {
        error: 'test error',
        isRequired: false,
        isEmpty: false,
        isValid: false
      }
    });

    element.setupInputField();
  });

  test('card_number Input With mask empty state FrameElement', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      "target": {
        checkValidity: jest.fn(),
        "value": ""
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
    expect(formElement.getValue()).toBe('')
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
    expect(formElement.getValue()).toBe('4111 1111 1111 1111')
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
    expect(formElement.getValue()).toBe("4111 1111 1111 1111");
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

    formElement.setValue("4111 1111 1111 1111")
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
  test('should verify setError when the field is required and empty', () => {
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

    const focusCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCb[0][1](state);

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);

    blurCb[0][1](state);

    blurCb[0][1]({
      ...state,
      isValid: false,
      isEmpty: true,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      clientErrorText: 'test client error',
      isTriggerError: true,
      state: {
        error: 'test error',
        isRequired: true,
        isEmpty: true
      }
    });

    element.setupInputField();
  });

  test('card_number Input With masking enabled FrameElement', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "4111111111111111",
        selectionStart: 16,
        selectionEnd: 16,
      },
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111111111111111");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
    element.onInputChange(inputEvent);
  
    expect(formElement.getValue()).toBe("4111 1111 1111 1111");
    expect(inputEvent.target.value).toBe("**** **** **** ****");
  });

  test('card_number Input With masking enabled paste input', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
      checkValidity: jest.fn(),
      value: "4111111111111111",
      selectionStart: 0,
      selectionEnd: 16,
      },
      inputType: "insertFromPaste", // Simulate paste event
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111111111111111");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
    element.onInputChange(inputEvent);
    // element.onInputChange(inputEvent);

    const inputEvent1 = {
      target: {
        checkValidity: jest.fn(),
        value: "4150580996517927",
        selectionStart: 16,
        selectionEnd: 16,
      },
      inputType: "insertFromPaste", // Simulate paste event
    };
    formElement.setValue("");
    element.onInputChange(inputEvent1);
    element.onInputChange(inputEvent1);
  
    expect(formElement.getValue()).toBe("4150 5809 9651 7927");
    expect(inputEvent.target.value).toBe("**** **** **** ****");
  });

  test('cvv Input With masking enabled FrameElement', () => {
    const card_element = `element:CVV:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "123",
      },
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValue("123");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    element.onInputChange(inputEvent);
  });

  test('name Input With masking enabled FrameElement', () => {  //keep
    const card_element = `element:CARDHOLDER_NAME:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "t",
        selectionStart: 1,
        selectionEnd: 1
      },
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValue("t");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    element.onInputChange(inputEvent);

    expect(formElement.getValue()).toBe("t");

  });

  test('name Input With masking enabled FrameElement and simulate input twice', () => {  //keep
    const card_element = `element:CARDHOLDER_NAME:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "te",
        selectionStart: 1,
        selectionEnd: 1
      },
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValue("te");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    element.onInputChange(inputEvent);
    element.onInputChange(inputEvent);

  });

  test('name Input With masking enabled FrameElement and simulate input twice', () => {
    const card_element = `element:CARDHOLDER_NAME:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "te",
        selectionStart: 1,
        selectionEnd: 1
      },
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValue("te");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);

    const inputEvent1 = {
      target: {
        checkValidity: jest.fn(),
        value: "t",
        selectionStart: 2,
        selectionEnd: 2
      },
    };
  
    element.onInputChange(inputEvent);
    element.onInputChange(inputEvent1);

  });

  test('handleDeletion should correctly update actualValue after deletion', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const inputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "4111111111111111",
        selectionStart: 16,
        selectionEnd: 16,
      },
    };
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111111111111111");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    const actualValue = "4111111111111111";
    const maskedValue = "**** **** **** ****";
    const excludeFormatIndexes = [4, 9, 14]; // Spaces in the masked value
    const selectionStart = 0; // Start of the deletion range
    const selectionEnd = 16; // End of the deletion range
  
    const result = element.handleDeletion(
      actualValue,
      maskedValue,
      excludeFormatIndexes,
      selectionStart,
      selectionEnd
    );
  });

  test('countExcludedDigits should return the correct count of excluded digits', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111111111111111");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    const excludeFormatIndex = [2, 4, 6, 8];
    const length = 7;
    const result = element.countExcludedDigits(excludeFormatIndex, length);
    expect(result).toBe(3);
  });

  test('card_number Input With masking enabled FrameElement (simulate typing 2 characters)', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const formElement = new IFrameFormElement(card_element, {}, context);
  
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    // Simulate typing the first character
    const firstInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "4",
        selectionStart: 1,
        selectionEnd: 1,
      },
    };
    element.onInputChange(firstInputEvent);
  
    // Assert after typing the first character
    expect(formElement.getValue()).toBe("4");
    expect(firstInputEvent.target.value).toBe("*");
  
    // Simulate typing the second character
    const secondInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "41",
        selectionStart: 2,
        selectionEnd: 2,
      },
    };
    element.onInputChange(secondInputEvent);
  
    // Assert after typing the second character
    expect(formElement.getValue()).toBe("41");
    expect(secondInputEvent.target.value).toBe("**");
  
    // Simulate typing the third character
    const thirdInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "411",
        selectionStart: 3,
        selectionEnd: 3,
      },
    };
    element.onInputChange(thirdInputEvent);
  
    // Assert after typing the third character
    expect(formElement.getValue()).toBe("411");
    expect(thirdInputEvent.target.value).toBe("***");
  });

  test('card_number Input With masking enabled FrameElement (simulate typing and backspace)', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const formElement = new IFrameFormElement(card_element, {}, context);
  
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    // Simulate typing the first character
    const firstInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "4",
        selectionStart: 1,
        selectionEnd: 1,
      },
    };
    element.onInputChange(firstInputEvent);
  
    // Assert after typing the first character
    expect(formElement.getValue()).toBe("4");
    expect(firstInputEvent.target.value).toBe("*");
  
    // Simulate typing the second character
    const secondInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "41",
        selectionStart: 2,
        selectionEnd: 2,
      },
    };
    element.onInputChange(secondInputEvent);
  
    // Assert after typing the second character
    expect(formElement.getValue()).toBe("41");
    expect(secondInputEvent.target.value).toBe("**");
  
    // Simulate backspace to remove the second character
    const backspaceEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "4",
        selectionStart: 1,
        selectionEnd: 1,
      },
    };
    element.onInputChange(backspaceEvent);
  
    // Assert after backspace
    expect(formElement.getValue()).toBe("4");
    expect(backspaceEvent.target.value).toBe("*");
  });

  test('card_number Input With masking enabled FrameElement (simulate deleting all characters)', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const formElement = new IFrameFormElement(card_element, {}, context);

    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111111111111111");

    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);

    // Simulate deleting all characters
    const deleteEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "",
        selectionStart: 0,
        selectionEnd: 0,
      },
    };
    element.onInputChange(deleteEvent);

    // Assert after deleting all characters
    expect(formElement.getValue()).toBe("");
    expect(deleteEvent.target.value).toBe("");
  });

  test('card_number Input With masking enabled FrameElement (simulate typing after masking)', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
    const formElement = new IFrameFormElement(card_element, {}, context);

    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111");

    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);

    // Simulate typing after masking
    const typingEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "41112",
        selectionStart: 5,
        selectionEnd: 5,
      },
    };
    element.onInputChange(typingEvent);

    // Assert after typing
    expect(formElement.getValue()).toBe("4111 2");
    expect(typingEvent.target.value).toBe("**** *");
  });
  
  test('card_number Input With masking enabled FrameElement (simulate typing and backspace)', () => {
    const card_element = `element:CVV:${tableCol}`;
    const div = document.createElement('div');
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setValue("");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    // Simulate typing the first two characters
    const firstInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "12",
      },
    };
    element.onInputChange(firstInputEvent);
    
    // Simulate typing the third character
    const secondInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "123",
      },
    };
    element.onInputChange(secondInputEvent);
  
    // Simulate backspace to remove the third character
    const backspaceEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "1",
      },
    };
    element.onInputChange(backspaceEvent);
  });
  
  test('cvv Input With masking enabled FrameElement (simulate typing 2 characters)', () => {
    const card_element = `element:CVV:${tableCol}`;
    const div = document.createElement('div');
    const formElement = new IFrameFormElement(card_element, {}, context);

    formElement.setValue("");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
  
    // Simulate typing the first character
    const firstInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "4",
      },
    };
    element.onInputChange(firstInputEvent);
  
    // Simulate typing the second character
    const secondInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "41",
      },
    };
    element.onInputChange(secondInputEvent);
  
    // Simulate typing the third character
    const thirdInputEvent = {
      target: {
        checkValidity: jest.fn(),
        value: "411",
      },
    };
    element.onInputChange(thirdInputEvent);
  });  

  test('should verify setError when the field is empty and valid', () => {
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

    const focusCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCb[0][1](state);

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);

    blurCb[0][1](state);

    blurCb[0][1]({
      ...state,
      isValid: false,
      isEmpty: true,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      clientErrorText: 'test client error',
      isTriggerError: false,
      state: {
        error: 'test error',
        isRequired: true,
        isEmpty: true
      }
    });
    element.setupInputField();
  });

  test('should verify setError when the field is not empty and not valid', () => {
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

    const focusCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.FOCUS);

    focusCb[0][1](state);

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);

    blurCb[0][1](state);

    blurCb[0][1]({
      ...state,
      isValid: false,
      isEmpty: true,
    });

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    const setCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR);
    setCb[0][1]({
      options: {
        label: 'updatedLabel',
        inputStyles,
        labelStyles,
        errorTextStyles,
        table:'updatedTable',
        column:'updateColumn',
        placeholder:'XX',
        skyflowID: 'updated-skyflow-id',
      },
      customErrorText: 'test custom error',
      clientErrorText: 'test client error',
      isTriggerError: true,
      state: {
        error: 'test error',
        isRequired: true,
        isEmpty: false,
        isValid: false
      }
    });

    element.setupInputField();
  });

  test('should verify copy icon when field is empty', () => {
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(collect_element, {enableCopy: true}, context);

    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    element.domCopy = document.createElement('img');
    element.domCopy.src = 'source';
    element.domCopy.title = 'title';
    element.inputParent?.append(formElement.domCopy);

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

    changeCb[0][1]({
      isEmpty: true,
      isValid: true
    });

    element.setupInputField();
  });

  test('should verify copy icon when field is not empty', () => {
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(collect_element, {enableCopy: true}, context);

    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
    }, div);

    element.domCopy = document.createElement('img');
    element.domCopy.src = 'COPY_UTILS.copyIcon';
    element.domCopy.title = 'COPY_UTILS.toCopy';
    element.inputParent?.append(formElement.domCopy);

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

    changeCb[0][1]({
      isEmpty: false,
      isValid: true
    });

    element.setupInputField();
  });

  test('should verify copy icon when img tag is not present', () => {
    const div = document.createElement('div');

    const formElement = new IFrameFormElement(collect_element, {enableCopy: true}, context);

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

    changeCb[0][1]({
      isEmpty: true,
      isValid: true
    });

    element.setupInputField();
  });

  test('should test on applyMask without setting actual mask', () => {
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

    element.applyMask();
  });

  test('should test on applyMask when masking is true', () => {
    const card_element = `element:CARD_NUMBER:${tableCol}`;
    const div = document.createElement('div');
  
    const formElement = new IFrameFormElement(card_element, {}, context);
    formElement.setMask([
      "XXXX XXXX XXXX XXXX XXX",
      {
        X: {},
      },
    ]);
    formElement.setValue("4111111111111111");
  
    const element = new FrameElement(formElement, {
      label: 'label',
      inputStyles,
      labelStyles,
      errorTextStyles,
      masking: true,
      maskingChar: '*',
    }, div);
    element.applyMask();
  });
});