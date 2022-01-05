import { CardType } from '../../src/core/constants';
import SkyflowError from '../../src/libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../src/utils/constants';
import {
  detectCardType,
  validateCreditCardNumber,
  validateExpiryDate,
  validateSoapConnectionConfig
} from '../../src/utils/validators/index';

describe('Validation card number and Expiry Date', () => {
  test('validate card number', () => {
    const cardNumber = '378282246310005';
    expect(validateCreditCardNumber(cardNumber)).toBe(true);
  });
  test('validate card number', () => {
    const cardNumber = '4789-5673-0754-2090';
    expect(validateCreditCardNumber(cardNumber)).toBe(false);
  });

  test('validate expiry date', () => {
    const currentDate = new Date();
    const expiryDate = `01/${currentDate.getFullYear()+1}`;
    expect(validateExpiryDate(expiryDate,"MM/YYYY")).toBe(true);
  });

  test('validate expiry date', () => {
    const expiryDate = '17/2021';
    expect(validateExpiryDate(expiryDate,"MM/YYYY")).toBe(false);
  });

  test('validate expiry date', () => {
    const expiryDate = '12/2019';
    expect(validateExpiryDate(expiryDate,"MM/YYYY")).toBe(false);
  });
});
describe('Detect Card Type',()=>{
  test("Default type for Empty String",()=>{
    expect(detectCardType("")).toBe(CardType.DEFAULT);
  });
  test("Default type for invalid String",()=>{
    expect(detectCardType("not_a_card_number")).toBe(CardType.DEFAULT);
  });
  test("Detects Visa Card Type",()=>{
    expect(detectCardType("4111")).toBe(CardType.VISA);
  });
  test("Detects Master Card Type",()=>{
    expect(detectCardType("5105105105105100")).toBe(CardType.MASTERCARD);
  });
  test("Detects Amex Card Type",()=>{
    expect(detectCardType("378282246310005")).toBe(CardType.AMEX);
  });
  test("Detects Dinners Club Type",()=>{
    expect(detectCardType("30569309025904")).toBe(CardType.DINERS_CLUB);
  });
  test("Detects Discover Card Type",()=>{
    expect(detectCardType("6011111111111117")).toBe(CardType.DISCOVER);
  });
  test("Detects JCB Card Type",()=>{
    expect(detectCardType("3530111333300000")).toBe(CardType.JCB);
  });
  test("Detects Hipper Card Type",()=>{
    expect(detectCardType("6062828888666688")).toBe(CardType.HIPERCARD);
  });
  test("Detects Mastero Card Type",()=>{
    expect(detectCardType("6759649826438453")).toBe(CardType.MAESTRO);
  });
  test("Detects Union Pay Card Type",()=>{
    expect(detectCardType("6221260062379699")).toBe(CardType.UNIONPAY);
  });
});

describe("validate soap connection",()=>{
  test("empty config",()=>{
    try{
      validateSoapConnectionConfig(null)
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.MISSING_SOAP_CONNECTION_CONFIG.description);
    }
  });
  test("no connection url",()=>{
    try{
      validateSoapConnectionConfig({});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.MISSING_SOAP_CONNECTION_URL.description);
    }
  });
  test("empty connection url",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:""});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_SOAP_CONNECTION_URL.description);
    }
  });
  test("not a string type connection url",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:1234});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SOAP_CONNECTION_URL_TYPE.description);
    }
  });
  test("invalid connection url",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"not_a_url"});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_CONNECTION_URL.description);
    }
  });
  test("no request xml",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com"});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.MISSING_SOAP_REQUEST_XML.description);
    }
  });
  test("empty request xml",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com",requestXML:null});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.EMPTY_SOAP_REQUEST_XML.description);
    }
  });
  test("not string type request xml",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com",requestXML:true});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SOAP_REQUEST_XML_TYPE.description);
    }
  });
  test("invalid request xml",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com",requestXML:"not_xml_structure"});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SOAP_REQUEST_XML.description);
    }
  });
  test("invalid response xml type",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com",requestXML:"<valid></valid>",responseXML:122});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SOAP_RESPONSE_XML_TYPE.description);
    }
  });
  test("invalid response xml",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com",requestXML:"<valid></valid>",responseXML:"not_xml_structure"});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_SOAP_RESPONSE_XML.description);
    }
  });
  test("invalid httpheaders object",()=>{
    try{
      validateSoapConnectionConfig({connectionURL:"https://validurl.com",requestXML:"<valid></valid>",responseXML:"<valid></valid>",httpHeaders:true});
    }catch(err){
      expect(err?.errors[0].description).toEqual(SKYFLOW_ERROR_CODE.INVALID_HTTP_HEADERS_TYPE.description);
    }
  });
});