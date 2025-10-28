/*
Copyright (c) 2025 Skyflow, Inc.
*/
import bus from "framebus";
import Skyflow, { ISkyflow } from "../src/skyflow";
import * as iframerUtils from "../src/iframe-libs/iframer";
import { ELEMENT_EVENTS_TO_IFRAME } from "../src/core/constants";
import {
  DeleteResponse,
  DeleteResponseRecord,
  DetokenizeResponse,
  GetByIdResponse,
  GetByIdResponseRecord,
  GetResponse,
  GetResponseRecord,
  IDeleteOptions,
  IDeleteRecord,
  IDeleteRecordInput,
  IDetokenizeInput,
  IGetByIdInput,
  IGetInput,
  IGetOptions,
  IGetRecord,
  IInsertOptions,
  IInsertRecord,
  IInsertRecordInput,
  InsertResponse,
  InsertResponseRecords,
  IRevealRecord,
  ISkyflowIdRecord,
  IUpdateOptions,
  IUpdateRequest,
  RedactionType,
  UpdateResponse,
} from "../src/utils/common";

jest.mock("../src/utils/jwt-utils", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));
jest.mock("../src/libs/uuid", () => ({
  __esModule: true,
  default: jest.fn(() => "b5cbf425-6578-4d40-be88-82a748c36c60"),
}));
jest
  .spyOn(iframerUtils, "getIframeSrc")
  .mockImplementation(() => "https://google.com");

describe("Skyflow initialization", () => {
  test("should initialize the skyflow object  ", () => {
    const config: ISkyflow = {
      vaultID: "vault_id",
      vaultURL: "https://vault.test.com",
      getBearerToken: jest.fn(),
    };
    const skyflow = Skyflow.init(config);
    expect(skyflow.constructor === Skyflow).toBe(true);
  });

  test("should initialize the skyflow object with custom url  ", () => {
    const config: ISkyflow = {
      vaultID: "vault_id",
      vaultURL: "https://vault.test.com",
      getBearerToken: jest.fn(),
      options: {
        customElementsURL: "https://js.skyflow.com/v1/elements/index.html",
      },
    };
    const skyflow = Skyflow.init(config);
    expect(skyflow.constructor === Skyflow).toBe(true);
  });
});

// insert records, options and responses
const insertRecord: IInsertRecord = {
  table: "pii_fields",
  fields: {
    first_name: "joey",
    primary_card: {
      card_number: "411",
      cvv: "123",
    },
  },
};
const records: IInsertRecordInput = {
  records: [insertRecord],
};
const options: IInsertOptions = {
  tokens: true,
};
const insertResponseRecord: InsertResponseRecords = {
  table: "pii_fields",
  fields: {
    first_name: "token1",
    primary_card: {
      card_number: "token2",
      cvv: "token3",
    },
  },
};
const insertResponse: InsertResponse = {
  records: [insertResponseRecord],
};

const on = jest.fn();

describe("skyflow insert", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });

    const config: ISkyflow = {
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    };
    skyflow = Skyflow.init(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("insert success", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<InsertResponse> = skyflow.insert(records);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(insertResponse);

      let data: InsertResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("insert error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<InsertResponse> = skyflow.insert(records);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "resource doesn't exist", code: 404 } });

      let error: InsertResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });
});

const updateRecord: IUpdateRequest = {
  table: "pii_fields",
  fields: {
    first_name: "joey",
    primary_card: {
      card_number: "411",
      cvv: "123",
    },
  },
  skyflowID: "test-skyflow-id",
};

const updateOptions: IUpdateOptions = {
  tokens: true,
};

const updateResponse: UpdateResponse = {
  updatedField: {
    skyflowID: "test-skyflow-id",
    card_number: "token2",
    cvv: "token3",
  },
};


describe("skyflow update", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });

    const config: ISkyflow = {
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    };
    skyflow = Skyflow.init(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("update success", (done) => {
    const frameReadyEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReadyEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);

    try {
      const res: Promise<UpdateResponse> = skyflow.update(updateRecord, updateOptions);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(updateResponse);

      let data: UpdateResponse;
      res.then((result) => (data = result));

      setTimeout(() => {
        expect(data.updatedField.skyflowID).toBe("test-skyflow-id");
        expect(data.updatedField.card_number).toBe("token2");
        expect(data.updatedField.cvv).toBe("token3");
        expect((data as any).error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("update error", (done) => {
    const frameReadyEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReadyEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);

    try {
      const res: Promise<UpdateResponse> = skyflow.update(updateRecord, updateOptions);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "update failed", code: 400 } });

      let error: UpdateResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("update invalid input - missing table", (done) => {
    const invalidRecord = { ...updateRecord } as any;
    delete invalidRecord.table;
    const frameReadyEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReadyEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);

    try {
      const res: Promise<UpdateResponse> = skyflow.update(invalidRecord, updateOptions);
      res.catch((err) => {
        expect(err).toBeDefined();
        done();
      });
    } catch (err) {}
  });

  test("update invalid input - missing fields", (done) => {
    const invalidRecord = { ...updateRecord } as any;
    delete invalidRecord.fields;
    const frameReadyEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReadyEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);

    try {
      const res: Promise<UpdateResponse> = skyflow.update(invalidRecord, updateOptions);
      res.catch((err) => {
        expect(err).toBeDefined();
        done();
      });
    } catch (err) {}
  });

  test("update invalid input - missing skyflowID", (done) => {
    const invalidRecord = { ...updateRecord } as any;
    delete invalidRecord.skyflowID;
    const frameReadyEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReadyEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);

    try {
      const res: Promise<UpdateResponse> = skyflow.update(invalidRecord, updateOptions);
      res.catch((err) => {
        expect(err).toBeDefined();
        done();
      });
    } catch (err) {}
  });
});

// detokenize records, options and responses
const detokenizeInput: IDetokenizeInput = {
  records: [
    {
      token: "token1",
    } as IRevealRecord,
  ],
};
const detokenizeRes: DetokenizeResponse = {
  records: [
    {
      token: "token1",
      cvv: "123",
    },
  ],
};

describe("skyflow detokenize", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  const emit = jest.fn();
  const on = jest.fn();
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      emit,
    });

    skyflow = Skyflow.init({
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    } as ISkyflow);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("detokenize success", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<DetokenizeResponse> =
        skyflow.detokenize(detokenizeInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(detokenizeRes);

      let data: DetokenizeResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("detokenize error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<DetokenizeResponse> =
        skyflow.detokenize(detokenizeInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "token doesn't exist", code: 404 } });

      let error: DetokenizeResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });
});

// getById records, options and responses
const getByIdRecord: ISkyflowIdRecord = {
  ids: ["skyflowId1"],
  table: "pii_fields",
  redaction: RedactionType.PLAIN_TEXT,
};
const getByIdInput: IGetByIdInput = {
  records: [getByIdRecord],
};
const getByIdRecordWithoutRedaction: IGetRecord = {
  ids: ["skyflowId1"],
  table: "pii_fields",
};
const getByIdInputWithoutRedaction = {
  records: [getByIdRecordWithoutRedaction],
};
const getByIdResRecord: GetByIdResponseRecord = {
  fields: {
    cvv: "123",
  },
  table: "pii_fields",
};
const getByIdRes: GetByIdResponse = {
  records: [getByIdResRecord],
};

// get records, options and responses
const getRecord: IGetRecord = {
  columnName: "cvv",
  columnValues: ["123"],
  table: "pii_fields",
  redaction: Skyflow.RedactionType.PLAIN_TEXT,
};
const getInput: IGetInput = {
  records: [getRecord],
};
const getOptionsTrue: IGetOptions = { tokens: true };
const getOptionsFalse: IGetOptions = { tokens: false };
const getResRecord: GetResponseRecord = {
  fields: {
    name: "test",
    cvv: "123",
  },
  table: "pii_fields",
};
const getRes: GetResponse = {
  records: [getResRecord],
};

describe("skyflow get", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });

    skyflow = Skyflow.init({
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    } as ISkyflow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("get success", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(getByIdInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data: GetResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("get error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(getByIdInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "id doesn't exist", code: 404 } });

      let error: GetResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });
});

describe("skyflow getById", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });

    skyflow = Skyflow.init({
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    } as ISkyflow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getById success", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetByIdResponse> = skyflow.getById(getByIdInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data: GetByIdResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("getById error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetByIdResponse> = skyflow.getById(getByIdInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "id doesn't exist", code: 404 } });

      let error: GetByIdResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });
});

describe("skyflow get", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });

    skyflow = Skyflow.init({
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    } as ISkyflow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("get success", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(getByIdInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data: GetResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("get error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(getByIdInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "id doesn't exist", code: 404 } });

      let error: GetResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("get success", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(getInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(getRes);

      let data: GetResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {}
  });

  test("get error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(getInput);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "id doesn't exist", code: 404 } });

      let error: GetResponse;
      res.catch((err) => (error = err));

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {}
  });
});

describe("skyflow get with options", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });

    skyflow = Skyflow.init({
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    } as ISkyflow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("get method success when tokens flag is true", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(
        getByIdInputWithoutRedaction,
        getOptionsTrue
      );

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data: GetResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
      done(err);
    }
  });

  test("get method success when tokens flag is false", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<GetResponse> = skyflow.get(
        getByIdInput,
        getOptionsFalse
      );

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data: GetResponse;
      res.then((res) => (data = res));

      setTimeout(() => {
        expect(data.records!.length).toBe(1);
        expect(data.errors).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
      done(err);
    }
  });
});

// delete records, options and responses
const deleteRecord: IDeleteRecord = {
  table: "pii_fields",
  id: "29ebda8d-5272-4063-af58-15cc674e332b",
};
const deleteRecords: IDeleteRecordInput = {
  records: [deleteRecord],
};
const deleteOptions: IDeleteOptions = {};
const deleteResponseRecord: DeleteResponseRecord = {
  skyflow_id: "29ebda8d-5272-4063-af58-15cc674e332b",
  deleted: true,
};
const deleteResponse: DeleteResponse = {
  records: [deleteResponseRecord],
};

describe("Skyflow delete tests", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let skyflow: Skyflow;
  const on = jest.fn();
  const emit = jest.fn();
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      emit,
    });

    skyflow = Skyflow.init({
      vaultID: "vault123",
      vaultURL: "https://vaulturl.com",
      getBearerToken: jest.fn(),
    } as ISkyflow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("delete success", (done) => {
    const frameReadyEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReadyEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<DeleteResponse> = skyflow.delete(deleteRecords);
      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(deleteResponse);

      let data: DeleteResponse;
      res.then((res: DeleteResponse) => {
        try {
          data = res;
          expect(data.records!.length).toBe(1);
          expect(data.records![0].deleted).toBeTruthy();
          expect(data.errors).toBeUndefined();
          done();
        } catch (err) {
          done(err);
        }
      });
    } catch (err) {
      done(err);
    }
  });

  test("delete error", (done) => {
    const frameReayEvent = on.mock.calls.filter((data) =>
      data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
    );
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res: Promise<DeleteResponse> = skyflow.delete(deleteRecords);

      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "No Records Found", code: 404 } });

      let error: DeleteResponse;
      res.catch((err: DeleteResponse) => {
        try {
          error = err;
          expect(error).toBeDefined();
          done();
        } catch (err) {
          done(err);
        }
      });
    } catch (err) {
      done(err);
    }
  });

  test("delete success else", (done) => {
    try {
      const res: Promise<DeleteResponse> = skyflow.delete(deleteRecords);

      const frameReadyEvent = on.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
      );
      const frameReadyCb = frameReadyEvent[1][1];
      frameReadyCb();
      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb(deleteResponse);

      let data: DeleteResponse;
      res.then((res) => {
        try {
          data = res;
          expect(data.records!.length).toBe(1);
          expect(data.records![0].deleted).toBeTruthy();
          expect(data.errors).toBeUndefined();
          done();
        } catch (err) {
          done(err);
        }
      });
    } catch (err) {
      done(err);
    }
  });

  test("delete error else", (done) => {
    try {
      const res: Promise<DeleteResponse> = skyflow.delete(deleteRecords);

      const frameReayEvent = on.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY)
      );
      const frameReadyCb = frameReayEvent[1][1];
      frameReadyCb();
      const emitEvent = emitSpy.mock.calls.filter((data) =>
        data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST)
      );
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "No Records Found", code: 404 } });

      res.catch((err: DeleteResponse) => {
        try {
          expect(err).toBeDefined();
          done();
        } catch (err) {
          done(err);
        }
      });
    } catch (err) {
      done(err);
    }
  });
});
