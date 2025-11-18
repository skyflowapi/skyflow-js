/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { COLLECT_FRAME_CONTROLLER, ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, ElementType, FRAME_ELEMENT } from '../../../../src/core/constants';
import { Env, LogLevel, ValidationRuleType } from '../../../../src/utils/common';
import IFrameFormElement from '../../../../src/core/internal/iframe-form'
import * as busEvents from '../../../../src/utils/bus-events';
import SkyflowError from '../../../../src/libs/skyflow-error';
import logs from '../../../../src/utils/logs';
import { ContainerType } from '../../../../src/skyflow';
import { formatOptions } from '../../../../src/libs/element-options';
import { parameterizedString } from '../../../../src/utils/logs-helper';
import FrameElementInit from '../../../../src/core/internal/frame-element-init';


const tableCol = btoa('1234')
const collect_element = `element:CVV:${tableCol}`;
const checkbox_element = `element:${ELEMENTS.checkbox.name}:${tableCol}`
const test_collect_element = `element:CARD_NUMBER:${tableCol}`;
const file_element = `element:FILE_INPUT:${tableCol}`;
const multi_file_element = `element:MULTI_FILE_INPUT:${tableCol}`;

const context = {
    logLevel: LogLevel.ERROR,
    env: Env.PROD
}

const metaData = {
    clientDomain: 'http://abc.com',
}
const records = {
    tokens: true,
    additionalFields: {
    records: [
      {
        table: 'pii_fields',
        fields: {
      },
      },
    ],
    },
};

const clientObj1 = {
    config: {},
    request: jest.fn(() => Promise.rejects({"error": 'not foound'})),
    toJSON: jest.fn(() => ({
        config: {},
        metaData: {
            uuid: ''
        }
    }))
}
describe('test iframeFormelement', () => {

    let emitSpy;
    let targetSpy;
    let on = jest.fn()
    let windowSpy
    let onSpy;
    let testValue;
    beforeEach(() => {
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        onSpy = jest.spyOn(bus, 'on');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
        });
        windowSpy = jest.spyOn(global, 'window', 'get');
        windowSpy.mockImplementation(()=>({
                parent:{
                    frames:{
                'element:CARD_NUMBER:${tableCol}':{document:{
                    getElementById:()=>({value:testValue})
                }}
                },
                    postMessage: jest.fn(),
                },
                addEventListener: jest.fn(),
        }));
    });
    afterEach(() => {
        windowSpy.mockRestore();
      });

      
    test('iframeFormelement constructor', () => {
        const element = new IFrameFormElement(collect_element, {}, context)
        expect(element.state.isFocused).toBe(false)
        element.onFocusChange(true)
        expect(element.state.isFocused).toBe(true)
        element.setReplacePattern(['//'])
        element.setMask(["XXX", { X: "[0-9]" }])
        element.setValidation()
        element.setSensitive()
        element.setValue('123')
        expect(element.state.value).toBe('123')
        const formState = element.getStatus()
        expect(formState.isValid).toBe(true)
        expect(element.getValue()).toBe('123')
        expect(element.getUnformattedValue()).toBe('123')

        const invalid = element.validator('1')
        expect(invalid).toBe(false)

        const valid = element.validator('123')
        expect(valid).toBe(true)

        element.destroy()
        expect(element.state.value).toBe('')

        const emitCb = on.mock.calls[2][1]
        emitCb({
            name: collect_element,
            options: {
                value: '123'
            }
        })

    })
    test('iframeFormElement get value for dob', () => {
        const element = new IFrameFormElement(collect_element, {}, context)
        Object.defineProperty(element, 'fieldType', {
            get: () => 'dob',
            set: () => {}
        });
        element.setValue('2020-12-30')
        expect(element.getValue()).toBe('2020-12-30')
    });

    test('iframeFormElement element state value for collect elements in PROD env', () => {
        const elementsList = [
            {
                element: test_collect_element,
                type: ElementType.CARD_NUMBER,
                input: '4111111111111111',
                expected:'41111111XXXXXXXX'
            },
            {
                element: collect_element,
                type: ElementType.CVV,
                input: '1234',
                expected: undefined
            },
            {
                element: test_collect_element,
                type: ElementType.CARDHOLDER_NAME,
                input: 'john doe',
                expected: undefined
            },
            {
                element: test_collect_element,
                type: ElementType.EXPIRATION_DATE,
                input: '12/30',
                format: 'MM/YY',
                expected: undefined,
            },
            {
                element: test_collect_element,
                type: ElementType.EXPIRATION_MONTH,
                input: '11',
                expected: undefined
            },
            {
                element: test_collect_element,
                type: ElementType.EXPIRATION_YEAR,
                input: '29',
                expected: undefined
            },
            {
                element: test_collect_element,
                type: ElementType.PIN,
                input: '2912',
                expected: undefined
            },
            {
                element: test_collect_element,
                type: ElementType.INPUT_FIELD,
                input: '212-61-2465',
                expected: undefined
            },
        ];

        for (const element of elementsList) {
            const iframeElement = new IFrameFormElement(element.element, element.type, {}, context);
            Object.defineProperty(iframeElement, 'fieldType', {
                get: () => element.type,
                set: () => {}
            });
            if (element.format !== undefined) {
                iframeElement.setFormat(element.format);
            }
            iframeElement.setValue(element.input);
            expect(iframeElement.getStatus().value).toBe(element.expected);
        }
    });

    test('iframeFormElement element state value for collect elements in DEV env', () => {
        const elementsList = [
            {
                element: test_collect_element,
                type: ElementType.CARD_NUMBER,
                input: '4111111111111111',
                expected:'4111111111111111'
            },
            {
                element: collect_element,
                type: ElementType.CVV,
                input: '1234',
                expected: '1234'
            },
            {
                element: test_collect_element,
                type: ElementType.CARDHOLDER_NAME,
                input: 'john doe',
                expected: 'john doe'
            },
            {
                element: test_collect_element,
                type: ElementType.EXPIRATION_DATE,
                input: '12/30',
                format: 'MM/YY',
                expected: '12/30',
            },
            {
                element: test_collect_element,
                type: ElementType.EXPIRATION_MONTH,
                input: '11',
                expected: '11'
            },
            {
                element: test_collect_element,
                type: ElementType.EXPIRATION_YEAR,
                input: '29',
                expected: '29'
            },
            {
                element: test_collect_element,
                type: ElementType.PIN,
                input: '2912',
                expected: '2912'
            },
            {
                element: test_collect_element,
                type: ElementType.INPUT_FIELD,
                input: '212-61-2465',
                expected: '212-61-2465'
            },
        ];

        for (const element of elementsList) {
            const iframeElement = new IFrameFormElement(element.element, element.type, {}, {...context, env: Env.DEV});
            Object.defineProperty(iframeElement, 'fieldType', {
                get: () => element.type,
                set: () => {}
            });
            if (element.format !== undefined) {
                iframeElement.setFormat(element.format);
            }
            iframeElement.setValue(element.input);
            expect(iframeElement.getStatus().value).toBe(element.expected);
        }
    });

    test('iframeFormelement should throw error for sensitive', () => {
        const element = new IFrameFormElement(collect_element, '', {containerType:ContainerType.COLLECT}, context);
        element.setSensitive(true);
    
        expect(() => {
            element.setSensitive(false);
        }).toThrow('Sensitivity is not backward compatible');
    });
    test('iframeFormelement should not throw error for sensitive', () => {
        const element = new IFrameFormElement(collect_element, '', {containerType:ContainerType.COLLECT}, context);
        Object.defineProperty(element, 'sensitive', {
            get: () => false,
            set: () => {}
        });
        element.setSensitive(true);
    });
    test('iframeformelment test the unformatted value', () => {
        const element = new IFrameFormElement(test_collect_element, '', {containerType:ContainerType.COLLECT}, context);
        element.setFormat('XXXX XXXX XXXX XXXX');
        element.setValue('4111 1111 1111 1111');
        element.setMask(["XXXX XXXX XXXX XXXX", { X: "[0-9]" }]);
        element.state.value = '4111 1111 1111 1111';
        expect(element.getUnformattedValue()).toBe('4111111111111111')
        element.state.selectedCardScheme = 'visa';
        expect(element.getStatus().selectedCardScheme).toBe('visa');
        expect(element.validateCustomValidations()).toBe(true);
    })

    test('is match equal tests',()=>{
        const validation = {
            type: 'ELEMENT_VALUE_MATCH_RULE',
            params: {
                element: 'element:CARD_NUMBER:${tableCol}',
            },
        };
        const element = new IFrameFormElement(test_collect_element, '',{} ,context);
        element.isMatchEqual(1,"123",validation)
        expect(element).toBeInstanceOf(IFrameFormElement)
    });

    test('is match equal tests with invalid id',()=>{
        const validation = {
            type: 'ELEMENT_VALUE_MATCH_RULE',
            params: {
                element: 'test:group',
                elementID: "id"
            },
        };
        const element = new IFrameFormElement(collect_element, '',{} ,context);
        element.isMatchEqual(1,"123",validation)
        expect(element).toBeInstanceOf(IFrameFormElement)
    });

    test('set mask with null value',()=>{
        const element = new IFrameFormElement(collect_element, '',{} ,context);
        element.setReplacePattern(null);
        element.setMask(null);
        expect(element.mask).toBe(undefined)
        expect(element.replacePattern).toBe(undefined);
    });

    test('set mask with no translation',()=>{
        const spy = jest.spyOn(console, 'warn'); 
        const element = new IFrameFormElement(collect_element, '',{} ,context);
        element.setReplacePattern(null);
        element.setMask(["XXX"]);
        expect(element.mask).toBe(undefined)
        expect(element.replacePattern).toBe(undefined);
        expect(spy).not.toBeCalledTimes(1);
    });
    test('collect bus event', () => {
        const element = new IFrameFormElement(collect_element, '',{clientDomain :'*'} ,context);
        // input events
        const eventName = `${ELEMENT_EVENTS_TO_IFRAME.INPUT_EVENT}${collect_element}`;
        expect(on.mock.calls[0][0]).toBe(eventName);
        expect(on.mock.calls[0][1]).toBeDefined();
        const callback = on.mock.calls[0][1];
        expect(callback).toBeInstanceOf(Function);
        callback({
            name: collect_element,
            options: {
                value: '123',
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
            },
            event: ELEMENT_EVENTS_TO_CLIENT.FOCUS,
        });
        expect(element.state.isFocused).toBe(true);
        callback({
            name: collect_element,
            options: {
                value: '123',
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
            },
            event: ELEMENT_EVENTS_TO_CLIENT.BLUR,
        });
        expect(element.state.isFocused).toBe(false);
        // set value
        const setEventName = `${ELEMENT_EVENTS_TO_IFRAME.SET_VALUE}${collect_element}`;
        expect(on.mock.calls[1][0]).toBe(setEventName);
        const callback2 = on.mock.calls[1][1];
        expect(callback2).toBeInstanceOf(Function);
        callback2({
            name: collect_element,
            options: {
                value: '123',
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
                elementName: collect_element,
            },
            event: ELEMENT_EVENTS_TO_CLIENT.SET_VALUE,
        });
        callback2({
            name: collect_element,
            options: {
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
                elementName: collect_element,
            },
            event: ELEMENT_EVENTS_TO_CLIENT.SET_VALUE,
            isSingleElementAPI: true,
        });
        // COLLECT_ELEMENT_SET_ERROR_OVERRIDE
        const setErrorEventName = `${ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR_OVERRIDE}${collect_element}`;
        expect(on.mock.calls[2][0]).toBe(setErrorEventName);
        const callback3 = on.mock.calls[2][1];
        callback3({
            name: collect_element,
            options: {
                value: '123',
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
                elementName: collect_element,
            },
        });
        // COLLECT_ELEMENT_SET_ERROR
        const setErrorEventName2 = `${ELEMENT_EVENTS_TO_IFRAME.COLLECT_ELEMENT_SET_ERROR}${collect_element}`;
        expect(on.mock.calls[3][0]).toBe(setErrorEventName2);
        const callback4 = on.mock.calls[3][1];
        callback4({
            name: collect_element,
            isTriggerError: true,
            clientErrorText: 'Invalid cvv',
            options: {
                value: '123',
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
                elementName: collect_element,
            },
        });
        callback4({
            name: collect_element,
            isTriggerError: false,
            options: {
                value: '123',
                isFocused: true,
                isValid: true,
                isEmpty: false,
                isComplete: true,
                elementName: collect_element,
            },
        });
    });

    test('set mask  should throw warining invalid regex in translation mask',()=>{
        const spy = jest.spyOn(console, 'warn'); 
        const element = new IFrameFormElement(collect_element, '',{} ,{logLevel:LogLevel.WARN,env:Env.PROD});
        element.setMask(["XXX", { X: "*" }]);
        expect(spy).toBeCalledWith(`WARN: [Skyflow] ${parameterizedString(logs.warnLogs.INVALID_INPUT_TRANSLATION,
            'CVV')}`)
    });

    test('set mask should not throw warining invalid regex in translation mask with error log level',()=>{
        const spy = jest.spyOn(console, 'warn'); 
        const element = new IFrameFormElement(collect_element, '',{} ,{env:Env.PROD});
        element.setMask(["XXX", { X: "*" }]);
        expect(spy).not.toBeCalledTimes(1);
    });

    test('test setValue for expiration_month', () => {
        const element = new IFrameFormElement(`element:EXPIRATION_MONTH:${tableCol}`, {}, context)
        element.setValue('2')
        expect(element.state.value).toBe('02')

        element.setValue('12')
        expect(element.state.value).toBe('12')
    })
    test('test setValue for checkbox element', () => {
        const element = new IFrameFormElement(checkbox_element, {}, context)
        element.setValue(true)
        expect(element.state.value).toBe(true)

        element.setValue(true)
        expect(element.state.value).toBe('')

        element.setValue(false)
        expect(element.state.value).toBe(false)
    });

    test('test setValue for expiration_date', () => {
        const element = new IFrameFormElement(`element:EXPIRATION_DATE:${tableCol}`, {}, context)
        element.setFormat('MM/YY')
        element.setValue('2')
        expect(element.state.value).toBe('02')

        element.setValue('1')
        expect(element.state.value).toBe('1')

        element.setFormat('YYYY/MM')
        element.setValue('2070/2')
        expect(element.state.value).toBe('2070/02')

        element.setValue(' ')
        element.setValue('2070/1')
        expect(element.state.value).toBe('2070/1')

        element.setFormat('YY/MM')
        element.setValue('70/2')
        expect(element.state.value).toBe('70/02')

        element.setValue('70/1')
        expect(element.state.value).toBe('70/1')

    })

    test('test error text with label collect element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, 'cvv',{containerType:ContainerType.COLLECT}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('123');
        expect(element.errorText).toBe('Invalid cvv');
    });
    test('test error text without label collect element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COLLECT}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('123');
        expect(element.errorText).toBe('Invalid value');
    });

    test('test error text without label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COMPOSABLE}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('123');
        expect(element.errorText).toBe('Invalid cvv');
    });

    test('test error text without label collect element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COLLECT}, context)
        element.setValidation();
        element.setValue('12');
        expect(element.errorText).toBe('Invalid value');
    });

    test('test error text without label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COMPOSABLE}, context)
        element.setValidation();
        element.setValue('12');
        expect(element.errorText).toBe('Invalid cvv');
    });

    test('test error text without label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COMPOSABLE,isRequired:true}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('cvv is required');
    });
    test('test error text without label collect element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COLLECT,isRequired:true}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('Field is required');
    });
    test('test error text with label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, 'cvv label',{containerType:ContainerType.COMPOSABLE,isRequired:true}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('cvv label is required');
    });
    test('test error text without label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COMPOSABLE}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('Invalid cvv');
    });
    test('test error text without label collect element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COLLECT}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('Invalid value');
    });
    test('test error text with label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, 'cvv label',{containerType:ContainerType.COMPOSABLE}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('Invalid cvv label');
    });
    test('test card_number validations', () => {
        const element = new IFrameFormElement(`element:CARD_NUMBER:${tableCol}`, {}, context)
        element.setValidation()
        const invalid = element.validator('411')
        const valid = element.validator('4111111111111111')
        expect(invalid).toBe(false)
        expect(valid).toBe(true)
    })

    test('expiration_date validations', () => {
        const element2 = new IFrameFormElement(`element:EXPIRATION_DATE:${tableCol}`, {}, context)
        element2.setValidation()
        element2.setFormat('MM/YYYY')
        const invalid = element2.validator('12')
        const valid = element2.validator('12/2070')
        expect(invalid).toBe(false)
        expect(valid).toBe(true)
    })

    test('expiration_month validations', () => {
        const element2 = new IFrameFormElement(`element:EXPIRATION_MONTH:${tableCol}`, {}, context)
        element2.setValidation()
        const invalid = element2.validator('14')
        const valid = element2.validator('12')
        expect(invalid).toBe(false)
        expect(valid).toBe(true)
    })

    test('expiration_year validations', () => {
        const element2 = new IFrameFormElement(`element:EXPIRATION_YEAR:${tableCol}`, {}, context)
        element2.setValidation()
        element2.setFormat('YY')
        const invalid = element2.validator('14')
        const valid = element2.validator('52')
        expect(invalid).toBe(false)
        expect(valid).toBe(true)
    })

    test('file_input validations', () => {
        const invalidFile = {
            lastModified: '',
            lastModifiedDate: '',
            name: "sample.zip",
            size: 48848,
            type: "application/zip",
            webkitRelativePath: ""
        }

        const fileElement = new IFrameFormElement(file_element, {}, context)
        fileElement.setValidation()
        const invalid = fileElement.validator(invalidFile)
        expect(invalid).toBe(false)
    })


    test('file_input validation file name', () => {
        const invalidFile = {
            lastModified: '',
            lastModifiedDate: '',
            name: "sample 1.png",
            size: 48848,
            type: "image/jpeg",
            webkitRelativePath: ""
        }

        const fileElement = new IFrameFormElement(file_element, {}, context)
        fileElement.setValidation()
        const invalid = fileElement.validator(invalidFile)
        expect(invalid).toBe(false)
    })
    test('file_input validation file name invalid case', () => {
        const invalidFile = {
            lastModified: '',
            lastModifiedDate: '',
            name: "sample 1.png",
            size: 48848,
            type: "image/png" ,
            webkitRelativePath: ""
        }
        const fileElement = new IFrameFormElement(file_element, {}, context)
        fileElement.setValidation()
        const invalid = fileElement.validator(invalidFile)
        expect(invalid).toBe(false)
    })

    test('invalid custom validations', () => {
        const element2 = new IFrameFormElement(`element:EXPIRATION_MONTH:${tableCol}`, {}, context)
        element2.setValidation([{type:'DEFAULT',params:{}}])

        const isValid = element2.validator('12')
        expect(isValid).toBe(false)
    })

    test('test custom validations', () => {

        const lengthRule = {
            type: ValidationRuleType.LENGTH_MATCH_RULE,
            params: {
                min: 5,
                max: 8,
                error: "Invalid length",
            }
        }

        const regexRule = {
            type: ValidationRuleType.REGEX_MATCH_RULE,
            params: {
                regex: "/[1-4]+/"
            }
        }

        const element = new IFrameFormElement(`element:PIN:${tableCol}`, {}, context)
        element.setValidation([lengthRule, regexRule]);
        let isValid = element.validator('1234')
        expect(isValid).toBe(false)
        expect(element.errorText).toBe("Invalid length")

        isValid = element.validator('123456789')
        expect(isValid).toBe(false)
        expect(element.errorText).toBe("Invalid length")

        isValid = element.validator('99999')
        expect(isValid).toBe(false)
        expect(element.errorText).toBe(parameterizedString(logs.errorLogs.VALIDATION_FAILED))
    });
    
    test('card number custom validation',()=>{

        const lengthRule2 = {
            type: ValidationRuleType.LENGTH_MATCH_RULE,
            params: {
                min: 16,
                max: 16,
                error: "Invalid length",
            }
        }

        const regexRule2 = {
            type: ValidationRuleType.REGEX_MATCH_RULE,
            params: {
                regex: "/^4\d*/"
            }
        }
        const cardNumberElement = new IFrameFormElement(`element:CARD_NUMBER:${tableCol}`, {}, context)
        cardNumberElement.setValidation([lengthRule2, regexRule2]);
        let isValid = cardNumberElement.validator('3700 0000 0000 002')
        expect(isValid).toBe(false)
        expect(cardNumberElement.errorText).toBe("Invalid length")

        isValid = cardNumberElement.validator('5555 3412 4444 1115')
        expect(isValid).toBe(false)
        expect(cardNumberElement.errorText).toBe(parameterizedString(logs.errorLogs.VALIDATION_FAILED))
    });

    test('card number custom validation',()=>{
        testValue = '5555 3412 4444 '
        const elementRule = {
            type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
            params: {
                element:'element:CARD_NUMBER:${tableCol}',
            }
        }
        const cardNumberElement = new IFrameFormElement(`element:CARD_NUMBER:${tableCol}`, {}, context)
        cardNumberElement.setValidation([elementRule]);
        cardNumberElement.state.value = "test";

        const callback = onSpy.mock.calls[0][1];
        callback({});
        expect(callback).toBeDefined();
        let isValid = cardNumberElement.validator('5555 3412 4444 1115')
        expect(isValid).toBe(false)
        expect(cardNumberElement.errorText).toBe(parameterizedString(logs.errorLogs.VALIDATION_FAILED))
    });

    test('card number custom validation with error',()=>{
        windowSpy.mockImplementation(()=>({}));
        testValue = '5555 3412 4444 '
        const elementRule = {
            type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
        }
        const cardNumberElement = new IFrameFormElement(`element:CARD_NUMBER:${tableCol}`, {}, context)
        try{
            cardNumberElement.setValidation([elementRule]);
            cardNumberElement.state.value = "test";
        } catch(err) {
            expect(err).toBeDefined();
        }
        
        try{
            const callback = onSpy.mock.calls[0][1];
            callback({});
            expect(callback).toBeDefined();
            let isValid = cardNumberElement.validator('5555 3412 4444 1115')
            expect(isValid).toBe(false)
            expect(cardNumberElement.errorText).toBe(parameterizedString(logs.errorLogs.VALIDATION_FAILED))
        } catch (err) {
            expect(err).toBeDefined();
        }
    });
        test('iframeFormelement constructor FILE INPUT element', () => {
        const element = new IFrameFormElement(file_element, '', {containerType: ContainerType.COMPOSABLE}, context)
        element.onFocusChange(false)
        expect(element.state.isFocused).toBe(false)
        element.onFocusChange(true)
        element.sendChangeStatus(true)
    });
    test('iframeFormelement constructor MULTI FILE INPUT element', () => {
        const element = new IFrameFormElement(multi_file_element, '', {containerType: ContainerType.COMPOSABLE}, context)
        element.onFocusChange(false)
        expect(element.state.isFocused).toBe(false)
        element.onFocusChange(true)
        element.sendChangeStatus(true)
      });
    test('iframeFormelement constructor MULTI FILE INPUT element for change status', () => {
        const element = new IFrameFormElement(file_element, '', {containerType: ContainerType.COMPOSABLE}, context)
        element.onFocusChange(false)
        expect(element.state.isFocused).toBe(false)
        element.onFocusChange(true)
        expect(element.state.isFocused).toBe(true)
        element.onFocusChange(false)
        expect(element.state.isFocused).toBe(false)
        element.sendChangeStatus(true)
    });
    test('iframeFormelement constructor MULTI FILE INPUT element for change status', () => {
        const element = new IFrameFormElement(multi_file_element, '', {containerType: ContainerType.COMPOSABLE}, context)
        element.onFocusChange(false)
        element.state.value = '123'
        expect(element.state.isFocused).toBe(false)
        element.sendChangeStatus(true)


        const element2 = new IFrameFormElement(file_element, '', {containerType: ContainerType.COMPOSABLE}, context)
        element2.onFocusChange(false)
        element2.state.value = '123'
        expect(element2.state.isFocused).toBe(false)
        element2.sendChangeStatus(true)

        const element3 = new IFrameFormElement(collect_element, '', {containerType: ContainerType.COMPOSABLE}, context)
        element3.onFocusChange(false)
        element3.state.value = '123'
        expect(element3.state.isFocused).toBe(false)
        element3.sendChangeStatus(true)
    });
})


busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
const on = jest.fn();

const data = {
    additionalFields: {
        records: [{
            table: "pii_fields",
            fields: {
                cvv: '123',
                name:'name',
                skyflowID: 'ghgjhjh2',
            }
        }, {
            table: 'table',
            fields: {
                name: 'joey'
            }
        }]
    },
    tokens: true,
    upsert: [{ table: '', column: '  ' }],
    elementIds: []
}
const data2 = {
    additionalFields: {
        records: [{
            table: "pii_fields",
            fields: {
                cvv: '123',
                skyflowID: 'ghgjhjh2',
            }
        }]
    },
    tokens: false,
    upsert: [{ table: '', column: '  ' }]
}
const data3 = {
    additionalFields: {
        records: [{
            table: "pii_fields",
            fields: {
                cvv: '123',
                skyflowID: '',
            }
        }]
    },
    tokens: true,
    upsert: [{ table: '', column: '  ' }]
}
const fileData = {
    lastModified: '',
    lastModifiedDate: '',
    name: "sample.pdf",
    size: 74570648,
    type: "application/pdf",
    webkitRelativePath: ""
}
const fileDataInvalid = {
    lastModified: '',
    lastModifiedDate: '',
    name: "sample.pdf",
    size: 74570648,
    type: "application/pdf",
    webkitRelativePath: ""
}


export const insertResponse = {
    vaultID: 'vault123',
    responses: [
        {
            records: [
                {
                    skyflow_id: 'testId',
                },
            ],
        },
        {
            fields: {
                '*': 'testId',
                cvv: 'cvvToken'
            },
        },
    ],
};

export const fileResponse = {
    "fileUploadResponse": [
        {
            "skyflow_id": "431eaa6c-5c15-4513-aa15-29f50babe882"
        },
        {
            "skyflow_id": "e65db78d-e51b-475c-82ba-9117f6354651"
        }
    ]
}

const fileClientObj = {
    config: {},
    request: jest.fn(() => Promise.resolve(fileResponse)),
    toJSON: jest.fn(() => ({
        config: {},
        metaData: {
            uuid: ''
        }
    }))
}


const clientObj = {
    config: {},
    request: jest.fn(() => Promise.resolve(insertResponse)),
    toJSON: jest.fn(() => ({
        config: {},
        metaData: {
            uuid: ''
        }
    }))
}

const stylesOptions = {
    inputStyles: {
      base: {
        border: "1px solid #eae8ee",
        padding: "10px 16px",
        borderRadius: "4px",
        color: "#1d1d1d",
        marginTop: "4px"
      },
      complete: {
        color: "#4caf50"
      },
      empty: {},
      focus: {},
      invalid: {
        color: "#f44336"
      },
      cardIcon: {
        position: "absolute",
        left: "8px",
        top: "calc(50% - 10px)",
      },
      copyIcon: {
        position: "absolute",
        right: "8px",
         top:"calc(50% - 10px)",
        cursor: "pointer",
      }
    },
    labelStyles: {
      base: {
        fontSize: "16px",
        fontWeight: "bold"
      }
    },
    errorTextStyles: {
      base: {
        color: "#f44336"
      }
    }
  };

  const element = {
    elementName: `element:FILE_INPUT:123`,
    rows: [{
        elements: [
            {
                elementType: 'FILE_INPUT',
                elementName: `element:FILE_INPUT:123`,
                table: 'patients',
                column: 'card_number',
                ...stylesOptions
            }
        ]
    }],
    errorTextStyles:{
      base: {
        color: "#f44336",
        fontFamily:'Inter',
      },
      global:{
        '@import':'https://font-url.com/Inter'
      }
    },
    clientDomain: 'http://localhost.com'
  }
const emit = jest.fn()
describe('test file Upload method', () => {
    let emitSpy;
    let targetSpy;

    beforeEach(() => {
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
            emit
        });
    });

    test('validate for file input - valid blockZeroSizeFile boolean', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        var options = { blockEmptyFiles: true};
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
            const options1 = formatOptions(elementType, options, logLevel)
        }).not.toThrow();
      });
      test('validate for file input - valid false blockZeroSizeFile boolean', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { blockEmptyFiles: false };
        const logLevel = LogLevel.ERROR;
      
        expect(()=>{
            const options1 = formatOptions(elementType, options, logLevel);
        }).not.toThrow();
      });
      test('validate for file input - invalid blockZeroSizeFile boolean', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { blockEmptyFiles: "hello" };
        const logLevel = LogLevel.ERROR;
      
        expect(()=>{
            formatOptions(elementType, options, logLevel)
        }).toThrowError(parameterizedString(logs.errorLogs.INVALID_BOOLEAN_OPTIONS, "blockEmptyFiles"));
      });  
    test('validate for file input - valid allowedFileType array', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { allowedFileType: [".pdf", ".png"] };
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
          const formattedOptions = formatOptions(elementType, options, logLevel);
        }).not.toThrow();
      });
      
    test('validate for file input - invalid file types in allowedFileType array', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { allowedFileType: [".pdf", 42] };
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
          const formattedOptions = formatOptions(elementType, options, logLevel);
        }).toThrowError(parameterizedString(logs.errorLogs.INVALID_ALLOWED_FILETYPE_ARRAY));
      });
    test('validate for file input - invalid allowedFileType (not an array)', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { allowedFileType: 'invalidFileType' };
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
          const formattedOptions = formatOptions(elementType, options, logLevel);
        }).toThrowError(parameterizedString(logs.errorLogs.INVALID_ALLOWED_OPTIONS));
      });
    test('validate for file input - empty allowedFileType array', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { allowedFileType: [] };
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
          const formattedOptions = formatOptions(elementType, options, logLevel);
        }).toThrowError(parameterizedString(logs.errorLogs.EMPTY_ALLOWED_OPTIONS_ARRAY));
      });
})

// const tableCol = btoa('1234');
// const file_element = `element:FILE_INPUT:${tableCol}`;
// const multi_file_element = `element:MULTI_FILE_INPUT:${tableCol}`;
// const context = { logLevel: 'ERROR', env: 'PROD' };

// Helper to build a File of specific byte length using repeated characters
const buildFile = (bytes, name, type = 'application/octet-stream') => {
  const chunk = 'a'.repeat(bytes);
  return new File([chunk], name, { type });
};

describe('getFileDetails isolated tests', () => {
  test('returns empty array for null value', () => {
    const element = new IFrameFormElement(file_element, '', { containerType: ContainerType.COMPOSABLE }, context);
    expect(element.getFileDetails(null)).toEqual([]);
  });

  test('single File returns correct metadata and size rounding (0 bytes)', () => {
    const element = new IFrameFormElement(file_element, '', { containerType: ContainerType.COMPOSABLE }, context);
    const zeroFile = buildFile(0, 'zero.bin');
    const details = element.getFileDetails(zeroFile);
    expect(details).toHaveLength(1);
    expect(details[0]).toMatchObject({ fileName: 'zero.bin', fileType: 'application/octet-stream', fileSizeKB: 0 });
  });

  test('single File size rounding: 1 byte -> 1KB, 1023 -> 1KB, 1024 -> 1KB, 1025 -> 2KB', () => {
    const element = new IFrameFormElement(file_element, '', { containerType: ContainerType.COMPOSABLE }, context);
    const f1 = buildFile(1, 'one.bin');
    const f2 = buildFile(1023, 'almost1k.bin');
    const f3 = buildFile(1024, 'onek.bin');
    const f4 = buildFile(1025, 'overonek.bin');
    expect(element.getFileDetails(f1)[0].fileSizeKB).toBe(1);
    expect(element.getFileDetails(f2)[0].fileSizeKB).toBe(1);
    expect(element.getFileDetails(f3)[0].fileSizeKB).toBe(1);
    expect(element.getFileDetails(f4)[0].fileSizeKB).toBe(2);
  });

  test('mocked FileList with two files returns both entries', () => {
    const element = new IFrameFormElement(multi_file_element, '', { containerType: ContainerType.COMPOSABLE }, context);
    const file1 = buildFile(11, 'f1.txt', 'text/plain');
    const file2 = buildFile(2048, 'f2.txt', 'text/plain');
  const mockFileList = { 0: file1, 1: file2, length: 2, item: (i) => (i === 0 ? file1 : file2) };
    if (typeof FileList !== 'undefined') Object.setPrototypeOf(mockFileList, FileList.prototype);
    const details = element.getFileDetails(mockFileList);
    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({ fileName: 'f1.txt', fileType: 'text/plain', fileSizeKB: 1 });
    expect(details[1]).toMatchObject({ fileName: 'f2.txt', fileType: 'text/plain', fileSizeKB: 2 });
  });

  test('invalid input object returns empty array', () => {
    const element = new IFrameFormElement(file_element, '', { containerType: ContainerType.COMPOSABLE }, context);
  expect(element.getFileDetails({ not: 'file' })).toEqual([]);
  });

  test('error path: malformed FileList that throws during iteration returns []', () => {
    const element = new IFrameFormElement(multi_file_element, '', { containerType: ContainerType.COMPOSABLE }, context);
  const throwingFileList = { length: 1 };
    // Force instanceof FileList if possible then make Array.from throw
    if (typeof FileList !== 'undefined') Object.setPrototypeOf(throwingFileList, FileList.prototype);
    throwingFileList[Symbol.iterator] = () => ({ next: () => { throw new Error('boom'); } });
    const details = element.getFileDetails(throwingFileList);
    expect(details).toEqual([]);
  });
});
