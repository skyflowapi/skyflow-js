import { getUpsertColumn, constructElementsInsertReq, checkForElementMatchRule, checkForValueMatch } from "../../src/core-utils/collect";
import { ValidationRuleType } from "../../src/utils/common";
import SKYFLOW_ERROR_CODE from "../../src/utils/constants";
import { parameterizedString } from "../../src/utils/logs-helper";

describe("getUpsertColumn fn test", () => {
    const options = {
        upsert: [
            {
                table: 'test',
                column: 'column'
            }
        ]
    }
    test("return unique column", () => {
        const fnResponse = getUpsertColumn('test', options.upsert);
        expect(fnResponse).toStrictEqual('column');
    });
    test("return empty column", () => {
        const fnResponse = getUpsertColumn('testTwo', options.upsert);
        expect(fnResponse).toStrictEqual('');
    });
    test("upsert options as undefined", () => {
        const fnResponse = getUpsertColumn('test', undefined);
        expect(fnResponse).toStrictEqual('');
    });

});
let req = {
    'table1': {
        fields: {
            cvv: '122'
        }
    }
}
let update = {
    'table1': {
        fields: {
            cvv: '122'
        }
    }
}
let update2 = {
    'table1': {
        fields: {
            column: '122'
        }
    }
}
const options = {
    tokens: true,
    additionalFields: {
      records: [
        {
          table: "table1",
          fields: {
            name: 'name'
          },
        },
      ],
    },
  };
  const options2 = {
    tokens: true,
    additionalFields: {
      records: [
        {
          table: "table1",
          fields: {
            column: '122',
            skyflowID: 'table1'
          },
        },
      ],
    },
  };
describe("constructElementsInsertReq fn test", () => {

    test("constructElementsInsertReq error 1", () => {
         try{
            constructElementsInsertReq(req, update, options);
        }catch(err){
            expect(err.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT_ADDITIONAL_FIELDS.description));
        }
    });
    test("constructElementsInsertReq error 2", () => {
        try{
           constructElementsInsertReq(req, update2, options);
       }catch(err){
           expect(err.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT.description, 'name', 'table1'));
       }
   });
   test("constructElementsInsertReq error 2", () => {
    try{
       constructElementsInsertReq(req, update2, options2);
   }catch(err){
    expect(err.error.description).toEqual(parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT.description));
}
});

});

class MockIFrameFormElement {
    state = { value: 'testValue' };

    isMatchEqual(index, value, rule) {
        return index % 2 === 0; 
    }
}

describe('checkForElementMatchRule', () => {
    it('should return false when validations array is null or undefined', () => {
        expect(checkForElementMatchRule(null)).toBe(false);
        expect(checkForElementMatchRule(undefined)).toBe(false);
    });

    it('should return false when validations array is empty', () => {
        expect(checkForElementMatchRule([])).toBe(false);
    });

    it('should return true when an ELEMENT_VALUE_MATCH_RULE type is found', () => {
        const validations = [
            { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
            { type: ValidationRuleType.ANOTHER_TYPE, params: {} },
        ];
        expect(checkForElementMatchRule(validations)).toBe(true);
    });

    it('should return false when no ELEMENT_VALUE_MATCH_RULE type is found', () => {
        const validations = [
            { type: ValidationRuleType.ANOTHER_TYPE, params: {} },
            { type: ValidationRuleType.DIFFERENT_TYPE, params: {} },
        ];
        expect(checkForElementMatchRule(validations)).toBe(false);
    });
});

describe('checkForValueMatch', () => {
    let element;

    beforeEach(() => {
        element = new MockIFrameFormElement();
    });

    it('should return false when validations array is null or undefined', () => {
        expect(checkForValueMatch(null, element)).toBe(false);
        expect(checkForValueMatch(undefined, element)).toBe(false);
    });

    it('should return false when validations array is empty', () => {
        expect(checkForValueMatch([], element)).toBe(false);
    });

    it('should return true when an ELEMENT_VALUE_MATCH_RULE type is found and isMatchEqual returns false', () => {
        const validations = [
            { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
        ];
        jest.spyOn(element, 'isMatchEqual').mockReturnValue(false);

        expect(checkForValueMatch(validations, element)).toBe(true);
    });

    it('should return false when an ELEMENT_VALUE_MATCH_RULE type is found but isMatchEqual returns true', () => {
        const validations = [
            { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
        ];
        jest.spyOn(element, 'isMatchEqual').mockReturnValue(true);

        expect(checkForValueMatch(validations, element)).toBe(false);
    });

    it('should return false when no ELEMENT_VALUE_MATCH_RULE type is found', () => {
        const validations = [
            { type: ValidationRuleType.ANOTHER_TYPE, params: {} },
        ];
        expect(checkForValueMatch(validations, element)).toBe(false);
    });
});
