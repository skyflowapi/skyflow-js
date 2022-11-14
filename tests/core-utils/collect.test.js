import { getUpsertColumn } from "../../src/core-utils/collect";
import SKYFLOW_ERROR_CODE from "../../src/utils/constants";

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
    test("incorrect table key in upsert options", () => {
        const incorrectOptions = {
            upsert: [
                {
                    incorrectTable: 'test',
                    column: 'column'
                }
            ]
        }
        try {
            getUpsertColumn('testTwo', incorrectOptions.upsert);
        }
        catch (err) {
            expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_TABLE_IN_UPSERT_OPTIONS.description);
        }
    });
    test("incorrect column key in upsert options", () => {
        const incorrectOptions = {
            upsert: [
                {
                    table: 'test',
                    incorrectColumn: 'column'
                }
            ]
        }
        try {
            getUpsertColumn('testTwo', incorrectOptions.upsert);
        }
        catch (err) {
            expect(err?.error?.description).toEqual(SKYFLOW_ERROR_CODE.INVALID_COLUMN_IN_UPSERT_OPTIONS.description);
        }
    });
    test("upsert options as undefined", () => {
        const fnResponse = getUpsertColumn('test', undefined);
        expect(fnResponse).toStrictEqual('');
    });

});