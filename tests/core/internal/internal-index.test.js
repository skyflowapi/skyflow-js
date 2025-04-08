import bus from 'framebus';
import FrameElement from '../../../src/core/internal/index';
import * as validators from '../../../src/utils/validators';
import * as helpers from '../../../src/utils/helpers';
import { getMaskedOutput } from '../../../src/utils/helpers';
import { COLLECT_FRAME_CONTROLLER, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, CARD_ENCODED_ICONS, INPUT_KEYBOARD_EVENTS, ELEMENT_EVENTS_TO_CLIENT } from '../../../src/core/constants';

describe('FrameElement', () => {
  let mockIFrameFormElement;
  let mockOptions;
  let mockHtmlDivElement;
  let frameElement;

  let emitSpy;
  let targetSpy;
  let on = jest.fn()
  let windowSpy
  let onSpy;

  beforeEach(() => {
    const mockState = {
      value: undefined,
      isFocused: false,
      isValid: false,
      isEmpty: true,
      isComplete: false,
      name: '',
      isRequired: false,
      isTouched: false,
      selectedCardScheme: '',
    };

    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    onSpy = jest.spyOn(bus, 'on');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
        on,
    });
    windowSpy = jest.spyOn(window,'parent','get');

    mockIFrameFormElement = {
      resetEvents: jest.fn(),
      on: jest.fn(),
      setValue: jest.fn(),
      setMask: jest.fn(),
      setValidation: jest.fn(),
      getStatus: jest.fn().mockReturnValue({
        isFocused: false,
        isValid: true,
        isEmpty: true,
        isComplete: false,
        isRequired: false,
        isTouched: false,
        value: '',
      }),
      getValue: jest.fn().mockReturnValue(''),
      getUnformattedValue: jest.fn().mockReturnValue('4111111111111111'),
      onFocusChange: jest.fn(),
      onDropdownSelect: jest.fn(),
      fieldType: ELEMENTS.CARD_NUMBER.name,
      iFrameName: 'mockFrameName',
      cardType: 'DEFAULT',
      state: { ...mockState },
      mask: ['#### #### #### ####'],
    };

    mockOptions = {
      enableCardIcon: true,
      enableCopy: true,
      inputStyles: {
        cardIcon: { color: 'red' },
        dropdownIcon: { color: 'blue' },
        dropdown: { color: 'green' },
        copyIcon: { color: 'yellow' },
      },
      elementName: 'mockElement',
      required: true,
    };

    mockHtmlDivElement = document.createElement('div');

    frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
  });

  it('should initialize properties and call mount in the constructor', () => {
    expect(frameElement.iFrameFormElement).toBe(mockIFrameFormElement);
    expect(frameElement.htmlDivElement).toBe(mockHtmlDivElement);
  });

  it('should reset events and initialize DOM elements', () => {
    frameElement.mount();

    expect(mockIFrameFormElement.resetEvents).toHaveBeenCalled();
    expect(frameElement.labelDiv).toBeDefined();
    expect(frameElement.domLabel).toBeDefined();
    expect(frameElement.domError).toBeDefined();
    expect(frameElement.inputParent).toBeDefined();
    expect(frameElement.domInput).toBeDefined();
  });

  it('should set the correct input type based on fieldType', () => {
    mockIFrameFormElement.fieldType = ELEMENTS.dropdown.name;
    expect(() => {
      frameElement.mount();
    }).toThrow();

    mockIFrameFormElement.fieldType = ELEMENTS.textarea.name;
    frameElement.mount();
    expect(frameElement.domInput.tagName).toBe('TEXTAREA');

    mockIFrameFormElement.fieldType = ELEMENTS.CARD_NUMBER.name;
    frameElement.mount();
    expect(frameElement.domInput.tagName).toBe('INPUT');
  });

  it('should append card icon and dropdown if enableCardIcon is true', () => {
    frameElement.mount();

    expect(frameElement.domImg).toBeDefined();
    expect(frameElement.domImg.src).toContain(CARD_ENCODED_ICONS.DEFAULT);
    expect(frameElement.inputParent.contains(frameElement.domImg)).toBe(true);

    expect(frameElement.dropdownIcon).toBeDefined();
    expect(frameElement.dropdownSelect).toBeDefined();
  });

  it('should handle input focus and blur events', () => {
    frameElement.mount();

    const focusEvent = new FocusEvent('focus');
    const blurEvent = new FocusEvent('blur');

    frameElement.domInput.dispatchEvent(focusEvent);
    expect(mockIFrameFormElement.onFocusChange).toHaveBeenCalledWith(true);

    frameElement.domInput.dispatchEvent(blurEvent);
    expect(mockIFrameFormElement.onFocusChange).toHaveBeenCalledWith(false);
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.FOCUS event', () => {
    frameElement.mount();

    const mockState = {
      value: '',
      isEmpty: true,
      isValid: false,
      error: 'Some error',
    };

    mockIFrameFormElement.on.mock.calls[0][1](mockState);

    expect(frameElement.hasError).toBe(false);
    expect(frameElement.domError.innerText).toBe('');
    expect(mockState.isValid).toBe(true);
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.BLUR event', () => {
    frameElement.mount();

    const mockState = {
      value: '123',
      isEmpty: false,
      isValid: false,
      error: 'Some error',
    };

    mockIFrameFormElement.on.mock.calls[1][1](mockState);

    expect(frameElement.hasError).toBe(true);
    expect(frameElement.domError.innerText).toBe('Some error');
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.CHANGE event', () => {
    mockIFrameFormElement.mask = [
      '9999-9999-9999-9999',
      null,
      { '9': '\\d' },
    ];
    frameElement.mount();

    const mockState = {
      value: '4111111111111111',
      isEmpty: false,
      isValid: true,
      isComplete: true,
    };

    mockIFrameFormElement.on.mock.calls[8][1](mockState);

    expect(frameElement.domCopy.style.display).toBe('block');
    expect(mockIFrameFormElement.setMask).toHaveBeenCalled();
  });

  it('should handle ELEMENT_EVENTS_TO_IFRAME.SET_VALUE event', () => {
    frameElement.mount();

    const mockData = {
      options: {
        validations: ['required'],
        table: 'mockTable',
        column: 'mockColumn',
        label: 'mockLabel',
        placeholder: 'mockPlaceholder',
        inputStyles: { base: { color: 'blue' } },
        labelStyles: { base: { color: 'green' } },
        errorTextStyles: { base: { color: 'red' } },
        skyflowID: 'mockSkyflowID',
        cardMetadata: { scheme: ['VISA', 'MASTERCARD'] },
      },
    };

    mockIFrameFormElement.on.mock.calls[3][1](mockData);

    expect(mockIFrameFormElement.setValidation).toHaveBeenCalledWith(['required']);
    expect(mockIFrameFormElement.tableName).toBe('mockTable');
    expect(mockIFrameFormElement.state.name).toBe('mockColumn');
    expect(frameElement.domLabel.textContent).toBe('mockLabel');
    expect(frameElement.domInput.placeholder).toBe('mockPlaceholder');
  });

  it('should handle ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR event', () => {
    frameElement.mount();

    const mockData = {
      isTriggerError: true,
      clientErrorText: 'Client error',
      state: {
        error: 'Some error',
        isEmpty: false,
        isValid: false,
      },
    };

    mockIFrameFormElement.on.mock.calls[4][1](mockData);

    expect(frameElement.domError.innerText).toBe('Client error');
  });

  it('should handle ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE event', () => {
    frameElement.mount();

    const mockData = {
      customErrorText: 'Custom error',
      state: {
        isEmpty: true,
        isRequired: true,
        isValid: false,
        error: 'Some error',
      },
    };

    mockIFrameFormElement.on.mock.calls[5][1](mockData);

    expect(frameElement.domError.innerText).toBe('Custom error');
  });

  it('should call updateStyleClasses with the current state', () => {
    frameElement.mount();

    expect(mockIFrameFormElement.getStatus).toHaveBeenCalled();
  });

  it('should set up input field correctly in setupInputField', () => {
    frameElement.setupInputField();

    expect(mockIFrameFormElement.setValue).toHaveBeenCalled();
  });

  it('should handle input change in onInputChange', () => {
    const mockEvent = {
      target: { value: '4111111111111111', checkValidity: jest.fn().mockReturnValue(true) },
    };

    const detectCardTypeSpy = jest
    .spyOn(validators, 'detectCardType')
    .mockReturnValue('VISA');

    frameElement.onInputChange(mockEvent);

    expect(detectCardTypeSpy).toHaveBeenCalled();

    detectCardTypeSpy.mockRestore();
  });

  it('should find the previous element in findPreviousElement', () => {
    const mockInput = document.createElement('input');
    mockInput.setAttribute('id', 'mockInput');
    mockInput.setAttribute('data-row-id', 'mockRow');

    const mockParent = document.createElement('div');
    mockParent.setAttribute('id', 'mockRow');
    mockParent.appendChild(mockInput);

    document.body.appendChild(mockParent);

    const result = frameElement.findPreviousElement(mockInput);

    expect(result).toBeUndefined();
  });

  it('should find the next element in findNextElement', () => {
    const mockInput = document.createElement('input');
    mockInput.setAttribute('id', 'mockInput');
    mockInput.setAttribute('data-row-id', 'mockRow');

    const mockParent = document.createElement('div');
    mockParent.setAttribute('id', 'mockRow');
    mockParent.appendChild(mockInput);

    document.body.appendChild(mockParent);

    const result = frameElement.findNextElement(mockInput);

    expect(result).toBeUndefined();
  });

  it('should handle arrow keys in onArrowKeys', () => {
    const mockInput = document.createElement('input');
    mockInput.setAttribute('id', 'mockInput');
    mockInput.value = '4111';
    mockInput.selectionEnd = 4;
  
    const mockEvent = {
      key: INPUT_KEYBOARD_EVENTS.RIGHT_ARROW,
      target: mockInput,
      preventDefault: jest.fn(),
    };
  
    frameElement.findNextElement = jest.fn(() => ({
      focus: jest.fn(),
    }));
  
    frameElement.onArrowKeys(mockEvent);
  
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should handle submit in onSubmit', () => {
    const emitSpy = jest.spyOn(bus, 'emit');

    frameElement.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith(
      ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT + mockIFrameFormElement.iFrameName,
      {
        name: mockIFrameFormElement.iFrameName,
        event: ELEMENT_EVENTS_TO_CLIENT.SUBMIT,
      }
    );
  });


  it('should apply mask without throwing error', () => {
    jest.mock('../../../src/utils/helpers', () => ({
      getMaskedOutput: jest.fn(() => '4111'),
    }));

    const mockInput = document.createElement('input');
    mockInput.value = '4111';

    frameElement.domInput = mockInput;

    mockIFrameFormElement.getValue = jest.fn(() => '4111');
    mockIFrameFormElement.fieldType = 'CARD_NUMBER';
    mockIFrameFormElement.context = { logLevel: 'ERROR' };
    mockIFrameFormElement.mask = [
      '9999-9999-9999-9999',
      null,
      { '9': '\\d' },
    ];

    frameElement.iFrameFormElement = mockIFrameFormElement;

    (frameElement).applyMask();

    expect(mockInput.value).toBe('4111');
    expect(mockInput.getAttribute('maxlength')).toBe('19');

  });

  it('should apply mask in applyMask', () => {
    mockIFrameFormElement.mask = [['####'], null, { '#': /\d/ }];

    const getMaskedOutputSpy = jest
    .spyOn(helpers, 'getMaskedOutput')
    .mockReturnValue('4111');

    frameElement.applyMask();

    expect(getMaskedOutputSpy).toHaveBeenCalled();
    expect(mockIFrameFormElement.getValue).toHaveBeenCalled();
  });
});