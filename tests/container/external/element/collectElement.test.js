import Element from '../../../../src/container/external/element';
import { LogLevel,Env } from '../../../../src/utils/common';

const bus = require('framebus');

const _on = jest.fn();
const _off = jest.fn();
const _target = jest.fn();

bus.target = jest.fn().mockReturnValue({
  on: _on,
  off: _off,
});

const input = {
  table: 'pii_fields',
  column: 'primary_card.cvv',
  styles: {
    base: {
      color: '#1d1d1d',
    },
  },
  placeholder: 'cvv',
  label: 'cvv',
  type: 'CVV',
};

const rows = [
  {
    elements: [
      {
        elementType: input.type,
        name: input.column,
        ...input,
      },
    ],
  },
];

const updateElementInput = {
  elementType: 'CARD_NUMBER',
  name: input.column,
  ...input,
};

const destroyCallback = jest.fn();
const updateCallback = jest.fn();

describe('collect element', () => {
  it('constructor', async () => {
    let element = new Element(
      { 
        elementName: 'element:CVV:cGlpX2ZpZWxkcy5wcmltYXJ5X2NhcmQuY3Z2',
        rows 
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
       { logLevel: LogLevel.ERROR,env:Env.PROD } 
    );

    expect(element.elementType).toBe(input.type);
    expect(element.isMounted()).toBe(false)
    expect(element.isValidElement()).toBe(true)

    element.update(updateElementInput);
  });

  it('get options', async () => {
    const element = new Element(
      { 
        elementName: 'element:CVV:cGlpX2ZpZWxkcy5wcmltYXJ5X2NhcmQuY3Z2',
        rows 
      },
      {},
      'containerId',
      true,
      destroyCallback,
      updateCallback,
      { logLevel: LogLevel.ERROR,env:Env.PROD }
    );

    const options = element.getOptions();
    expect(options.name).toBe(input.column);
  });
});
