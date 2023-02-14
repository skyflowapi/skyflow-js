/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { COLLECT_FRAME_CONTROLLER, ELEMENT_EVENTS_TO_IFRAME } from '../../../../src/core/constants';
import { Env, LogLevel, ValidationRuleType } from '../../../../src/utils/common';
import { IFrameForm, IFrameFormElement } from '../../../../src/core/internal/iframe-form'
import * as busEvents from '../../../../src/utils/bus-events';
import SkyflowError from '../../../../src/libs/skyflow-error';
import logs from '../../../../src/utils/logs';
import { ContainerType } from '../../../../src/skyflow';

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

describe('test iframeFormelement', () => {

    let emitSpy;
    let targetSpy;
    let on = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        emitSpy = jest.spyOn(bus, 'emit');
        targetSpy = jest.spyOn(bus, 'target');
        targetSpy.mockReturnValue({
            on,
        });
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

    test('test setValue for expiration_month', () => {
        const element = new IFrameFormElement(`element:EXPIRATION_MONTH:${tableCol}`, {}, context)
        element.setValue('2')
        expect(element.state.value).toBe('02')

        element.setValue('12')
        expect(element.state.value).toBe('12')
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
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COMPOSABLE}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('cvv is required');
    });
    test('test error text without label collect element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, '',{containerType:ContainerType.COLLECT}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('Field is required');
    });
    test('test error text with label composable element',()=>{
        const element = new IFrameFormElement(`element:CVV:${tableCol}`, 'cvv label',{containerType:ContainerType.COMPOSABLE}, context)
        element.setValidation();
        element.doesClientHasError = true;
        element.setValue('');
        expect(element.errorText).toBe('cvv label is required');
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

        isValid = element.validator('99999')
        expect(isValid).toBe(false)
        expect(element.errorText).toBe(logs.errorLogs.VALIDATION_FAILED)
    })

})


busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
const on = jest.fn();

const data = {
    additionalFields: {
        records: [{
            table: "pii_fields",
            fields: {
                cvv: '123'
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
            expect(cb3.mock.calls[0][0].records.length).toBe(1);
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
            expect(cb2.mock.calls[0][0].records.length).toBe(1);
            expect(cb2.mock.calls[0][0].records[0].table).toBe('pii_fields');
            expect(Object.keys(cb2.mock.calls[0][0].records[0].fields).length).toBe(2);
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
    })

})