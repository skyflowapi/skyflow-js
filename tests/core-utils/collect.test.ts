import {
  getUpsertColumn,
  constructElementsInsertReq,
  checkForValueMatch,
  constructUpdateRecordResponse,
  constructUpdateRecordRequest,
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
        table: "table1",
        fields: {
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
        table: "table1",
        fields: {
          column: "122",
          skyflowID: "table1",
        },
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
