import bus from 'framebus';
import FrameElement from '../../../src/core/internal/index';
import * as validators from '../../../src/utils/validators';
import * as helpers from '../../../src/utils/helpers';
import { getMaskedOutput, domReady } from '../../../src/utils/helpers';
import { COLLECT_FRAME_CONTROLLER, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, CARD_ENCODED_ICONS, INPUT_KEYBOARD_EVENTS, ELEMENT_EVENTS_TO_CLIENT } from '../../../src/core/constants';
import IFrameFormElement from '../../../src/core/internal/iframe-form';

describe('domReady function - FrameElement', () => {
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
    jest.clearAllMocks();
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
      setReplacePattern: jest.fn(),
      setFormat: jest.fn(),
      setMask: jest.fn(),
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
      replacePattern: '####',
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
      preserveFileName: false,
      allowedFileType: ['pdf',],
      value: 'test-value',
      options: [
        { value: 'visa', text: 'Visa' },
        { value: 'mastercard', text: 'MasterCard' }
      ]
    };

    mockHtmlDivElement = document.createElement('div');


    frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should call domReady function in updateOptions when element type is EXPIRATION_DATE', (done) => {
    const mockOptions = {
      elementType: 'EXPIRATION_DATE',
      inputStyles: {
        base: { color: 'blue' },
      },
    };
  
    mockIFrameFormElement.mask = ['####', '-', { '#': /\d/ }];
  
    const originalReadyState = document.readyState;
  
    const readyEvent = new Event('DOMContentLoaded');
  
    const frameElement1 = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
  
    setTimeout(() => {
      document.dispatchEvent(readyEvent);
        setTimeout(() => {
        done();
      }, 0);
    }, 0);
  });

  it('should call domReady function in updateOptions when element type is EXPIRATION_YEAR', (done) => {
    const mockOptions = {
        elementType: 'EXPIRATION_YEAR',
        inputStyles: {
          base: { color: 'blue' },
        },
      };
    
      mockIFrameFormElement.mask = ['####', '-', { '#': /\d/ }];
    
      const originalReadyState = document.readyState;
    
      const readyEvent = new Event('DOMContentLoaded');
    
      const frameElement1 = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
    
      setTimeout(() => {
        document.dispatchEvent(readyEvent);
        setTimeout(() => {
          done();
        }, 0);
      }, 0);
  });

  it('should call domReady function in updateOptions when element type is CARD_NUMBER', (done) => {
    const mockOptions = {
      elementType: 'CARD_NUMBER',
      inputStyles: {
        base: { color: 'blue' },
      },
    };
  
    mockIFrameFormElement.mask = ['####', '-', { '#': /\d/ }];
  
    const originalReadyState = document.readyState;
  
    const readyEvent = new Event('DOMContentLoaded');
  
    const frameElement1 = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
  
    setTimeout(() => {
      document.dispatchEvent(readyEvent);
  
      setTimeout(() => {
        done();
      }, 0);
    }, 0);
  });

  it('should call domReady function in updateOptions when element type is dropdown', (done) => {
    const mockOptions = {
      elementType: 'dropdown',
      inputStyles: {
        base: { color: 'blue' },
      },
      options: [
        { value: 'visa', text: 'Visa' },
        { value: 'mastercard', text: 'MasterCard' },
      ],
    };
  
    mockIFrameFormElement.fieldType = 'dropdown'
    mockIFrameFormElement.mask = ['####', '-', { '#': /\d/ }];
  
    const originalReadyState = document.readyState;
  
    const readyEvent = new Event('DOMContentLoaded');
  
    const frameElement1 = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
  
    setTimeout(() => {
      document.dispatchEvent(readyEvent);
  
      setTimeout(() => {
        done();
      }, 0);
    }, 0);
  });

  it('should call domReady function in updateOptions when element type is dropdown when value is undefined', (done) => {
    jest.spyOn(mockIFrameFormElement, 'getValue').mockImplementation(() => undefined);
    const mockOptions = {
      elementType: 'dropdown',
      inputStyles: {
        base: { color: 'blue' },
      },
      options: [
        { value: 'visa', text: 'Visa' },
        { value: 'mastercard', text: 'MasterCard' },
      ],
      value: 'test-val'
    };
  
    mockIFrameFormElement.fieldType = 'dropdown'
    mockIFrameFormElement.mask = ['####', '-', { '#': /\d/ }];
  
    const originalReadyState = document.readyState;
  
    const readyEvent = new Event('DOMContentLoaded');
    setTimeout(() => {
      document.dispatchEvent(readyEvent);
  
      setTimeout(() => {
        done();
      }, 0);
    }, 0);
  });
});

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
    jest.clearAllMocks();
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
      setReplacePattern: jest.fn(),
      setFormat: jest.fn(),
      setMask: jest.fn(),
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
      replacePattern: '####',
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
      preserveFileName: false,
      allowedFileType: ['pdf',],
    };

    mockHtmlDivElement = document.createElement('div');


    frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

  it('should initialize DOM elements when cardType is AMEX', () => {
    jest.mock('../../../src/utils/helpers', () => ({
      domReady: jest.fn(),
    }));
    mockIFrameFormElement.cardType = CARD_ENCODED_ICONS.AMEX

    frameElement.mount();

    expect(mockIFrameFormElement.resetEvents).toHaveBeenCalled();
    expect(frameElement.labelDiv).toBeDefined();
    expect(frameElement.domLabel).toBeDefined();
    expect(frameElement.domError).toBeDefined();
    expect(frameElement.inputParent).toBeDefined();
    expect(frameElement.domInput).toBeDefined();
  });

  it('should update domImg.src and call onDropdownSelect on dropdown change', () => {
    const visaEncoded = CARD_ENCODED_ICONS.VISA;

    const addEventListenerSpy = jest.spyOn(HTMLSelectElement.prototype, 'addEventListener');
    
    frameElement.mount();

    frameElement.domImg = document.createElement('img');
  
    const changeHandler = addEventListenerSpy.mock.calls.find(
      ([eventType]) => eventType === 'change'
    )?.[1];
  
    expect(changeHandler).toBeDefined();
  
    const mockEvent = {
      preventDefault: jest.fn(),
      target: { value: 'VISA' }
    };
  
    changeHandler(mockEvent);
  
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(frameElement.domImg.src).toContain(visaEncoded);
    expect(mockIFrameFormElement.onDropdownSelect).toHaveBeenCalledWith('VISA');
  
    addEventListenerSpy.mockRestore();
  });

  it('should call handleCopyIconClick when domCopy is clicked and no error exists', () => {
    const copyIconMock = jest.spyOn(helpers, 'handleCopyIconClick').mockImplementation(() => {});
  
    frameElement.hasError = false;
    frameElement.copyText = 'copy-this';
    frameElement.domCopy = document.createElement('div');

    frameElement.mount();
  
    frameElement.domCopy.click();

    expect(copyIconMock).toHaveBeenCalledWith('copy-this', frameElement.domCopy);

    copyIconMock.mockRestore();
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.BLUR event with FILE_INPUT fieldType', () => {
    mockIFrameFormElement.state.value = 'test-value'
    frameElement.mount();
  
    mockIFrameFormElement.fieldType = ELEMENTS.FILE_INPUT.name;
    const mockState = {
      value: 'file.pdf',
      isEmpty: false,
      isValid: true,
      error: null,
    };
  
    mockIFrameFormElement.onFocusChange = jest.fn();

    const blurEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.BLUR
    )?.[1];

    expect(frameElement.hasError).toBe(false);
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.BLUR event with EXPIRATION_MONTH fieldType', () => {
    mockIFrameFormElement.state.value = 'test-value'
    frameElement.mount();
  
    mockIFrameFormElement.fieldType = ELEMENTS.EXPIRATION_MONTH.name;
    const mockState = {
      value: '02',
      isEmpty: false,
      isValid: true,
      error: null,
    };

    const appendZeroToOneSpy = jest
    .spyOn(helpers, 'appendZeroToOne')
    .mockReturnValue({ isAppended: true, value: '01' });
  
    mockIFrameFormElement.onFocusChange = jest.fn();

    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.BLUR
    )[1](mockState);

    expect(appendZeroToOneSpy).toHaveBeenCalled();
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.BLUR event with EXPIRATION_DATE fieldType and format YYYY/MM', () => {
    frameElement.mount();
  
    mockIFrameFormElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
    mockIFrameFormElement.format = 'YYYY/MM';
    const mockState = {
      value: '2023/1',
      isEmpty: false,
      isValid: true,
      error: null,
    };
  
    const appendMonthFourDigitYearsSpy = jest
      .spyOn(helpers, 'appendMonthFourDigitYears')
      .mockReturnValue({ isAppended: true, value: '2023/01' });
  
    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.BLUR
    )[1](mockState);
  
    expect(appendMonthFourDigitYearsSpy).toHaveBeenCalledWith('2023/1');
    expect(mockIFrameFormElement.setValue).toHaveBeenCalledWith('2023/01');
    appendMonthFourDigitYearsSpy.mockRestore();
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.BLUR event with EXPIRATION_DATE fieldType and format YY/MM', () => {
    frameElement.mount();
  
    mockIFrameFormElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
    mockIFrameFormElement.format = 'YY/MM';
    const mockState = {
      value: '23/1',
      isEmpty: false,
      isValid: true,
      error: null,
    };
  
    const appendMonthTwoDigitYearsSpy = jest
      .spyOn(helpers, 'appendMonthTwoDigitYears')
      .mockReturnValue({ isAppended: true, value: '23/01' });
  
    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.BLUR
    )[1](mockState);
  
    expect(appendMonthTwoDigitYearsSpy).toHaveBeenCalledWith('23/1');
    expect(mockIFrameFormElement.setValue).toHaveBeenCalledWith('23/01');
    appendMonthTwoDigitYearsSpy.mockRestore();
  });

  it('should handle ELEMENT_EVENTS_TO_CLIENT.BLUR event with error state', () => {
    frameElement.mount();
  
    const mockState = {
      value: '',
      isEmpty: true,
      isValid: false,
      error: 'Some error',
    };
  
    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.BLUR
    )[1](mockState);
  
    expect(frameElement.hasError).toBe(true);
    expect(frameElement.domError.innerText).toBe('Some error');
  });

  it('should apply mask when mask is defined', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: false,
      isValid: true,
      value: 'some value',
    };
  
    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];

    jest.spyOn(frameElement, 'applyMask');

    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }

    expect(frameElement.applyMask).toHaveBeenCalled();
  });

  it('should hide domCopy when state is empty or invalid', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: true,
      isValid: false,
      value: '',
    };

    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];

    frameElement.domCopy = document.createElement('div');
    frameElement.domCopy.style.display = 'block';
  
    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }
  
    expect(frameElement.domCopy.style.display).toBe('none');
  });

  it('should set domInput.checked to true for radio fieldType when value matches', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: false,
      isValid: true,
      value: 'radioValue',
    };

    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];
  
    mockIFrameFormElement.fieldType = ELEMENTS.radio.name;
    frameElement.options.value = 'radioValue';
  
    frameElement.domInput = document.createElement('input');
    frameElement.domInput.type = 'radio';
  
    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }
  
    expect((frameElement.domInput).checked).toBe(true);
  });

  it('should update card icon and mask for CARD_NUMBER fieldType', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: false,
      isValid: true,
      value: '4111111111111111',
    };

    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];
  
    mockIFrameFormElement.fieldType = ELEMENTS.CARD_NUMBER.name;
    frameElement.options.enableCardIcon = true;
  
    frameElement.domImg = document.createElement('img');
  
    const mockCardType = 'VISA';
    jest.spyOn(validators, 'detectCardType').mockReturnValue(mockCardType);
    CARD_ENCODED_ICONS[mockCardType] = 'mockVisaIcon.png';
  
    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }
  
    expect(frameElement.domImg.src).toContain('mockVisaIcon.png');
    expect(mockIFrameFormElement.cardType).toBe(mockCardType);
  });

  it('should apply mask for CARD_NUMBER fieldType', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: false,
      isValid: true,
      value: '4111111111111111',
    };

    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];
  
    mockIFrameFormElement.fieldType = ELEMENTS.CARD_NUMBER.name;
  
    const mockCardNumberMask = ['####', '####', '####', '####'];
    jest.spyOn(helpers, 'addSeperatorToCardNumberMask').mockReturnValue(mockCardNumberMask);
  
    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }
  
    expect(mockIFrameFormElement.setMask).toHaveBeenCalledWith(mockCardNumberMask);
  });
  
  it('should focus on the next input element for COMPOSABLE containerType', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: false,
      isValid: true,
      isComplete: true,
      value: 'some value',
    };

    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];
  
    mockIFrameFormElement.containerType = 'COMPOSABLE';
    mockIFrameFormElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
  
    const mockInput1 = document.createElement('input');
    mockInput1.id = 'input1';
    const mockInput2 = document.createElement('input');
    mockInput2.id = 'input2';
    document.body.appendChild(mockInput1);
    document.body.appendChild(mockInput2);
  
    mockIFrameFormElement.iFrameName = 'input1';
  
    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }
  
    expect(document.activeElement).toBe(mockInput2);
  
    document.body.removeChild(mockInput1);
    document.body.removeChild(mockInput2);
  });

  it('should update style classes for EXPIRATION_DATE fieldType when not focused', () => {
    frameElement.mount();
  
    const mockState = {
      isEmpty: false,
      isValid: true,
      isFocused: false,
      value: '12/23',
    };

    mockIFrameFormElement.mask = [
      '####', 
      '-',   
      { '#': /\d/ },
    ];
  
    mockIFrameFormElement.fieldType = ELEMENTS.EXPIRATION_DATE.name;
  
    jest.spyOn(frameElement, 'updateStyleClasses');
  
    const changeEventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_CLIENT.CHANGE
    )?.[1];
  
    if (changeEventHandler) {
      changeEventHandler(mockState);
    }
  
    expect(frameElement.updateStyleClasses).toHaveBeenCalledWith(mockState);
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

  it('should handle ELEMENT_EVENTS_TO_IFRAME.SET_VALUE event when schema length>=2', () => {
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

  it('should handle ELEMENT_EVENTS_TO_IFRAME.SET_VALUE event when schema length is 1', () => {
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
        cardMetadata: { scheme: ['MASTERCARD'] },
      },
    };

    mockIFrameFormElement.on.mock.calls[3][1](mockData);

    expect(mockIFrameFormElement.setValidation).toHaveBeenCalledWith(['required']);
    expect(mockIFrameFormElement.tableName).toBe('mockTable');
    expect(mockIFrameFormElement.state.name).toBe('mockColumn');
    expect(frameElement.domLabel.textContent).toBe('mockLabel');
    expect(frameElement.domInput.placeholder).toBe('mockPlaceholder');
  });

  it('should handle ELEMENT_EVENTS_TO_IFRAME.SET_VALUE event when schema length is 1 and card type is AMEX', () => {
    mockIFrameFormElement.cardType = CARD_ENCODED_ICONS.AMEX;
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
        cardMetadata: { scheme: ['MASTERCARD'] },
      },
    };

    mockIFrameFormElement.on.mock.calls[3][1](mockData);

    expect(mockIFrameFormElement.setValidation).toHaveBeenCalledWith(['required']);
    expect(mockIFrameFormElement.tableName).toBe('mockTable');
    expect(mockIFrameFormElement.state.name).toBe('mockColumn');
    expect(frameElement.domLabel.textContent).toBe('mockLabel');
    expect(frameElement.domInput.placeholder).toBe('mockPlaceholder');
  });

  it('should remove dropdownIcon and dropdownSelect from inputParent when they exist', () => {
    frameElement.mount();
  
    frameElement.dropdownIcon = document.createElement('img');
    frameElement.dropdownSelect = document.createElement('select');
    frameElement.inputParent = document.createElement('div');
  
    frameElement.inputParent.appendChild(frameElement.dropdownIcon);
    frameElement.inputParent.appendChild(frameElement.dropdownSelect);
  
    const mockData = {
      options: {
        cardMetadata: { scheme: ['VISA'] },
      },
    };
  
    mockIFrameFormElement.on.mock.calls[3][1](mockData);
  
    expect(frameElement.inputParent.contains(frameElement.dropdownIcon)).toBe(false);
    expect(frameElement.inputParent.contains(frameElement.dropdownSelect)).toBe(false);
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

  it('should set domError.innerText to clientErrorText when isTriggerError is true', () => {
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
  
    const eventHandler = mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR + 'mockFrameName'
    );
  
    expect(eventHandler).toBeDefined();
  
    eventHandler[1](mockData);
  
    expect(frameElement.domError.innerText).toBe('Client error');
  });

  it('should set domError.innerText to state.error when isTriggerError is false', () => {
    frameElement.mount();

    const mockData = {
      isTriggerError: false,
      state: {
        error: 'Some error',
        isEmpty: false,
        isValid: false,
      },
    };

    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR + 'mockFrameName'
    )[1](mockData);

    expect(frameElement.domError.innerText).toBe('Some error');
  });

  it('should clear domError.innerText when state.isEmpty or state.isValid is true', () => {
    frameElement.mount();

    const mockData = {
      isTriggerError: false,
      state: {
        error: 'Some error',
        isEmpty: true,
        isValid: true,
      },
    };

    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR + 'mockFrameName'
    )[1](mockData);

    expect(frameElement.domError.innerText).toBe('');
  });

  it('should set domError.innerText to state.error when state.isEmpty is false and state.isValid is false', () => {
    frameElement.mount();

    const mockData = {
      isTriggerError: false,
      state: {
        error: 'Some error',
        isEmpty: false,
        isValid: false,
      },
    };

    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) => eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR + 'mockFrameName'
    )[1](mockData);

    expect(frameElement.domError.innerText).toBe('Some error');
  });

  it('should set domError.innerText to customErrorText when state is empty and required', () => {
    const mockData = {
      customErrorText: 'Custom error',
      state: {
        isEmpty: true,
        isRequired: true,
        isValid: false,
        error: '',
      },
    };
  
    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) =>
        eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE + 'mockFrameName'
    )[1](mockData);
  
    expect(frameElement.domError.innerText).toBe('Custom error');
  });

  it('should set domError.innerText to state.error when custom validation fails and validations are present', () => {
    frameElement.iFrameFormElement.validations = ['required'];
    frameElement.iFrameFormElement.isCustomValidationFailed = true;
  
    const mockData = {
      customErrorText: 'Custom error',
      state: {
        isEmpty: false,
        isRequired: false,
        isValid: false,
        error: 'Validation failed',
      },
    };
  
    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) =>
        eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE + 'mockFrameName'
    )[1](mockData);
  
    expect(frameElement.domError.innerText).toBe('Validation failed');
  });

  it('should clear domError.innerText when state is empty or valid', () => {
    const mockData = {
      customErrorText: 'Custom error',
      state: {
        isEmpty: true,
        isRequired: false,
        isValid: true,
        error: '',
      },
    };
  
    mockIFrameFormElement.on.mock.calls.find(
      ([eventType]) =>
        eventType === ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE + 'mockFrameName'
    )[1](mockData);
  
    expect(frameElement.domError.innerText).toBe('');
  });

  it('should update input styles when inputStyles are provided', () => {
    const mockOptions = {
      inputStyles: {
        base: { color: 'blue' },
      },
    };
  
    frameElement.updateOptions(mockOptions);
  
    expect(frameElement.options.inputStyles.base.color).toBe('blue');
  });

  it('should update input styles with card icon styles when elementType is CARD_NUMBER and enableCardIcon is true', () => {
    const mockOptions = {
      elementType: 'CARD_NUMBER',
      enableCardIcon: true,
      inputStyles: {
        base: { color: 'blue' },
      },
    };
  
    frameElement.updateOptions(mockOptions);
  
    expect(frameElement.options.inputStyles.base.color).toBe('blue');
  });

  it('should inject default label styles when labelStyles are not provided', () => {
    const mockOptions = {
      label: 'Test Label',
    };
  
    frameElement.updateOptions(mockOptions);
  
    expect(frameElement.domLabel.textContent).toBe('Test Label');
    expect(frameElement.options.label).toBe('Test Label');
  });

  it('should inject custom label styles when labelStyles are provided', () => {
    const mockOptions = {
      label: 'Test Label',
      labelStyles: {
        base: { color: 'red' },
      },
    };
  
    frameElement.updateOptions(mockOptions);
  
    expect(frameElement.domLabel.textContent).toBe('Test Label');
    expect(frameElement.options.label).toBe('Test Label');
  });

  it('should inject custom error text styles when errorTextStyles are provided', () => {
    const mockOptions = {
      errorTextStyles: {
        base: { color: 'green' },
      },
    };
  
    frameElement.updateOptions(mockOptions);
  
    expect(frameElement.options.errorTextStyles.base.color).toBe('green');
  });

  it('should inject default error text styles when errorTextStyles are not provided', () => {
    const mockOptions = {errorTextStyles: {
      color: '#f44336',
      padding: '4px',
    }};
  
    frameElement.updateOptions(mockOptions);
  
    expect(frameElement.options.errorTextStyles).toMatchObject({
      color: '#f44336',
      padding: '4px',
    });
  });
  it('input event', () => {
    const windowSpy = jest.spyOn(window,'parent','get');
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
    const mockIFrameFormElement = {
      resetEvents: jest.fn(),
      on: jest.fn(),
      setValue: jest.fn(),
      setMask: jest.fn(),
      setValidation: jest.fn(),
      setReplacePattern: jest.fn(),
      setFormat: jest.fn(),
      setMask: jest.fn(),
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
      replacePattern: '####',
    };

    const mockOptions = {
      masking: true,
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
      preserveFileName: false,
      allowedFileType: ['pdf',],
    };

    const mockHtmlDivElement = document.createElement('div');
    const element = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
    element.mount();
    const mockEvent = {
      target: { value: '4111111111111111', checkValidity: jest.fn().mockReturnValue(true) },
    };
    element.setValue('4111 1111 1111 1111', true);
    element.onInputChange(mockEvent);
    expect(mockIFrameFormElement.setValue).toHaveBeenCalledWith('4111 1111 1111 1111', true);
    expect(mockIFrameFormElement.getStatus).toHaveBeenCalled();
    expect(mockIFrameFormElement.setMask).toHaveBeenCalledWith(['XXXX XXXX XXXX XXXX', { 'X': "[0-9]" }]);
    expect(mockIFrameFormElement.resetEvents).toHaveBeenCalled();
    expect(mockIFrameFormElement.on).toHaveBeenCalledWith(
      ELEMENT_EVENTS_TO_CLIENT.BLUR,
      expect.any(Function)
    );
    element.options = {
      ...element.options,
      masking: false,
    }
    element.onInputChange(mockEvent);
    element.setValue('4111 1111 1111 1111', true);
    expect(element.actualValue).toBe('4111111111111111');

    const mockEvent1 = {
      target: frameElement.domInput,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: frameElement.domInput,
      detail: {
        value: '',
      },
      isTrusted: true,
      type: 'input',
      bubbles: true,
    };
    element.onInputChange(mockEvent1);

    expect(element.actualValue).toBe('4111111111111111');
  })
});
describe('FrameElement - onInputChange Tests for Card number', () => {
  let frameElement;
  let mockIFrameFormElement;
  let mockOptions;
  let mockHtmlDivElement;
  let mockState;

  beforeEach(() => {
    mockState = {
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
    mockIFrameFormElement = {
      resetEvents: jest.fn(),
      on: jest.fn(),
      setValue: jest.fn(),
      setMask: jest.fn(),
      setValidation: jest.fn(),
      setReplacePattern: jest.fn(),
      setFormat: jest.fn(),
      setMask: jest.fn(),
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
      replacePattern: '####',
    };

    mockOptions = {
      masking: true,
      maskingChar: 'X',
      cardSeperator: ' ',
      enableCardIcon: true,
      elementName: 'card'
    };

    mockHtmlDivElement = document.createElement('div');
    frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
    frameElement.mount();
  });

  describe('File Input Tests', () => {
    it('should handle file input change correctly', () => {
      mockIFrameFormElement.fieldType = ELEMENTS.FILE_INPUT.name;
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const mockEvent = {
        target: {
          files: [mockFile],
          checkValidity: jest.fn().mockReturnValue(true)
        }
      };

      frameElement.onInputChange(mockEvent);

      expect(mockIFrameFormElement.setValue).toHaveBeenCalledWith(mockFile, true);
    });
  });

  describe('Card Number Input Tests', () => {
    it('should handle card number input with masking enabled', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.setAttribute('type', 'text');
      frameElement.domInput.value = '411111111111';
      frameElement.actualValue = '';

      const mockEvent = {
        target: frameElement.domInput
      };
      
      frameElement.onInputChange(mockEvent);

      expect(mockIFrameFormElement.setMask).toHaveBeenCalled();
      expect(frameElement.actualValue).toBeTruthy();
    });

    it('should update mask based on card type', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111111111111111';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(mockIFrameFormElement.setMask).toHaveBeenCalledWith(["XXXX XXXX XXXX XXXX", {"X": "[0-9]"}]);
    });
  });

  describe('Input Masking Tests', () => {
    it('should handle input with masking enabled', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';
      frameElement.actualValue = '';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue).toBe('4111');
      expect(frameElement.domInput.value).toMatch(/^X+$/);
    });

    it('should handle deletion in masked input', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.actualValue = '4111';
      frameElement.domInput.value = '411';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue.length).toBe(3);
    });

    it('should handle paste event in masked input', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.actualValue = '';
      frameElement.domInput.value = '4111111111';
      frameElement.selectionStart = 0;
      frameElement.selectionEnd = 16;
      frameElement.selectedData =   '4111111111';

      const e = document.createElement('input');
      e.value = '4111111111';
      e.selectionStart = 0;
      e.selectionEnd = 16;
      e.setSelectionRange(0, 16);
      frameElement.domInput = e;
    
      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue).toBe('4111111111');
      expect(frameElement.selectedData).toBe('4111111111');
      expect(frameElement.domInput.value).toBe('XXXX XXXX XX');
      frameElement.onInputChange(mockEvent);
      frameElement.domInput.value = '41111111112';
      frameElement.onInputChange({
        target: frameElement.domInput
      });
      frameElement.domInput.value = '';
      frameElement.onInputChange({
        target: frameElement.domInput
      });
    });
  });

  describe('Cursor Position Tests', () => {
    it('should maintain cursor position after input', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';
      frameElement.domInput.setSelectionRange = jest.fn();

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.domInput.setSelectionRange).toHaveBeenCalled();
    });
  });

  describe('Non-masked Input Tests', () => {
    it('should handle input without masking', () => {
      mockOptions.masking = false;
      frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
      frameElement.mount();
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111111111111111';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(mockIFrameFormElement.setValue).toHaveBeenCalledWith(
        '4111 1111 1111 1111',
        true
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined values gracefully', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '';

      const mockEvent = {
        target: frameElement.domInput
      };

      expect(() => frameElement.onInputChange(mockEvent)).not.toThrow();
    });

    it('should handle invalid mask format', () => {
      mockIFrameFormElement.mask = undefined;
      frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
      frameElement.mount();
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';

      const mockEvent = {
        target: frameElement.domInput
      };

      expect(() => frameElement.onInputChange(mockEvent)).not.toThrow();
    });
  });
});
describe('FrameElement - onInputChange Tests for other field', () => {
  let frameElement;
  let mockIFrameFormElement;
  let mockOptions;
  let mockHtmlDivElement;
  let mockState;

  beforeEach(() => {
    mockState = {
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
    mockIFrameFormElement = {
      resetEvents: jest.fn(),
      on: jest.fn(),
      setValue: jest.fn(),
      setMask: jest.fn(),
      setValidation: jest.fn(),
      setReplacePattern: jest.fn(),
      setFormat: jest.fn(),
      setMask: jest.fn(),
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
      fieldType: ELEMENTS.INPUT_FIELD.name,
      iFrameName: 'mockFrameName',
      cardType: 'DEFAULT',
      state: { ...mockState },
      mask: ['#### #### #### ####'],
      replacePattern: '####',
    };

    mockOptions = {
      masking: true,
      maskingChar: 'X',
      cardSeperator: ' ',
      enableCardIcon: true,
      elementName: 'card',
      fieldType: ELEMENTS.INPUT_FIELD.name,
    };

    mockHtmlDivElement = document.createElement('div');
    const tableCol = btoa('1234')
    const collect_element = `element:INPUT_FIELD:${tableCol}`;
    const frame = new IFrameFormElement(collect_element, 'mockTableName', 'mockColumnName', mockOptions);
    frameElement = new FrameElement(frame, mockOptions, mockHtmlDivElement);
    frameElement.mount();
  });


  describe('Card Number Input Tests', () => {
    it('should handle card number input with masking enabled', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.setAttribute('type', 'text');
      frameElement.domInput.value = '4111';
      frameElement.actualValue = '';

      const mockEvent = {
        target: frameElement.domInput
      };
      
      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue).toBeTruthy();
    });

    it('should update mask based on card type', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);
    });
  });

  describe('Input Masking Tests', () => {
    it('should handle input with masking enabled', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';
      frameElement.actualValue = '';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue).toBe('4111');
      expect(frameElement.domInput.value).toMatch("XXXX");
    });

    it('should handle deletion in masked input', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.actualValue = '41';
      frameElement.domInput.value = '4';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue.length).toBe(1);
    });

    it('should handle paste event in masked input', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.actualValue = '';
      frameElement.domInput.value = '4111';
      frameElement.selectionStart = 0;
      frameElement.selectionEnd = 16;
      frameElement.selectedData =   '4111';

      const e = document.createElement('input');
      e.value = '41';
      e.selectionStart = 0;
      e.selectionEnd = 16;
      e.setSelectionRange(0, 16);
      frameElement.domInput = e;
    
      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.actualValue).toBe('');
      expect(frameElement.selectedData).toBe('4111');
      expect(frameElement.domInput.value).toBe('');
      frameElement.onInputChange(mockEvent);
      frameElement.domInput.value = '41111111112';
      frameElement.onInputChange({
        target: frameElement.domInput
      });
      frameElement.domInput.value = '';
      frameElement.onInputChange({
        target: frameElement.domInput
      });
    });
  });

  describe('Cursor Position Tests', () => {
    it('should maintain cursor position after input', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';
      frameElement.domInput.setSelectionRange = jest.fn();

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(frameElement.domInput.setSelectionRange).toHaveBeenCalled();
    });
  });

  describe('Non-masked Input Tests', () => {
    it('should handle input without masking', () => {
      mockOptions.masking = false;
      frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
      frameElement.mount();
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '42';

      const mockEvent = {
        target: frameElement.domInput
      };

      frameElement.onInputChange(mockEvent);

      expect(mockIFrameFormElement.setValue).toHaveBeenCalledWith(
        '##',
        true
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined values gracefully', () => {
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '';

      const mockEvent = {
        target: frameElement.domInput
      };

      expect(() => frameElement.onInputChange(mockEvent)).not.toThrow();
    });

    it('should handle invalid mask format', () => {
      mockIFrameFormElement.mask = undefined;
      frameElement = new FrameElement(mockIFrameFormElement, mockOptions, mockHtmlDivElement);
      frameElement.mount();
      frameElement.domInput = document.createElement('input');
      frameElement.domInput.value = '4111';

      const mockEvent = {
        target: frameElement.domInput
      };

      expect(() => frameElement.onInputChange(mockEvent)).not.toThrow();
    });
  });
});