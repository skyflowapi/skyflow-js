import { getUpsertColumn } from "../../src/core-utils/collect";

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
        const fnResponse = getUpsertColumn('test', options);
        expect(fnResponse).toStrictEqual('column');
    });
    test("return empty column", () => {
        const fnResponse = getUpsertColumn('testTwo', options);
        expect(fnResponse).toStrictEqual('');
    });

});