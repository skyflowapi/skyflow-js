/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ElementType,
} from "../../../../src/core/constants";
import {
  LogLevel,
  Env,
  ValidationRuleType,
  CollectElementInput,
  CollectResponse,
  Context,
  ICollectOptions,
} from "../../../../src/utils/common";
import ComposableContainer from "../../../../src/core/external/collect/compose-collect-container";
import ComposableElement from "../../../../src/core/external/collect/compose-collect-element";
import CollectElement from "../../../../src/core/external/collect/collect-element";
import SKYFLOW_ERROR_CODE from "../../../../src/utils/constants";
import EventEmitter from "../../../../src/event-emitter";
import { parameterizedString } from "../../../../src/utils/logs-helper";
import SkyflowError from "../../../../src/libs/skyflow-error";
import SkyflowContainer from "../../../../src/core/external/skyflow-container";
import { ContainerType } from "../../../../src/skyflow";
import { Metadata } from "../../../../src/core/internal/internal-types";

const bus = require("framebus");

jest.mock("../../../../src/iframe-libs/iframer", () => {
  const actualModule = jest.requireActual(
    "../../../../src/iframe-libs/iframer"
  );
  const mockedModule = { ...actualModule };
  mockedModule.__esModule = true;
  mockedModule.getIframeSrc = jest.fn(() => "https://google.com");
  return mockedModule;
});

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());

const mockUuid = "1234";
jest.mock("../../../../src/libs/uuid", () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const mockUnmount = jest.fn();
const updateMock = jest.fn();
jest.mock("../../../../src/core/external/collect/collect-element");

(CollectElement as unknown as jest.Mock).mockImplementation(
  (_, tempElements) => {
    tempElements.rows[0].elements.forEach((element) => {
      element.isMounted = true;
    });
    return {
      isMounted: () => true,
      mount: jest.fn(),
      isValidElement: () => true,
      unmount: mockUnmount,
      updateElement: updateMock,
    };
  }
);

jest.mock("../../../../src/event-emitter");
const emitMock = jest.fn();

let emitterSpy: Function;
let composableUpdateSpy: Function;
(EventEmitter as unknown as jest.Mock).mockImplementation(() => ({
  on: jest.fn().mockImplementation((name, cb) => {
    if (name === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS) {
      composableUpdateSpy = cb;
    }
    emitterSpy = cb;
  }),
  _emit: emitMock,
}));

const metaData: Metadata = {
  uuid: "123",
  sdkVersion: "",
  sessionId: "1234",
  clientDomain: "http://abc.com",
  containerType: ContainerType.COMPOSABLE,
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
  },
};

const cvvElementInput: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.cvv",
  placeholder: "cvv",
  label: "cvv",
  type: ElementType.CVV,
  validations: [
    {
      type: ValidationRuleType.LENGTH_MATCH_RULE,
      params: {
        min: 2,
        max: 4,
        error: "Error",
      },
    },
  ],
  ...collectStylesOptions,
};

const cardNumberElement: CollectElementInput = {
  table: "pii_fields",
  column: "primary_card.card_number",
  type: ElementType.CARD_NUMBER,
  ...collectStylesOptions,
};

const context: Context = { logLevel: LogLevel.ERROR, env: Env.PROD };
const on = jest.fn();

const collectResponse: CollectResponse = {
  records: [
    {
      table: "table",
      fields: {
        first_name: "token1",
        primary_card: {
          card_number: "token2",
          cvv: "token3",
        },
      },
    },
  ],
};

describe("test composable container class", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;
  let eventEmitterSpy: jest.SpyInstance;

  beforeEach(() => {
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    eventEmitterSpy = jest.spyOn(EventEmitter.prototype, "on");
    onSpy = jest.spyOn(bus, "on");
    targetSpy.mockReturnValue({
      on,
      off: jest.fn(),
    });
  });

  it("tests constructor", () => {
    const container = new ComposableContainer(metaData, [], context, {
      layout: [1],
    });
    expect(container).toBeInstanceOf(ComposableContainer);
  });

  it("tests create method", () => {
    const container = new ComposableContainer(metaData, [], context, {
      layout: [1],
    });
    const element = container.create(cvvElementInput);
    expect(element).toBeInstanceOf(ComposableElement);
  });

  it("should throw error when create method is called with no element", (done) => {
    const container = new ComposableContainer(metaData, [], context, {
      layout: [1],
    });
    container.collect().catch((err) => {
      done();
      expect(err).toBeDefined();
      expect(err).toBeInstanceOf(SkyflowError);
      expect(err.error.code).toBe(
        SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code
      );
      expect(err.error.description).toBe(
        parameterizedString(
          SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.description
        )
      );
    });
  });

  it("should throw error when create method is called with no element case 2", (done) => {
    const container = new ComposableContainer(metaData2, [], context, {
      layout: [1],
    });
    container.collect().catch((err) => {
      done();
      expect(err).toBeDefined();
      expect(err).toBeInstanceOf(SkyflowError);
      expect(err.error.code).toBe(
        SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code
      );
      expect(err.error.description).toBe(
        parameterizedString(
          SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.description
        )
      );
    });
  });

  it("test create method with callback", () => {
    const container = new ComposableContainer(metaData, [], context, {
      layout: [1],
    });
    const element = container.create(cvvElementInput);
    expect(element).toBeInstanceOf(ComposableElement);
  });

  it("tests mount", () => {
    const div = document.createElement("div");
    div.id = "composable";
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {
      layout: [2],
    });
    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    container.mount("#composable");
  });

  it("tests collect with success and error scenarios", async () => {
    const div = document.createElement("div");
    div.id = "composable";
    document.body.append(div);

    const container = new ComposableContainer(metaData, [], context, {
      layout: [2],
      styles: { base: { width: "100px" } },
    });

    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);

    container.mount("#composable");

    const options: ICollectOptions = {
      tokens: true,
      additionalFields: {
        records: [
          {
            table: "string",
            fields: {
              column1: "value",
            },
          },
        ],
      },
      upsert: [
        {
          table: "table",
          column: "column",
        },
      ],
    };

    const collectPromiseSuccess: Promise<CollectResponse> =
      container.collect(options);

    const collectCb1 = emitSpy.mock.calls[0][2];
    collectCb1(collectResponse);

    const successResult = await collectPromiseSuccess;
    expect(successResult).toEqual(collectResponse);

    const collectPromiseError: Promise<CollectResponse> =
      container.collect(options);
    const collectCb2 = emitSpy.mock.calls[1][2];
    collectCb2({ error: "Error occurred" });

    await expect(collectPromiseError).rejects.toEqual("Error occurred");
  });

  it("tests collect when isMount is false", async () => {
    let readyCb: Function;
    on.mockImplementation((_, cb) => {
      readyCb = cb;
    });
    const div = document.createElement("div");
    div.id = "composable";
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {
      layout: [2],
      styles: { base: { width: "100px" } },
    });
    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);
    emitterSpy();

    container.mount("#composable");
    Object.defineProperty(container, "#isMounted", {
      value: false,
      writable: true,
    });

    container.collect();

    on.mockImplementation((_, cb) => {
      emitterSpy = cb;
    });
  });

  it("tests updateListeners function", () => {
    let readyCb: Function;
    on.mockImplementation((_, cb) => {
      readyCb = cb;
    });
    const div = document.createElement("div");
    div.id = "composable";
    document.body.append(div);

    const container = new ComposableContainer(metaData2, [], context, {
      layout: [2],
      styles: { base: { width: "100px" } },
    });

    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    composableUpdateSpy({ elementName: "element:CARD_NUMBER:MTIzNA==" });

    container.mount("#composable");
    container.collect();

    on.mockImplementation((name, cb) => {
      emitterSpy = cb;
    });
  });

  it("tests collect without mounting the container", (done) => {
    const div = document.createElement("div");
    div.id = "composable";
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {
      layout: [2],
      styles: { base: { width: "100px" } },
    });
    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);
    try {
      container
        .collect()
        .then((res) => {
          done(res);
        })
        .catch((err) => {
          expect(err.error.description).toBe(
            parameterizedString(
              SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED.description
            )
          );
          done();
        });
    } catch (err) {
      done(err);
    }
  });

  it("tests container collect", () => {
    const containerOptions = {
      layout: [2],
      styles: { base: { width: "100px" } },
      errorTextStyles: { base: { color: "red" } },
    };
    let container = new ComposableContainer(
      metaData,
      [],
      context,
      containerOptions
    );
    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);
    container.mount("#composable");

    const options: ICollectOptions = {
      tokens: true,
      additionalFields: {
        records: [
          {
            table: "string", //table into which record should be inserted
            fields: {
              column1: "value",
            },
          },
        ],
      },
      upsert: [
        {
          table: "table",
          column: "column",
        },
      ],
    };
    emitterSpy();
    setTimeout(() => {
      container.collect(options);
      const collectCb = emitSpy.mock.calls[0][2];
      collectCb(collectResponse);
      collectCb({ error: "Error occured" });
    }, 200);
  });

  it("test container unmount", () => {
    const div = document.createElement("div");
    div.id = "composable";
    document.body.append(div);

    const container = new ComposableContainer(metaData, [], context, {
      layout: [2],
    });
    const element1 = container.create(cvvElementInput);
    const element2 = container.create(cardNumberElement);
    setTimeout(() => {
      container.mount("#composable");
      container.unmount();
      expect(mockUnmount).toBeCalled();
    }, 0);
  });
});
