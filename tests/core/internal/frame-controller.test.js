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
  LogLevel
} from '../../../src/utils/common';
import EventEmitter from '../../../src/event-emitter';
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_IFRAME,
  CardType
} from '../../../src/core/constants';
import {
  detectCardType
} from '../../../src/utils/validators/index';
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
  isComplete: false,
};

describe('test frame controller', () => {
  let emitSpy;
  // let onSpy;

  beforeEach(() => {
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

    focusCb[0][1]();

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

    const inst = EventEmitter.mock.instances[1];
    const onSpy = inst.on.mock.calls;

    formElement.setValue("2")

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    expect(formElement.getValue()).toBe('02')

    formElement.setValue("1")

    const blurCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.BLUR);


    blurCb[0][1](state);

    expect(formElement.getValue()).toBe('01')


  })

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

    const inst = EventEmitter.mock.instances[1];
    const onSpy = inst.on.mock.calls;

    formElement.setValue("4111 1111 1111 1111")

    const changeCb = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCb[0][1](state);

    expect(formElement.getValue()).toBe('4111 1111 1111 1111')
    expect(detectCardType(formElement.getValue())).toBe(CardType.VISA)

    formElement.setValue("")

    const changeCbEvent = onSpy
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_CLIENT.CHANGE);

    changeCbEvent[0][1](state);

    expect(formElement.getValue()).toBe('')
    expect(detectCardType(formElement.getValue())).toBe(CardType.DEFAULT)

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