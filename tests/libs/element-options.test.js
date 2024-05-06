import { CARDNUMBER_INPUT_FORMAT, CardType, ElementType } from "../../src/core/constants";
import { formatOptions } from "../../src/libs/element-options";
import { LogLevel } from "../../src/utils/common";
import SKYFLOW_ERROR_CODE from "../../src/utils/constants";
import { parameterizedString } from "../../src/utils/logs-helper";
import logs from "../../src/utils/logs";
import { validateInputFormatOptions } from "../../src/utils/validators";
import { DEFAULT_CARD_NUMBER_SEPERATOR } from "../../src/core/constants";

jest.mock('../../src/utils/validators',()=>{
    const originalModule = jest.requireActual('../../src/utils/validators')
    return {
        ...originalModule,
        validateInputFormatOptions : jest.fn(),
    }
});

describe('test formatOptions function with format and translation', () => {
    test("formatOptions function should return existing options as is", () => {
        const options = { enableCardIcon: true }
        expect(formatOptions(ElementType.CVV, options, LogLevel.ERROR)).toEqual({ ...options, required: false })
    });   

    test('should throw warning if the format or translation is provided for not supported element types', () => {
        const spy = jest.spyOn(console, 'warn'); 
        const options = { format: 'XXXX' }
        
        formatOptions(ElementType.CVV, options, LogLevel.WARN);
        expect(spy).toBeCalledWith(`WARN: [Skyflow] ${parameterizedString(logs.warnLogs.INPUT_FORMATTING_NOT_SUPPROTED,
            ElementType.CVV)}`);
        expect(spy).toBeCalledTimes(1);

        formatOptions(ElementType.EXPIRATION_MONTH, options, LogLevel.WARN);
        expect(spy).toBeCalledWith(`WARN: [Skyflow] ${parameterizedString(logs.warnLogs.INPUT_FORMATTING_NOT_SUPPROTED,
            ElementType.EXPIRATION_MONTH)}`);
        expect(spy).toBeCalledTimes(2);
        
        formatOptions(ElementType.PIN, {enableCardIcon:true}, LogLevel.WARN);
        expect(spy).toBeCalledTimes(2);
        
        formatOptions(ElementType.CARDHOLDER_NAME, options, LogLevel.WARN);
        expect(spy).toBeCalledWith(`WARN: [Skyflow] ${parameterizedString(logs.warnLogs.INPUT_FORMATTING_NOT_SUPPROTED,
            ElementType.CARDHOLDER_NAME)}`);
        expect(spy).toBeCalledTimes(3);
        
        formatOptions(ElementType.FILE_INPUT, options, LogLevel.WARN);
        expect(spy).toBeCalledWith(`WARN: [Skyflow] ${parameterizedString(logs.warnLogs.INPUT_FORMATTING_NOT_SUPPROTED,
            ElementType.FILE_INPUT)}`);
        expect(spy).toBeCalledTimes(4);
        
        formatOptions(ElementType.PIN, options, LogLevel.WARN);
        expect(spy).toBeCalledWith(`WARN: [Skyflow] ${parameterizedString(logs.warnLogs.INPUT_FORMATTING_NOT_SUPPROTED,
            ElementType.PIN)}`);
        expect(spy).toBeCalledTimes(5);

    });

    test('should call validateInputFormatOptions function if the format or translation is provided for supported element types',()=>{
        const options = {format:'XXXX',translation:{X:'[0-9]'}}
        formatOptions(ElementType.INPUT_FIELD,options,LogLevel.ERROR);
        expect(validateInputFormatOptions).toBeCalled();
    });

    test('should return mask array object with valid format and translation for input field type',()=>{
        const options = {format:'XXXX',translation:{X:'[]'}}
        const formattedOptions = formatOptions(ElementType.INPUT_FIELD,options,LogLevel.ERROR);
        const res = { mask:[options.format,options.translation],required:false};
        expect(formattedOptions).toEqual(res)
    });

    test('should return mask array object with valid format and default translation for input field type',()=>{
        const options = {format:'XXXX'}
        const formattedOptions = formatOptions(ElementType.INPUT_FIELD,options,LogLevel.ERROR);
        const res = { mask:[options.format,{X:'[0-9]'}],required:false};
        expect(formattedOptions).toEqual(res)
    });

    test('should return default cardSeperator in the options as default only for card number field type - no format',()=>{
        const formattedOptions = formatOptions(ElementType.CARD_NUMBER,{required:false},LogLevel.ERROR);
        expect(formattedOptions).toEqual({required:false,cardSeperator:DEFAULT_CARD_NUMBER_SEPERATOR,enableCardIcon:true});
    });

    test('should return default cardSeperator in the options as default only for card number field type - not allowed format',()=>{
        const formattedOptions = formatOptions(ElementType.CARD_NUMBER,{required:false,format:'XXXX/XXXX/XXXX/XXXX'},LogLevel.ERROR);
        expect(formattedOptions).toEqual({required:false,cardSeperator:DEFAULT_CARD_NUMBER_SEPERATOR,enableCardIcon:true});
    });

    test('should return hypen cardSeperator in the options format only for card number field type - with dash format',()=>{
        const cardFormat = CARDNUMBER_INPUT_FORMAT.DASH_FORMAT
        const formattedOptions = formatOptions(ElementType.CARD_NUMBER,{required:false,format:cardFormat},LogLevel.ERROR);
        expect(formattedOptions).toEqual({required:false,cardSeperator:'-',enableCardIcon:true});
    });

    test('should return space cardSeperator in the options format only for card number field type - space format',()=>{
        const cardFormat = CARDNUMBER_INPUT_FORMAT.SPACE_FORMAT
        const formattedOptions = formatOptions(ElementType.CARD_NUMBER,{required:false,format:cardFormat},LogLevel.ERROR);
        expect(formattedOptions).toEqual({required:false,cardSeperator:DEFAULT_CARD_NUMBER_SEPERATOR,enableCardIcon:true});
    });

    test('should return preserveFileName true when not provied in options',()=>{
        const formattedOptions = formatOptions(ElementType.FILE_INPUT,{required:true},LogLevel.ERROR);
        expect(formattedOptions).toEqual({required:true,preserveFileName:true});
    });

    test('should return preserveFileName false when not provied as false in options',()=>{
        const formattedOptions = formatOptions(ElementType.FILE_INPUT,{required:true,preserveFileName:false},LogLevel.ERROR);
        expect(formattedOptions).toEqual({required:true,preserveFileName:false});
    });

    test('should throw errror for preserveFileName provied as not of boolean type',(done)=>{
        try{
            formatOptions(ElementType.FILE_INPUT,{required:true,preserveFileName:undefined},LogLevel.ERROR);
            done('should throw error');
        }catch(err){
            expect(err?.error?.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.INVALID_BOOLEAN_OPTIONS.description,'preserveFileName'))
            done();
        }
    });

    test('should throw errror for cardMetadata provied as not of object type',(done)=>{
        try{
            formatOptions(ElementType.CARD_NUMBER,{cardMetadata:true},LogLevel.ERROR);
            done('should throw error');
        }catch(err){
            expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_OPTION_CARD_METADATA.description);
            done();
        }
    });

    test('should throw errror for cardMetadata provied value is object type',(done)=>{
        try{
            formatOptions(ElementType.CARD_NUMBER,{cardMetadata:[]},LogLevel.ERROR);
            done('should throw error');
        }catch(err){
            expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_OPTION_CARD_METADATA.description);
            done();
        }
    });

    test('should throw errror for cardMetadata schema provied value is array type',(done)=>{
        try{
            formatOptions(ElementType.CARD_NUMBER,{cardMetadata:{scheme:{}}},LogLevel.ERROR);
            done('should throw error');
        }catch(err){
            expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_OPTION_CARD_SCHEME.description);
            done();
        }
    });

    test('should return the array of Cardtype provided in scheme of cardmetadata',()=>{
        const options = formatOptions(ElementType.CARD_NUMBER,{cardMetadata:{scheme:[CardType.VISA,CardType.CARTES_BANCAIRES]}},LogLevel.ERROR);
        expect(options).toEqual({cardMetadata:{scheme:[CardType.VISA,CardType.CARTES_BANCAIRES]}, "cardSeperator": " ","enableCardIcon": true,"required": false,})
    });


});