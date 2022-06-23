/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { CardType, ElementType, FORMAT_REGEX, soapResXmlErrors } from '../../src/core/constants';
import SKYFLOW_ERROR_CODE from '../../src/utils/constants';
import { replaceIdInResponseXml , appendZeroToOne, getReturnValue } from '../../src/utils/helpers/index';
import { parameterizedString } from '../../src/utils/logsHelper';
const xml = '<response><Skyflow>123</Skyflow></response><response2><Skyflow>456</Skyflow></response2>'
import { detectCardType } from '../../src/utils/validators/index';

const element1 = {
    iframeName: jest.fn(() => ('reveal:123')),
    getRecordData: jest.fn(() => ({
        formatRegex: /..$/,
        replaceText: '$1'
    })),
    isMounted: jest.fn(() => (true))
}

const element2 = {
    iframeName: jest.fn(() => ('reveal:456')),
    getRecordData: jest.fn(() => ({
        formatRegex: /..$/
    })),
    isMounted: jest.fn(() => (true))
}

describe('replace Id In ResponseXml',() => {
    
    test('replace Id success',()=>{
        const resXml = replaceIdInResponseXml(xml, {123: element1, 456:element2}, soapResXmlErrors)
        expect(resXml.includes(FORMAT_REGEX)).toBeTruthy()
    })

    test('duplicate ids in resXml', () => {
        try {
            const duplicateIdInxml = '<response><Skyflow>123</Skyflow></response><response2><Skyflow>123</Skyflow></response2>'
            const resXml = replaceIdInResponseXml(duplicateIdInxml, {123: element1}, soapResXmlErrors)
          } catch(err) {
            expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT_IN_SOAP_RESPONSE_XML.description)
          }
    })

    test('element not mounted in resXml', () => {
        try {
            const resXml = replaceIdInResponseXml(xml, {123: {...element1, isMounted: jest.fn(() => (false))}}, soapResXmlErrors)
          } catch(err) {
            expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.ELEMENT_NOT_MOUNTED_IN_SOAP_RESPONSE_XML.description, 123))
          }
    })

    test('append zero for number one on blur event', () => {
        expect(appendZeroToOne('1')).toBe('01')
        expect(appendZeroToOne('2')).toBe('2')
        expect(appendZeroToOne('11')).toBe('11')
    })

})

describe('bin data for for all card number except AMEX element type on CHANGE event',()=>{
    test("in PROD return bin data only for card number element",()=>{
        expect(detectCardType("4111 1111 1111 1111")).toBe(CardType.VISA)
        expect(getReturnValue("4111 1111 1111 1111",ElementType.CARD_NUMBER,false)).toBe("41111111XXXXXXXX")
        expect(getReturnValue("4111 1111 ",ElementType.CARD_NUMBER,false)).toBe("41111111")
        expect(detectCardType("5105 1051 0510 5100")).toBe(CardType.MASTERCARD)
        expect(getReturnValue("5105 1051 0510 5100",ElementType.CARD_NUMBER,false)).toBe("51051051XXXXXXXX")
        expect(detectCardType("5066 9911 1111 1118")).toBe(CardType.DEFAULT)
        expect(getReturnValue("5066 9911 1111 1118",ElementType.CARD_NUMBER,false)).toBe("50669911XXXXXXXX")
        expect(getReturnValue("123",ElementType.CVV,false)).toBe(undefined)
        expect(getReturnValue("name",ElementType.CARDHOLDER_NAME,false)).toBe(undefined)
        expect(getReturnValue("02",ElementType.EXPIRATION_MONTH,false)).toBe(undefined)
        expect(getReturnValue("2025",ElementType.EXPIRATION_YEAR,false)).toBe(undefined)
        expect(getReturnValue("1234",ElementType.PIN,false)).toBe(undefined)
    })
    test("in DEV return data for all elements",()=>{
        expect(getReturnValue("4111 1111 1111 1111",ElementType.CARD_NUMBER,true)).toBe("4111111111111111")
        expect(getReturnValue("123",ElementType.CVV,true)).toBe("123")
        expect(getReturnValue("1234",ElementType.PIN,true)).toBe("1234")
        expect(getReturnValue("name",ElementType.CARDHOLDER_NAME,true)).toBe("name")
        expect(getReturnValue("02",ElementType.EXPIRATION_MONTH,true)).toBe("02")
        expect(getReturnValue("2025",ElementType.EXPIRATION_YEAR,true)).toBe("2025")
    })
})

describe('bin data for for AMEX card number element type on CHANGE event',()=>{
    test("in PROD return bin data only for card number element",()=>{
        expect(detectCardType("3782 822463 10005")).toBe(CardType.AMEX)
        expect(getReturnValue("3782 822463 10005",ElementType.CARD_NUMBER,false)).toBe("378282XXXXXXXXX")
        expect(getReturnValue("3782 822",ElementType.CARD_NUMBER,false)).toBe("378282X")
        expect(getReturnValue("123",ElementType.CVV,false)).toBe(undefined)
        expect(getReturnValue("name",ElementType.CARDHOLDER_NAME,false)).toBe(undefined)
        expect(getReturnValue("02",ElementType.EXPIRATION_MONTH,false)).toBe(undefined)
        expect(getReturnValue("2025",ElementType.EXPIRATION_YEAR,false)).toBe(undefined)
        expect(getReturnValue("1234",ElementType.PIN,false)).toBe(undefined)
    })
    test("in DEV return data for all elements",()=>{
        expect(getReturnValue("3782 822463 10005",ElementType.CARD_NUMBER,true)).toBe("378282246310005")
        expect(getReturnValue("123",ElementType.CVV,true)).toBe("123")
        expect(getReturnValue("1234",ElementType.PIN,true)).toBe("1234")
        expect(getReturnValue("name",ElementType.CARDHOLDER_NAME,true)).toBe("name")
        expect(getReturnValue("02",ElementType.EXPIRATION_MONTH,true)).toBe("02")
        expect(getReturnValue("2025",ElementType.EXPIRATION_YEAR,true)).toBe("2025")
    })
})