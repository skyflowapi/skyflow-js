/*
Copyright (c) 2025 Skyflow, Inc.
*/
import { ElementType } from "../../../../src/core/constants";
import CollectContainer from "../../../../src/core/external/collect/collect-container";
import CollectElement from "../../../../src/core/external/collect/collect-element";
import * as iframerUtils from "../../../../src/iframe-libs/iframer";
import {
  LogLevel,
  Env,
  CollectElementInput,
  InputStyles,
  CollectResponse,
  ICollectOptions,
  UploadFilesResponse,
  CollectElementOptions,
} from "../../../../src/utils/common";

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const bus = require("framebus");

jest
  .spyOn(iframerUtils, "getIframeSrc")
  .mockImplementation(() => "https://google.com");

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());

const mockUuid = "1234";
jest.mock("../../../../src/libs/uuid", () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const metaData = {
  uuid: "123",
  skyflowContainer: {
    isControllerFrameReady: true,
  },
  config: {
    vaultID: "vault123",
    vaultURL: "https://sb.vault.dev",
    getBearerToken,
  },
  metaData: {
    clientDomain: "http://abc.com",
  },
  clientJSON: {
    config: {
      vaultID: "vault123",
      vaultURL: "https://sb.vault.dev",
      getBearerToken,
    },
  },
};
const metaData2 = {
  uuid: "123",
  skyflowContainer: {
    isControllerFrameReady: false,
  },
  config: {
    vaultID: "vault123",
    vaultURL: "https://sb.vault.dev",
    getBearerToken,
  },
  metaData: {
    clientDomain: "http://abc.com",
  },
  clientJSON: {
    config: {
      vaultID: "vault123",
      vaultURL: "https://sb.vault.dev",
      getBearerToken,
    },
  },
};

const collectStylesOptions = {
  inputStyles: {
    cardIcon: {
      position: "absolute",
      left: "8px",
      top: "calc(50% - 10px)",
    },
  } as InputStyles,
};

const cvvElement: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.cvv",
  placeholder: "cvv",
  label: "cvv",
  type: ElementType.CVV,
  ...collectStylesOptions,
};

const cardNumberElement: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.card_number",
  type: ElementType.CARD_NUMBER,
  ...collectStylesOptions,
};

const ExpirationDateElement: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.expiry",
  type: ElementType.EXPIRATION_DATE,
};

const FileElement: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.file",
  type: ElementType.FILE_INPUT,
  skyflowID: "abc-def",
};

const on = jest.fn();

// const collectResponse: CollectResponse = {
//   records: [
//     {
//       table: "table",
//       fields: {
//         first_name: "token1",
//         primary_card: {
//           card_number: "token2",
//           cvv: "token3",
//         },
//       },
//     },
//   ],
// };
// const collectResponse2: CollectResponse = {
//   errors: [
//     {
//       description: "error",
//       code: 200,
//     },
//   ],
// };

const options: ICollectOptions = {
  tokens: true,
  additionalFields: {
    records: [
      {
        table: "pii_fields",
        fields: {
          "primary_card.cvv": "1234",
        },
      },
    ],
  },
};

describe("Collect container", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;
  beforeEach(() => {
    // emitSpy = null;
    // targetSpy = null;
    // onSpy = null;
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    onSpy = jest.spyOn(bus, "on");
    targetSpy.mockReturnValue({
      on,
      off: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("container collect success", () => {
    let collectContainer = new CollectContainer(
      {},
      metaData,
      {},
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    const div1 = document.createElement("div");
    const div2 = document.createElement("div");

    const element1: CollectElement = collectContainer.create(cvvElement);
    const element2: CollectElement = collectContainer.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    collectContainer
      .collect(options)
      .then()
      .catch((err: CollectResponse) => {
        expect(err).toBeDefined();
      });

    const collectRequestCb = emitSpy.mock.calls[2][2];
    collectRequestCb({
      data: {},
    });

    collectRequestCb({
      error: "error",
    });
  });

  it("should successfully upload files when elements are mounted", async () => {
    const container = new CollectContainer(
      {},
      metaData,
      {},
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    const div = document.createElement("div");
    const fileElement = container.create(FileElement);

    fileElement.mount(div);

    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${FileElement.type}:${btoa(fileElement.getID())}`,
    });

    const uploadPromise: Promise<UploadFilesResponse> = container.uploadFiles({
      tokens: true,
    });

    const uploadRequestCb = emitSpy.mock.calls[1][2];
    uploadRequestCb({
      fileUploadResonse: [{ skyflow_id: "1234" }],
    });

    const expectedResponse = await uploadPromise;
    console.log(JSON.stringify(expectedResponse, null, 2))

    expect(expectedResponse).toBeDefined();
  });

  it("tests different collect element options for elements", () => {
    const container = new CollectContainer(
      {},
      metaData,
      {},
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    let expiryElement: CollectElement;
    let elementOptions: CollectElementOptions = {
      required: true,
      enableCardIcon: true,
      enableCopy: true,
    };
    expiryElement = container.create(ExpirationDateElement, elementOptions);
    const options = expiryElement.getOptions();
    expect(options.enableCardIcon).toBe(true);
    expect(options.enableCopy).toBe(true);
  });
});
