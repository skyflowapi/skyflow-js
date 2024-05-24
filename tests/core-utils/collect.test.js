import { getUpsertColumn, constructElementsInsertReq } from "../../src/core-utils/collect";
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