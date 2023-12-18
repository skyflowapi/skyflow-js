/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { COLLECT_FRAME_CONTROLLER, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS } from '../../../../src/core/constants';
import { Env, LogLevel, ValidationRuleType } from '../../../../src/utils/common';
import { IFrameForm, IFrameFormElement } from '../../../../src/core/internal/iframe-form'
import * as busEvents from '../../../../src/utils/bus-events';
import SkyflowError from '../../../../src/libs/skyflow-error';
import logs from '../../../../src/utils/logs';
import { ContainerType } from '../../../../src/skyflow';
import { formatOptions } from '../../../../src/libs/element-options';
import { parameterizedString } from '../../../../src/utils/logs-helper';

const tableCol = btoa('1234')
const collect_element = `element:CVV:${tableCol}`;
const file_element = `element:FILE_INPUT:${tableCol}`;

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
    let testValue;
    beforeEach(() => {
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
        });
        windowSpy = jest.spyOn(window,'parent','get');
        windowSpy.mockImplementation(()=>({
         
                frames:{
                'element:CARD_NUMBER:${tableCol}':{document:{
                    getElementById:()=>({value:testValue})
                }}
                }
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

    test('set mask with null value',()=>{
        const element = new IFrameFormElement(collect_element, '',{} ,context);
        element.setReplacePattern(null);
        element.setMask(null);
        expect(element.mask).toBe(undefined)
        expect(element.replacePattern).toBe(undefined);
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
    test('test tokenize error case', () => {
        const element = new IFrameFormElement(`element:EXPIRATION_MONTH:${tableCol}`, {}, context)
        const form = new IFrameForm(element)
        form.setClient(clientObj1)
        form.setClientMetadata(metaData)
        form.setContext(context)
        expect(form.tokenize()).rejects.toThrow(SkyflowError)
    })

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
        expect(element.errorText).toBe(logs.errorLogs.VALIDATION_FAILED)
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
        expect(cardNumberElement.errorText).toBe(logs.errorLogs.VALIDATION_FAILED)
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

        let isValid = cardNumberElement.validator('5555 3412 4444 1115')
        expect(isValid).toBe(false)
        expect(cardNumberElement.errorText).toBe(logs.errorLogs.VALIDATION_FAILED)
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
    upsert: [{ table: '', column: '  ' }]
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

describe('test iframeForm collect method', () => {

    let emitSpy;
    let targetSpy;

    beforeEach(() => {
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
        });
    });

    test('initialize iframeform and submit collect with invalid input', (done) => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(clientObj)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const frameReadyEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + 'controllerId');
        const frameReadyCb = frameReadyEvent[0][1];

        expect(() => { frameReadyCb({}) }).toThrow(SkyflowError)

        frameReadyCb({ name: COLLECT_FRAME_CONTROLLER })

        expect(() => { frameReadyCb({ name: "element:type:aW52YWxpZA==" }) }).toThrow(SkyflowError)
        const skyflowInit = jest.fn();
        let windowSpy = jest.spyOn(global, 'window', 'get');
        windowSpy.mockImplementation(() => ({
            parent: {
                frames: [{
                    name: collect_element,
                    location: {
                        href: 'http://iframe.html'
                    },
                    Skyflow: {
                        init: skyflowInit
                    }
                }]
            },
            location: {
                href: 'http://iframe.html'
            }
        }));

        frameReadyCb({ name:collect_element})

        const createFormElement = skyflowInit.mock.calls[0][0]
        const element = createFormElement(collect_element)

        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();
        tokenizationCb(data, cb2)

        setTimeout(() => {
            expect(cb2.mock.calls[0][0].error.message).toBeDefined()
        }, 1000)

        element.setValue('123')
        const cb3 = jest.fn()
        tokenizationCb(data, cb3)

        setTimeout(() => {
            expect(cb3.mock.calls[0][0].records.length).toBe(2);
        }, 1000)

        element.fieldName = 'col';
        element.tableName = 'table';
        element.state.name = 'col';
        
        const cb4 = jest.fn()
        tokenizationCb({
            ...data,
            additionalFields: {
                ...data.additionalFields,
                records: [{
                    table: 'table',
                    fields: {
                        col: '123'
                    }
                }]
            }
        }, cb4)

        setTimeout(() => {
            expect(cb4.mock.calls[0][0].error).toBeDefined()
            done()
        }, 1000)


    })

    test('collect submit without client initializatiob', () => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setContext(context)
        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();

        expect(() => { tokenizationCb(data, cb2); }).toThrow(SkyflowError)

    })
    test('collect error', () => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setContext(context)
        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();

        expect(() => { tokenizationCb(data, cb2); }).toThrow(SkyflowError)

    })
    test('collect error second case', () => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setContext(context)
        form.setClient(clientObj1)
        expect(form.tokenize(records)).rejects.toMatchObject({"error": {"code": 404, "description": "Not Found"}});
    })
    test('insert records with tokens as true', (done) => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(clientObj)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();
        tokenizationCb(data, cb2);
        setTimeout(() => {
            expect(cb2.mock.calls[0][0].records.length).toBe(2);
            expect(cb2.mock.calls[0][0].records[0].table).toBe('table');
            expect(Object.keys(cb2.mock.calls[0][0].records[0].fields).length).toBe(2);
            done()
        }, 1000)
    })
    let clientObj1 = {
        config: {},
        request: jest.fn(() => Promise.reject({error:{code:404,description:"Not Found"}})),
        toJSON: jest.fn(() => ({
            config: {},
            metaData: {
                uuid: ''
            }
        }))
    }
    test('ererr', (done) => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(clientObj1)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();
        tokenizationCb(data, cb2);
        setTimeout(() => {
            expect(cb2.mock.calls[0][0].error).toBeDefined();
            done()
        }, 1000)
        form.tokenize(data).then().catch( err => {
            expect(err).toBeDefined();
        })
    })
    test('success', (done) => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(clientObj1)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();
        tokenizationCb(data, cb2);
        setTimeout(() => {
            expect(cb2.mock.calls[0][0].error).toBeDefined();
            done()
        }, 1000)
        form.tokenize(data).then().catch( err => {
            expect(err).toBeDefined();
        })
    })
    test('insert records duplicate error', (done) => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(clientObj)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();
        tokenizationCb({
            additionalFields: {
                records: [{
                    table: 'table',
                    fields: {
                        col: '123',
                        col: '123',
                    }
                }]
            }
        }, cb2)   
        setTimeout(() => {
            expect(cb2.mock.calls[0][0].error.message).toBeDefined()
            done()
        }, 1000)
    })
    test('insert records with tokens as false', (done) => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(clientObj)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const tokenizationEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST + 'controllerId');
        const tokenizationCb = tokenizationEvent[0][1];
        const cb2 = jest.fn();
        tokenizationCb(data2, cb2);
        setTimeout(() => {
            expect(cb2.mock.calls[0][0].records[0].table).toBe('pii_fields');
            expect(Object.keys(cb2.mock.calls[0][0].records[0]).length).toBe(2);
            done()
        }, 1000)
    })

})

describe('test file Upload method', () => {
    let emitSpy;
    let targetSpy;

    beforeEach(() => {
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
        });
    });

    test('initialize iFrame and upload with file input', () => {
        const form = new IFrameForm("controllerId", "", "ERROR");
        form.setClient(fileClientObj)
        form.setClientMetadata(metaData)
        form.setContext(context)

        const frameReadyEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + 'controllerId');
        const frameReadyCb = frameReadyEvent[0][1];

        expect(() => { frameReadyCb({}) }).toThrow(SkyflowError)

        frameReadyCb({ name: COLLECT_FRAME_CONTROLLER })

        expect(() => { frameReadyCb({ name: "element:type:aW52YWxpZA==" }) }).toThrow(SkyflowError)
        const skyflowInit = jest.fn();
        let windowSpy = jest.spyOn(global, 'window', 'get');

        windowSpy.mockImplementation(() => ({
            parent: {
                frames: [{
                    name: file_element,
                    location: {
                        href: 'http://iframe.html'
                    },
                    Skyflow: {
                        init: skyflowInit
                    }
                }]
            },
            location: {
                href: 'http://iframe.html'
            }
        }));

        frameReadyCb({ name: file_element })

        const createFormElement = skyflowInit.mock.calls[0][0]
        const fileElement = createFormElement(file_element)

        const fileUploadEvent = on.mock.calls.filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD + 'controllerId');
        const fileUploadCb = fileUploadEvent[0][1];
        const cb2 = jest.fn();
        fileUploadCb(fileData, cb2)

        setTimeout(() => {
            expect(cb2.mock.calls[0][0].error.message).toBeDefined()
        }, 3000)

        fileElement.setValue({
            lastModified: '',
            lastModifiedDate: '',
            name: "sample.jpg",
            size: 48848,
            type: "image/jpeg",
            webkitRelativePath: ""
        })
        const cb3 = jest.fn()
        fileUploadCb(fileData, cb3)

        setTimeout(() => {
            expect(cb3.mock.calls[0][0].records.length).toBe(1);
            done()
        }, 1000)
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
        }).toThrowError(logs.errorLogs.INVALID_ALLOWED_FILETYPE_ARRAY);
      });
    test('validate for file input - invalid allowedFileType (not an array)', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { allowedFileType: 'invalidFileType' };
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
          const formattedOptions = formatOptions(elementType, options, logLevel);
        }).toThrowError(logs.errorLogs.INVALID_ALLOWED_OPTIONS);
      });
    test('validate for file input - empty allowedFileType array', () => {
        const elementType = ELEMENTS.FILE_INPUT.name;
        const options = { allowedFileType: [] };
        const logLevel = LogLevel.ERROR;
      
        expect(() => {
          const formattedOptions = formatOptions(elementType, options, logLevel);
        }).toThrowError(logs.errorLogs.EMPTY_ALLOWED_OPTIONS_ARRAY);
      });
      
})