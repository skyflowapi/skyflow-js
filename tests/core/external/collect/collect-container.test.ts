/*
Copyright (c) 2025 Skyflow, Inc.
*/
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ElementType,
} from "../../../../src/core/constants";
import CollectContainer from "../../../../src/core/external/collect/collect-container";
import CollectElement from "../../../../src/core/external/collect/collect-element";
import SkyflowContainer from "../../../../src/core/external/skyflow-container";
import { Metadata } from "../../../../src/core/internal/internal-types";
import * as iframerUtils from "../../../../src/iframe-libs/iframer";
import { ContainerType } from "../../../../src/skyflow";
import {
  LogLevel,
  Env,
  CollectElementInput,
  InputStyles,
  CollectResponse,
  ICollectOptions,
  UploadFilesResponse,
  CollectElementOptions,
  ErrorType,
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

const metaData: Metadata = {
  uuid: "123",
  sdkVersion: "",
  sessionId: "1234",
  clientDomain: "http://abc.com",
  containerType: ContainerType.COLLECT,
  clientJSON: {
    config: {
      vaultID: "vault123",
      vaultURL: "https://sb.vault.dev",
      getBearerToken,
    },
    metaData: {
      uuid: "123",
      clientDomain: "http://abc.com",
    },
  },
  skyflowContainer: {
    isControllerFrameReady: true,
  } as unknown as SkyflowContainer,
  getSkyflowBearerToken: getBearerToken,
};

const metaData2: Metadata = {
  ...metaData,
  skyflowContainer: {
    isControllerFrameReady: false,
  } as unknown as SkyflowContainer,
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

const cvvInput: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.cvv",
  placeholder: "cvv",
  label: "cvv",
  type: ElementType.CVV,
  ...collectStylesOptions,
};

const cardNumberInput: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.card_number",
  type: ElementType.CARD_NUMBER,
  ...collectStylesOptions,
};

const ExpirationDateInput: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.expiry",
  type: ElementType.EXPIRATION_DATE,
};

const fileInput: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.file",
  type: ElementType.FILE_INPUT,
  skyflowID: "abc-def",
};

const on = jest.fn();

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

  it("should successfully collect data from elements", () => {
    const collectContainer = new CollectContainer(metaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const div1 = document.createElement("div1");
    const div2 = document.createElement("div2");

    const element1: CollectElement = collectContainer.create(cvvInput);
    const element2: CollectElement = collectContainer.create(cardNumberInput);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvInput.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberInput.type}:${btoa(element2.getID())}`,
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
    const collectContainer = new CollectContainer(metaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const div = document.createElement("div");
    const fileElement = collectContainer.create(fileInput);

    fileElement.mount(div);

    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${fileInput.type}:${btoa(fileElement.getID())}`,
    });

    collectContainer.setError({[ErrorType.NOT_FOUND]: "Test error message"});

    const uploadPromise: Promise<UploadFilesResponse> =
      collectContainer.uploadFiles();

    const uploadFileCallRequestEvent = emitSpy.mock.calls.find((call) => {
      return (
        call[0] &&
        call[0].includes(ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS)
      );
    });
    expect(uploadFileCallRequestEvent).toBeDefined();
    const uploadRequestCb = uploadFileCallRequestEvent[2];
    uploadRequestCb({
      fileUploadResonse: [{ skyflow_id: "abc-def" }],
    });

    const expectedResponse = await uploadPromise;
    console.log(JSON.stringify(expectedResponse, null, 2));
    expect(expectedResponse).toBeDefined();
  });

  it("tests different collect element options for elements", () => {
    const collectContainer = new CollectContainer(metaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    let expiryElement: CollectElement;
    let elementOptions: CollectElementOptions = {
      required: true,
      enableCardIcon: true,
      enableCopy: true,
    };
    expiryElement = collectContainer.create(
      ExpirationDateInput,
      elementOptions
    );
    const options = expiryElement.getOptions();
    expect(options.enableCardIcon).toBe(true);
    expect(options.enableCopy).toBe(true);
  });
  it("should successfully collect data from elements, call set error", () => {
    const collectContainer = new CollectContainer(metaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const div1 = document.createElement("div1");
    const div2 = document.createElement("div2");

    const element1: CollectElement = collectContainer.create(cvvInput);
    const element2: CollectElement = collectContainer.create(cardNumberInput);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvInput.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberInput.type}:${btoa(element2.getID())}`,
    });

    collectContainer.setError({[ErrorType.NOT_FOUND]: "Test error message",})

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
});

describe("iframe cleanup logic", () => {
  let collectContainer: CollectContainer;
  let div1: HTMLElement;
  let div2: HTMLElement;
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;

  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    onSpy = jest.spyOn(bus, "on");
    targetSpy.mockReturnValue({
      on,
      off: jest.fn(),
    });
    div1 = document.createElement("div");
    div2 = document.createElement("div");
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("should remove unmounted iframe elements", () => {
    // Create and mount elements
    collectContainer = new CollectContainer(metaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });

    const element1 = collectContainer.create(cvvInput);
    const element2 = collectContainer.create(cardNumberInput);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvInput.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberInput.type}:${btoa(element2.getID())}`,
    });

    // Mock iframe elements in document
    const iframe1 = document.createElement("iframe");
    iframe1.id = element1.iframeName();
    document.body.appendChild(iframe1);

    // Trigger cleanup by calling collect
    collectContainer.collect().catch((error) => {
      expect(error).not.toBeDefined();
    });
  });

  it("should handle empty document.body", () => {
    collectContainer = new CollectContainer(metaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });

    const element1 = collectContainer.create(cvvInput);
    element1.mount(div1);

    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvInput.type}:${btoa(element1.getID())}`,
    });

    // Mock document.body as null
    const originalBody = document.body;
    Object.defineProperty(document, "body", {
      value: null,
      writable: true,
    });

    collectContainer.collect().catch(() => {});

    // Restore document.body
    Object.defineProperty(document, "body", {
      value: originalBody,
      writable: true,
    });

    // Elements should remain unchanged
    collectContainer.collect().catch((error) => {
      expect(error).not.toBeDefined();
    });
  });

  it("should remove unmounted iframe elements", () => {
    collectContainer = new CollectContainer(metaData2, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });

    // Create and mount elements
    const element1 = collectContainer.create(cvvInput);
    const element2 = collectContainer.create(cardNumberInput);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvInput.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberInput.type}:${btoa(element2.getID())}`,
    });

    // Mock iframe elements in document
    const iframe1 = document.createElement("iframe");
    iframe1.id = element1.iframeName();
    document.body.appendChild(iframe1);

    // Trigger cleanup by calling collect
    collectContainer.collect().catch((error) => {
      expect(error).not.toBeDefined();
    });
  });
});
