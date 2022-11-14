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
    test("upsert options as undefined", () => {
        const fnResponse = getUpsertColumn('test', undefined);
        expect(fnResponse).toStrictEqual('');
    });

});