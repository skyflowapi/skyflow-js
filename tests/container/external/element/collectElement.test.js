import bus from 'framebus';
import Element from '../../../../src/container/external/element';
import SkyflowError from '../../../../src/libs/SkyflowError';
import { LogLevel, Env } from '../../../../src/utils/common';
// import Bus from './../../../../src/libs/Bus';
import { ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/container/constants';

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
      name: elementName+':containerId',
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
