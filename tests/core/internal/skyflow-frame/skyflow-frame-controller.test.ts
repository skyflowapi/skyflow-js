/*
Copyright (c) 2025 Skyflow, Inc.
*/
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  PUREJS_TYPES,
  REVEAL_TYPES,
} from "../../../../src/core/constants";
import clientModule from "../../../../src/client";
import * as busEvents from "../../../../src/utils/bus-events";
import {
  LogLevel,
  Env,
  RedactionType,
  IRevealRecord,
  IGetRecord,
  IGetOptions,
  IDeleteRecordInput,
} from "../../../../src/utils/common";
import SkyflowFrameController from "../../../../src/core/internal/skyflow-frame/skyflow-frame-controller";
import { InsertOptions } from "../../../../src/index-node";
import { ISkyflow } from "../../../../src/skyflow";
import Client from "../../../../src/client";

jest.mock("../../../../src/utils/bus-events", () => ({
  ...jest.requireActual("../../../../src/utils/bus-events"),
  getAccessToken: jest.fn(() => Promise.resolve("access token")),
}));

const on = jest.fn();
const emit = jest.fn();

jest.mock("../../../../src/libs/uuid", () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const mockUuid = "1244";
const skyflowConfig: ISkyflow = {
  vaultID: "e20afc3ae1b54f0199f24130e51e0c11",
  vaultURL: "https://testurl.com",
  getBearerToken: jest.fn(),
};

const clientData = {
  client: {
    config: { ...skyflowConfig },
    metadata: {
      uuid: mockUuid,
    },
  },
  context: { logLevel: LogLevel.ERROR, env: Env.PROD },
};

const records = {
  records: [
    {
      table: "pii_fields",
      fields: {
        first_name: "Joseph",
        primary_card: {
          card_number: "4111111111111111",
          cvv: "123",
        },
      },
    },
  ],
};

const options: InsertOptions = {
  tokens: true,
  upsert: [
    {
      table: "",
      column: "",
    },
  ],
};

const pushEventResponse = {
  data: 1,
};

const insertResponse = {
  vaultID: "vault123",
  responses: [
    {
      table: "table1",
      records: [
        {
          skyflow_id: "testId",
        },
      ],
    },
    {
      table: "table1",
      fields: {
        "*": "testId",
        first_name: "token1",
        primary_card: {
          card_number: "token2",
          cvv: "token3",
        },
      },
    },
  ],
};

const insertResponseWithoutTokens = {
  vaultID: "vault123",
  responses: [
    {
      records: [
        {
          skyflow_id: "testId",
        },
      ],
    },
  ],
};

const errorResponse = {
  error: {
    http_code: 403,
    message: "RBAC: access denied",
  },
};

describe("push event", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;

  beforeEach(() => {
    window.name = "controller:frameId:clientDomain:true";
    window.CoralogixRum = {
      isInited: true,
      init: jest.fn(),
      info: jest.fn(),
    };
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    onSpy = jest.spyOn(bus, "on");
    targetSpy.mockReturnValue({
      on,
    });
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.resolve("access token"));
  });

  test("before send function in init", (done) => {
    const event = {
      log_context: {
        message: "SDK IFRAME EVENT",
      },
    };
    window.CoralogixRum = {
      isInited: false,
      init: ({ beforeSend }) => {
        beforeSend(event);
      },
    };
    expect(event).toBeTruthy();
    const clientReq = jest.fn(() => Promise.resolve(pushEventResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          config: {
            ...clientData.client.config,
            options: {
              ...clientData.client?.config?.options,
              trackingKey: "aaaaabbbbbcccccdddddeeeeefffffggggg",
            },
          },
          toJSON: toJson,
          request: clientReq,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = onSpy.mock.calls[0][1];
    const data = {
      event: {
        element_id: "element123",
        container_id: "container456",
        vault_url: "http://example.com",
        status: "Error",
        events: ["MOUNTED"],
      },
    };
    onCb(data);
    setTimeout(() => {
      expect(onCb).toBeTruthy();
      done();
    }, 1000);
  });

  test("init coralogix", (done) => {
    const event = {
      log_context: {
        message: null,
      },
    };
    window.CoralogixRum = {
      isInited: false,
      init: ({ beforeSend }) => {
        beforeSend(event);
      },
    };

    const clientReq = jest.fn(() => Promise.resolve(pushEventResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          config: {
            ...clientData.client.config,
            options: {
              ...clientData.client?.config?.options,
              trackingKey: "aaaaabbbbbcccccdddddeeeeefffffggggg",
            },
          },
          toJSON: toJson,
          request: clientReq,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = onSpy.mock.calls[0][1];
    const data = {
      event: {
        element_id: "element123",
        container_id: "container456",
        vault_url: "http://example.com",
        status: "Error",
        events: ["MOUNTED"],
      },
    };
    onCb(data);
    setTimeout(() => {
      expect(onCb).toBeTruthy();
      done();
    }, 1000);
  });

  test("push event with elementid", (done) => {
    const clientReq = jest.fn(() => Promise.resolve(pushEventResponse));
    jest
      .spyOn(clientModule, "fromJSON")
      .mockImplementation(
        () =>
          ({ ...clientData.client, request: clientReq } as unknown as Client)
      );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = onSpy.mock.calls[0][1];
    const data = {
      event: {
        element_id: "element123",
        container_id: "container456",
        vault_url: "http://example.com",
        status: "Error",
        events: ["MOUNTED"],
      },
    };
    onCb(data);
    setTimeout(() => {
      expect(onCb).toBeTruthy();
      done();
    }, 1000);
  });

  test("push event with error", (done) => {
    window.CoralogixRum = {
      isInited: false,
      init: jest.fn(),
      info: jest.fn(),
    };
    const clientReq = jest.fn(() => Promise.resolve(pushEventResponse));
    jest
      .spyOn(clientModule, "fromJSON")
      .mockImplementation(
        () =>
          ({ ...clientData.client, request: clientReq } as unknown as Client)
      );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = onSpy.mock.calls[0][1];
    const data = {};
    onCb(data);
    setTimeout(() => {
      expect(onCb).toBeTruthy();
      done();
    }, 1000);
  });

  test("push event throw error resopnse", (done) => {
    window.CoralogixRum = {
      isInited: false,
      init: jest.fn(),
    };
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest
      .spyOn(clientModule, "fromJSON")
      .mockImplementation(
        () =>
          ({ ...clientData.client, request: clientReq } as unknown as Client)
      );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = onSpy.mock.calls[0][1];
    const data = {
      event: {
        element_id: "element123",
        container_id: "container456",
        vault_url: "http://example.com",
        status: "Error",
        events: ["MOUNTED"],
      },
    };
    onCb(data);
    setTimeout(() => {
      expect(onCb).toBeTruthy();
      done();
    }, 1000);
  });
});

describe("Inserting records into the vault", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("insert records with tokens as true", (done) => {
    const clientReq = jest.fn(() => Promise.resolve(insertResponse));
    jest
      .spyOn(clientModule, "fromJSON")
      .mockImplementation(
        () =>
          ({ ...clientData.client, request: clientReq } as unknown as Client)
      );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      expect(cb2.mock.calls[0][0].records[0].fields).toBeDefined();
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      done();
    }, 1000);
  });

  test("insert records with tokens as false", (done) => {
    const clientReq = jest.fn(() =>
      Promise.resolve(insertResponseWithoutTokens)
    );
    jest
      .spyOn(clientModule, "fromJSON")
      .mockImplementation(
        () =>
          ({ ...clientData.client, request: clientReq } as unknown as Client)
      );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false, upsert: [{ table: "", column: "  " }] },
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      expect(cb2.mock.calls[0][0].records[0].fields).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      done();
    }, 1000);
  });

  test("insert records with error", (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest
      .spyOn(clientModule, "fromJSON")
      .mockImplementation(
        () =>
          ({ ...clientData.client, request: clientReq } as unknown as Client)
      );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const detokenizeRecords: IRevealRecord[] = [{ token: "token1" }];

const detokenizeRecordWithRedaction: IRevealRecord[] = [
  {
    token: "token1",
    redaction: RedactionType.MASKED,
  },
];

const detokenizeResponse = {
  records: [
    {
      token_id: "token1",
      fields: {
        cvv: "123",
      },
    },
  ],
};

const detokenizeResponseWithRedaction = {
  records: [
    {
      token_id: "token1",
      value: "123",
    },
  ],
};

const detokenizeErrorResponse = {
  error: {
    grpc_code: 5,
    http_code: 404,
    message: "Token not found for token1",
    http_status: "Not Found",
    details: [],
  },
};

const toJson = jest.fn(() => ({
  config: {},
  metaData: {
    uuid: "",
    sdkVersion: "skyflow-react-js@1.2.3",
  },
}));

describe("Retrieving data using skyflowId", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("getById success", (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test("getById error", (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

describe("Retrieving data using skyflow tokens", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("detokenize success", (done) => {
    const clientReq = jest.fn(() => Promise.resolve(detokenizeResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test("detokenize error", (done) => {
    const clientReq = jest.fn(() => Promise.reject(detokenizeErrorResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const getByIdReq: IGetRecord[] = [
  {
    ids: ["id1"],
    redaction: RedactionType.PLAIN_TEXT,
    table: "table1",
  },
];

const getByIdReqWithoutRedaction: IGetRecord[] = [
  {
    ids: ["id1"],
    table: "table1",
  },
];

const getOptionsTrue: IGetOptions = { tokens: true };
const getOptionsFalse: IGetOptions = { tokens: false };

const getByColumnReq: IGetRecord[] = [
  {
    columnValues: ["id1", "id2", "id3"],
    columnName: "column1",
    redaction: RedactionType.PLAIN_TEXT,
    table: "table1",
  },
];

const getByIdRes = {
  records: [
    {
      fields: {
        skyflow_id: "id1",
        cvv: "123",
      },
    },
  ],
};

describe("Retrieving data using skyflow tokens", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("detokenize success", (done) => {
    const clientReq = jest.fn(() =>
      Promise.resolve(detokenizeResponseWithRedaction)
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecordWithRedaction,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test("detokenize error", (done) => {
    const clientReq = jest.fn(() => Promise.reject(detokenizeErrorResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecordWithRedaction,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

describe("Retrieving data using get", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("get success", (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test("get success second case", (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByColumnReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test("get success case should have single column_name for multiple column values ", (done) => {
    let reqArg;
    const clientReq = jest.fn((arg) => {
      reqArg = arg;
      return Promise.resolve(getByIdRes);
    });
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByColumnReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      try {
        expect(cb2.mock.calls[0][0].records.length).toBe(1);
        expect(reqArg.url.match(/column_name=column1/gi)?.length).toBe(1);
        done();
      } catch (err) {
        done(err);
      }
    }, 1000);
  });

  test("get method should send request url with tokenization true and without redaction when tokens flag is true", (done) => {
    let reqArg;
    const clientReq = jest.fn((arg) => {
      reqArg = arg;
      return Promise.resolve(getByIdRes);
    });
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReqWithoutRedaction,
      options: getOptionsTrue,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    try {
      setTimeout(() => {
        expect(cb2.mock.calls[0][0].records.length).toBe(1);
        expect(reqArg.url.includes("tokenization=true")).toBe(true);
        expect(reqArg.url.includes("redaction=PLAIN_TEXT")).toBe(false);
        done();
      }, 1000);
    } catch (err) {
      done(err);
    }
  });

  test("get method should send request url with tokenization false and redaction when tokens flag is false", (done) => {
    let reqArg;
    const clientReq = jest.fn((arg) => {
      reqArg = arg;
      return Promise.resolve(getByIdRes);
    });
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
      options: getOptionsFalse,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    try {
      setTimeout(() => {
        expect(cb2.mock.calls[0][0].records.length).toBe(1);
        expect(reqArg.url.includes("tokenization=false")).toBe(true);
        expect(reqArg.url.includes("redaction=PLAIN_TEXT")).toBe(true);
        done();
      }, 1000);
    } catch (err) {
      done(err);
    }
  });

  test("get error", (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

describe("Failed to fetch accessToken get", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("accessToken error", (done) => {
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.reject({ error: "error" }));
    SkyflowFrameController.init(mockUuid);
    const onCb = on.mock.calls[0][1];

    const insertData = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false, upsert: [{ table: "", column: "  " }] },
    };
    const insertCb = jest.fn();
    onCb(insertData, insertCb);

    const detokenizeData = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const detokenizeCb = jest.fn();
    onCb(detokenizeData, detokenizeCb);

    const getByIdData = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const getByIdCb = jest.fn();
    onCb(getByIdData, getByIdCb);

    setTimeout(() => {
      expect(insertCb.mock.calls[0][0].error).toBeDefined();
      expect(detokenizeCb.mock.calls[0][0].error).toBeDefined();
      expect(getByIdCb.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

describe("Failed to fetch accessToken Getbyid", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
    });
  });

  test("accessToken error", (done) => {
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.reject({ error: "error" }));
    SkyflowFrameController.init(mockUuid);
    const onCb = on.mock.calls[0][1];

    const insertData = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false, upsert: [{ table: "", column: "  " }] },
    };
    const insertCb = jest.fn();
    onCb(insertData, insertCb);

    const detokenizeData = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const detokenizeCb = jest.fn();
    onCb(detokenizeData, detokenizeCb);

    const getByIdData = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const getByIdCb = jest.fn();
    onCb(getByIdData, getByIdCb);

    setTimeout(() => {
      expect(insertCb.mock.calls[0][0].error).toBeDefined();
      expect(detokenizeCb.mock.calls[0][0].error).toBeDefined();
      expect(getByIdCb.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const deleteRecords: IDeleteRecordInput = {
  records: [
    {
      table: "pii_fields",
      id: "29ebda8d-5272-4063-af58-15cc674e332b",
    },
    {
      table: "pii_fields",
      id: "29ebda8d-5272-4063-af58-15cc674e332b",
    },
  ],
};

const deleteOptions = {};

const deleteResponse = {
  skyflow_id: "29ebda8d-5272-4063-af58-15cc674e332b",
  deleted: true,
};

const deleteErrorResponse = {
  error: {
    grpc_code: 5,
    http_code: 404,
    message: "No Records Found",
    http_status: "Not Found",
    details: [],
  },
};

describe("Deleting records from the vault", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      emit,
    });
  });

  test("delete records success", (done) => {
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.resolve({ token: "token123" }));
    const clientReq = jest.fn(() => Promise.resolve(deleteResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DELETE,
      records: deleteRecords,
      options: deleteOptions,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      try {
        expect(cb2.mock.calls[0][0].records.length).toBe(2);
        expect(cb2.mock.calls[0][0].records[0].deleted).toBeTruthy();
        expect(cb2.mock.calls[0][0].records[1].deleted).toBeTruthy();
        expect(cb2.mock.calls[0][0].error).toBeUndefined();
        done();
      } catch (err) {
        done(err);
      }
    }, 1000);
  });

  test("delete records with error", (done) => {
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.resolve({ token: "token123" }));
    const clientReq = jest.fn(() => Promise.reject(deleteErrorResponse));
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DELETE,
      records: deleteRecords,
      options: deleteOptions,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      try {
        expect(cb2.mock.calls[0][0].error).toBeDefined();
        done();
      } catch (err) {
        done(err);
      }
    }, 1000);
  });

  test("accessToken error while deleting records", (done) => {
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.reject({ error: "error" }));

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + mockUuid
    );
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const deleteData = {
      type: PUREJS_TYPES.DELETE,
      records: deleteRecords,
      options: deleteOptions,
    };
    const deleteCb = jest.fn();
    onCb(deleteData, deleteCb);

    setTimeout(() => {
      try {
        expect(deleteCb.mock.calls[0][0].error).toBeDefined();
        done();
      } catch (err) {
        done(err);
      }
    }, 1000);
  });
});

describe("test render file request", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      emit,
    });
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.reject({ error: "error" }));
  });

  test("render files error case", () => {
    const clientReq = jest.fn(() =>
      Promise.reject({
        errors: [
          {
            skyflowID: "1815-6223-1073-1425",
            error: { code: 404, description: "id not found" },
          },
        ],
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );
    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = {
      records: [
        {
          skyflowID: "1815-6223-1073-1425",
          column: "file",
          table: "table1",
        },
      ],
    };
    const data1 = {
      type: REVEAL_TYPES.RENDER_FILE,
      records: data,
      containerId: "123",
      iframeName: "123",
    };
    const emitterCb = jest.fn();

    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
    setTimeout(() => {
      expect(emitterCb.mock.calls[0][0].error).toBeDefined();
      expect(emitterCb.mock.calls[0][0].error).toEqual({
        code: 404,
        description: "id not found",
      });
    }, 10000);
  });

  test("render files succes case", () => {
    const clientReq = jest.fn(() =>
      Promise.resolve({
        fields: { skyflow_id: "1815-6223-1073-1425", file: "https://demo.com" },
        tokens: null,
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = {
      skyflowID: "1815-6223-1073-1425",
      column: "file",
      table: "table1",
    };
    const data1 = {
      type: REVEAL_TYPES.RENDER_FILE,
      records: data,
      containerId: "123",
      iframeName: "123",
    };
    const emitterCb = jest.fn();
    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
  });
});

describe("test reveal request", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      emit,
    });
    jest
      .spyOn(busEvents, "getAccessToken")
      .mockImplementation(() => Promise.reject({ error: "error" }));
  });

  test("reveal data error case", () => {
    const clientReq = jest.fn(() =>
      Promise.reject({
        errors: [
          {
            token: "1815-6223-1073-1425",
            error: { code: 404, description: "token not found" },
          },
        ],
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );
    SkyflowFrameController.init(mockUuid);

    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = {
      records: [
        {
          token: "1815-6223-1073-1425",
        },
      ],
    };
    const data1 = {
      type: REVEAL_TYPES.REVEAL,
      records: data,
      containerId: "123",
      iframeName: "123",
    };
    const emitterCb = jest.fn();

    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
    setTimeout(() => {
      expect(emitterCb.mock.calls[0][0].error).toBeDefined();
      expect(emitterCb.mock.calls[0][0].error).toEqual({
        code: 404,
        description: "token not found",
      });
    }, 10000);
  });

  test("reveal succes case", () => {
    const clientReq = jest.fn(() =>
      Promise.resolve({
        records: [
          { token: "7402-2242-2342-232", value: "231", valueType: "STRING" },
        ],
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = [
      {
        token: "1815-6223-1073-1425",
      },
    ];
    const data1 = {
      type: REVEAL_TYPES.REVEAL,
      records: data,
      containerId: "123",
      iframeName: "123",
    };
    const emitterCb = jest.fn();
    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
  });

  test("reveal data with redaction type", () => {
    const clientReq = jest.fn(() =>
      Promise.resolve({
        records: [
          { token: "7402-2242-2342-232", value: "231", valueType: "STRING" },
        ],
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = [
      {
        token: "1815-6223-1073-1425",
        redaction: RedactionType.MASKED,
      },
    ];
    const data1 = {
      type: REVEAL_TYPES.REVEAL,
      records: data,
      containerId: "123",
      iframeName: "123",
    };
    const emitterCb = jest.fn();
    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
  });

  test("reveal data with redaction type and without token", () => {
    const clientReq = jest.fn(() =>
      Promise.resolve({
        records: [
          { token: "7402-2242-2342-232", value: "231", valueType: "STRING" },
        ],
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = [
      {
        token: "1815-6223-1073-1425",
        redaction: RedactionType.MASKED,
      },
    ];
    const data1 = {
      type: REVEAL_TYPES.REVEAL,
      records: data,
      containerId: "123",
      iframeName: "123",
      options: { tokens: false },
    };
    const emitterCb = jest.fn();
    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
  });

  test("reveal data with redaction type and without token and without tokenization", () => {
    const clientReq = jest.fn(() =>
      Promise.resolve({
        records: [
          { token: "7402-2242-2342-232", value: "231", valueType: "STRING" },
        ],
      })
    );
    jest.spyOn(clientModule, "fromJSON").mockImplementation(
      () =>
        ({
          ...clientData.client,
          request: clientReq,
          toJSON: toJson,
        } as unknown as Client)
    );

    SkyflowFrameController.init(mockUuid);
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitCb = emitSpy.mock.calls[1][2];
    expect(emitEventName).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    );
    emitCb(clientData);
    const revelRequestEventName =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + mockUuid;
    const data = [
      {
        token: "1815-6223-1073-1425",
        redaction: RedactionType.MASKED,
      },
    ];
    const data1 = {
      type: REVEAL_TYPES.REVEAL,
      records: data,
      containerId: "123",
      iframeName: "123",
      options: { tokens: false },
    };
    const emitterCb = jest.fn();
    const onCbName = on.mock.calls[2][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb = on.mock.calls[2][1];
    onCb(data1, emitterCb);
  });
});
