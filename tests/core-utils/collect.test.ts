import {
  getUpsertColumn,
  constructElementsInsertReq,
  checkForValueMatch,
  constructUpdateRecordResponse,
  constructUpdateRecordRequest,
  replaceCVVTokensInResponse,
} from "../../src/core-utils/collect";
import IFrameFormElement from "../../src/core/internal/iframe-form";
import {
  ICollectOptions,
  IUpdateOptions,
  IUpdateRequest,
  IUpsertOption,
  IValidationRule,
  ValidationRuleType,
} from "../../src/utils/common";
import SKYFLOW_ERROR_CODE from "../../src/utils/constants";
import { parameterizedString } from "../../src/utils/logs-helper";

describe("Testing getUpsertColumn method", () => {
  const options: ICollectOptions = {
    upsert: [
      {
        table: "test",
        column: "column",
      } as IUpsertOption,
    ],
  };

  test("return unique column", () => {
    const fnResponse = getUpsertColumn("test", options.upsert);
    expect(fnResponse).toStrictEqual("column");
  });

  test("return empty column", () => {
    const fnResponse = getUpsertColumn("testTwo", options.upsert);
    expect(fnResponse).toStrictEqual("");
  });

  test("upsert options as undefined", () => {
    const fnResponse = getUpsertColumn("test", undefined);
    expect(fnResponse).toStrictEqual("");
  });
});

let req = {
  table1: {
    fields: {
      cvv: "122",
    },
  },
};

let update = {
  table1: {
    fields: {
      cvv: "122",
    },
  },
};

let update2 = {
  table1: {
    fields: {
      column: "122",
    },
  },
};

const options: ICollectOptions = {
  tokens: true,
  additionalFields: {
    records: [
      {
        tableName: "table1",
        data: {
          name: "name",
        },
      },
    ],
  },
};

const options2: ICollectOptions = {
  tokens: true,
  additionalFields: {
    records: [
      {
        tableName: "table1",
        data: {
          column: "122",
        },
        skyflowId: "table1",
      },
    ],
  },
};

describe("Testing constructElementsInsertReq method", () => {
  test("constructElementsInsertReq error 1", () => {
    try {
      constructElementsInsertReq(req, update, options);
    } catch (err) {
      expect(err.error.description).toEqual(
        parameterizedString(
          SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT_ADDITIONAL_FIELDS.description
        )
      );
    }
  });

  test("constructElementsInsertReq error 2", () => {
    try {
      constructElementsInsertReq(req, update2, options);
    } catch (err) {
      expect(err.error.description).toEqual(
        parameterizedString(
          SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT.description,
          "name",
          "table1"
        )
      );
    }
  });

  test("constructElementsInsertReq error 2", () => {
    try {
      constructElementsInsertReq(req, update2, options2);
    } catch (err) {
      expect(err.error.description).toEqual(
        parameterizedString(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT.description)
      );
    }
  });
});

class MockIFrameFormElement {
  state = { value: "testValue" };

  isMatchEqual(index: number, value: string, rule: IValidationRule) {
    return index % 2 === 0;
  }
}

describe("Testing checkForValueMatch method", () => {
  let element: MockIFrameFormElement;

  beforeEach(() => {
    element = new MockIFrameFormElement();
  });

  it("should return true when an ELEMENT_VALUE_MATCH_RULE type is found and isMatchEqual returns false", () => {
    const validations = [
      { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
    ];
    jest.spyOn(element, "isMatchEqual").mockReturnValue(false);
    expect(checkForValueMatch(validations, element as IFrameFormElement)).toBe(
      true
    );
  });

  it("should return false when an ELEMENT_VALUE_MATCH_RULE type is found but isMatchEqual returns true", () => {
    const validations = [
      { type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE, params: {} },
    ];
    jest.spyOn(element, "isMatchEqual").mockReturnValue(true);

    expect(checkForValueMatch(validations, element as IFrameFormElement)).toBe(
      false
    );
  });
});

describe("constructUpdateRecordRequest", () => {
  test("should construct request with tokens true", () => {
    const updateData: IUpdateRequest = {
      table: "table1",
      fields: { name: "John" },
      skyflowID: "id1",
    };
    const options: IUpdateOptions = { tokens: true };
    const req = constructUpdateRecordRequest(updateData, options);
    expect(req).toEqual({
      record: { fields: { name: "John" } },
      tokenization: true,
    });
  });

  test("should construct request with tokens false", () => {
    const updateData: IUpdateRequest = {
      table: "table1",
      fields: { name: "John" },
      skyflowID: "id1",
    };
    const options: IUpdateOptions = { tokens: false };
    const req = constructUpdateRecordRequest(updateData, options);
    expect(req).toEqual({
      record: { fields: { name: "John" } },
      tokenization: false,
    });
  });

  test("should default tokens to false if not provided", () => {
    const updateData: IUpdateRequest = {
      table: "table1",
      fields: { name: "John" },
      skyflowID: "id1",
    };
    const req = constructUpdateRecordRequest(updateData, {});
    expect(req).toEqual({
      record: { fields: { name: "John" } },
      tokenization: false,
    });
  });
});

describe("constructUpdateRecordResponse", () => {
  test("should construct response with tokens", () => {
    const responseBody = {
      skyflow_id: "id1",
      tokens: {
        name: "tok123",
        age: "tok456",
      },
    };
    const result = constructUpdateRecordResponse(responseBody, true);
    expect(result).toEqual({
      updatedField: {
        skyflowID: "id1",
        name: "tok123",
        age: "tok456",
      },
    });
  });

  test("should construct response without tokens", () => {
    const responseBody = {
      skyflow_id: "id1",
      tokens: null,
    };
    const result = constructUpdateRecordResponse(responseBody, false);
    expect(result).toEqual({
      updatedField: {
        skyflowID: "id1",
      },
    });
  });

  test("should construct response with tokens false and tokens present", () => {
    const responseBody = {
      skyflow_id: "id1",
      tokens: {
        name: "tok123",
      },
    };
    const result = constructUpdateRecordResponse(responseBody, false);
    expect(result).toEqual({
      updatedField: {
        skyflowID: "id1",
      },
    });
  });
});

const nodeCrypto = require("crypto");
Object.defineProperty(window, "crypto", {
  configurable: true,
  value: {
    getRandomValues: (arr: Uint8Array) => nodeCrypto.randomFillSync(arr),
  },
});

describe("replaceCVVTokensInResponse method", () => {
  it("replaces the CVV column token (array shape) with a same-length mock that differs from the entered value, matching by tableName for inserts", () => {
    const records = [
      {
        tableName: "cards",
        skyflowId: "new-generated-id",
        tokens: {
          cvv: [{ token: "real-cvv-token", tokenGroupName: "det" }],
          card_number: [{ token: "real-card-token", tokenGroupName: "det" }],
        },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: { cards: { cvv: "123" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    const cvvToken = records[0].tokens.cvv[0].token;
    expect(cvvToken).toHaveLength(3);
    expect(/^[0-9]+$/.test(cvvToken)).toBe(true);
    expect(cvvToken).not.toEqual("123");
    expect(cvvToken).not.toEqual("real-cvv-token");
    // non-CVV column untouched
    expect(records[0].tokens.card_number[0].token).toEqual("real-card-token");
  });

  it("applies the same mock to every entry of a CVV column's token array", () => {
    const records = [
      {
        tableName: "cards",
        tokens: {
          cvv: [
            { token: "t1", tokenGroupName: "det" },
            { token: "t2", tokenGroupName: "nondet" },
          ],
        },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: { cards: { cvv: "4321" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    const [e1, e2] = records[0].tokens.cvv;
    expect(e1.token).toHaveLength(4);
    expect(e1.token).toEqual(e2.token);
    expect(e1.token).not.toEqual("4321");
  });

  it("matches update records by skyflowId and leaves hashedData untouched", () => {
    const records = [
      {
        tableName: "cards",
        skyflowId: "sky-1",
        tokens: { cvv: [{ token: "real", tokenGroupName: "det" }] },
        hashedData: { cvv: [{ data: "hash-of-cvv", hashName: "h1" }] },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: {}, update: { "sky-1": { cvv: "789" } } };

    replaceCVVTokensInResponse(records as any, cvvMap);

    expect(records[0].tokens.cvv[0].token).not.toEqual("789");
    expect(records[0].tokens.cvv[0].token).toHaveLength(3);
    // hashedData is intentionally left as-is
    expect(records[0].hashedData.cvv[0].data).toEqual("hash-of-cvv");
  });

  it("handles plain-string and bare-object token shapes", () => {
    const records = [
      {
        tableName: "t1",
        tokens: { cvv: "real-token" },
        httpCode: 200,
      },
      {
        tableName: "t2",
        tokens: { cvv: { token: "real-token", tokenGroupName: "det" } },
        httpCode: 200,
      },
    ];
    const cvvMap = {
      insert: { t1: { cvv: "111" }, t2: { cvv: "222" } },
      update: {},
    };

    replaceCVVTokensInResponse(records as any, cvvMap);

    expect(records[0].tokens.cvv).not.toEqual("real-token");
    expect((records[0].tokens.cvv as unknown as string)).toHaveLength(3);
    expect((records[1].tokens.cvv as any).token).not.toEqual("real-token");
    expect((records[1].tokens.cvv as any).token).toHaveLength(3);
  });

  it("is a no-op when there are no CVV columns or the record has an error", () => {
    const records = [
      { tableName: "cards", tokens: { name: [{ token: "n" }] }, httpCode: 200 },
      { tableName: "cards", error: "some error", httpCode: 400 },
    ];
    const cvvMap = { insert: {}, update: {} };

    const result = replaceCVVTokensInResponse(records as any, cvvMap);

    expect(result[0].tokens.name[0].token).toEqual("n");
    expect(result[1].error).toEqual("some error");
  });

  it("replaces a one-level nested CVV column (address.pincode) by matching the token entry's path, leaving the parent and sibling subfields intact", () => {
    const records = [
      {
        tableName: "nested",
        tokens: {
          address: [
            { token: "whole-address-token", tokenGroupName: "deterministic" },
            { path: "pincode", token: "real-pincode-token", tokenGroupName: "deterministic" },
            { path: "city", token: "real-city-token", tokenGroupName: "deterministic" },
          ],
          card_number: [{ token: "real-card-token", tokenGroupName: "nondeterministic" }],
        },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: { nested: { "address.pincode": "500055" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    const addr = records[0].tokens.address as any[];
    const pincodeEntry = addr.find((e) => e.path === "pincode");
    expect(pincodeEntry.token).toHaveLength(6);
    expect(/^[0-9]+$/.test(pincodeEntry.token)).toBe(true);
    expect(pincodeEntry.token).not.toEqual("500055");
    expect(pincodeEntry.token).not.toEqual("real-pincode-token");
    // parent and sibling untouched
    expect(addr.find((e) => e.path === undefined).token).toEqual("whole-address-token");
    expect(addr.find((e) => e.path === "city").token).toEqual("real-city-token");
    expect((records[0].tokens.card_number as any[])[0].token).toEqual("real-card-token");
  });

  it("replaces a two-level nested CVV column (address.city.street) by exact path match, isolating parent (city) and sibling (city.ward)", () => {
    const records = [
      {
        tableName: "nested",
        tokens: {
          address: [
            { token: "whole-address-token", tokenGroupName: "deterministic" },
            { path: "pincode", token: "real-pincode-token", tokenGroupName: "deterministic" },
            { path: "city", token: "real-city-token", tokenGroupName: "deterministic" },
            { path: "city.street", token: "real-city-street-token", tokenGroupName: "deterministic" },
            { path: "city.ward", token: "real-city-ward-token", tokenGroupName: "deterministic" },
          ],
        },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: { nested: { "address.city.street": "321" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    const addr = records[0].tokens.address as any[];
    const streetEntry = addr.find((e) => e.path === "city.street");
    expect(streetEntry.token).toHaveLength(3);
    expect(streetEntry.token).not.toEqual("321");
    expect(streetEntry.token).not.toEqual("real-city-street-token");
    // exact-equality isolation: parent city and sibling city.ward untouched
    expect(addr.find((e) => e.path === "city").token).toEqual("real-city-token");
    expect(addr.find((e) => e.path === "city.ward").token).toEqual("real-city-ward-token");
    expect(addr.find((e) => e.path === "pincode").token).toEqual("real-pincode-token");
    expect(addr.find((e) => e.path === undefined).token).toEqual("whole-address-token");
  });

  it("replaces the token with an empty string (not a mock) when the entered CVV is empty", () => {
    const records = [
      {
        tableName: "cards",
        tokens: {
          cvv: [{ token: "real-cvv-token", tokenGroupName: "det" }],
          card_number: [{ token: "real-card-token", tokenGroupName: "det" }],
        },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: { cards: { cvv: "" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    // empty entered CVV -> token blanked, never runs the (length 0) generator
    expect(records[0].tokens.cvv[0].token).toEqual("");
    // sibling column untouched
    expect(records[0].tokens.card_number[0].token).toEqual("real-card-token");
  });

  it("replaces a nested CVV token with an empty string when the entered value is empty", () => {
    const records = [
      {
        tableName: "nested",
        tokens: {
          address: [
            { token: "whole-address-token", tokenGroupName: "det" },
            { path: "pincode", token: "real-pincode-token", tokenGroupName: "det" },
          ],
        },
        httpCode: 200,
      },
    ];
    const cvvMap = { insert: { nested: { "address.pincode": "" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    const addr = records[0].tokens.address as any[];
    expect(addr.find((e) => e.path === "pincode").token).toEqual("");
    expect(addr.find((e) => e.path === undefined).token).toEqual("whole-address-token");
  });

  it("only replaces path-less entries for a flat column, never entries that carry a path", () => {
    const records = [
      {
        tableName: "nested",
        tokens: {
          address: [
            { token: "flat-token", tokenGroupName: "deterministic" },
            { path: "pincode", token: "real-pincode-token", tokenGroupName: "deterministic" },
          ],
        },
        httpCode: 200,
      },
    ];
    // CVV mapped to the whole (flat) top-level column "address"
    const cvvMap = { insert: { nested: { address: "999" } }, update: {} };

    replaceCVVTokensInResponse(records as any, cvvMap);

    const addr = records[0].tokens.address as any[];
    expect(addr.find((e) => e.path === undefined).token).not.toEqual("flat-token");
    expect(addr.find((e) => e.path === undefined).token).toHaveLength(3);
    // path-carrying entry stays intact
    expect(addr.find((e) => e.path === "pincode").token).toEqual("real-pincode-token");
  });
});
