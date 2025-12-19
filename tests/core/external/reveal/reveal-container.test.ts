/*
Copyright (c) 2025 Skyflow, Inc.
*/
import RevealContainer from "../../../../src/core/external/reveal/reveal-container";
import {
  ELEMENT_EVENTS_TO_CLIENT,
  ELEMENT_EVENTS_TO_CONTAINER,
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_FRAME_CONTROLLER,
  REVEAL_TYPES,
} from "../../../../src/core/constants";
import bus from "framebus";
import { LogLevel, Env } from "../../../../src/utils/common";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import SKYFLOW_ERROR_CODE from "../../../../src/utils/constants";
import { parameterizedString } from "../../../../src/utils/logs-helper";
import SkyflowError from "../../../../src/libs/skyflow-error";
import logs from "../../../../src/utils/logs";
import { Metadata } from "../../../../src/core/internal/internal-types";
import SkyflowContainer from "../../../../src/core/external/skyflow-container";
import { ContainerType, RevealResponse } from "../../../../src/index-node";
import { ISkyflow } from "../../../../src/skyflow";
import assert, { AssertionError, fail } from "assert";

jest.mock("../../../../src/iframe-libs/iframer", () => {
  const actualModule = jest.requireActual(
    "../../../../src/iframe-libs/iframer"
  );
  const mockedModule = { ...actualModule };
  mockedModule.__esModule = true;
  mockedModule.getIframeSrc = jest.fn(() => "https://google.com");
  return mockedModule;
});

const mockUuid = "1234";
jest.mock("../../../../src/libs/uuid", () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const on = jest.fn();
const off = jest.fn();
jest.setTimeout(40000);

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());
const testMetaData: Metadata = {
  uuid: "123",
  sdkVersion: "",
  sessionId: "1234",
  clientDomain: "http://abc.com",
  containerType: ContainerType.REVEAL,
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

const testMetaData2: Metadata = {
  ...testMetaData,
  skyflowContainer: {
    isControllerFrameReady: true,
  } as unknown as SkyflowContainer,
};

const testRecord = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  label: "",
  styles: {
    base: {
      color: "#32ce21",
    },
  },
};

const testRevealContainer1 = new RevealContainer(testMetaData, [], {
  logLevel: LogLevel.ERROR,
  env: Env.PROD,
});

const testRevealContainer2 = new RevealContainer(testMetaData2, [], {
  logLevel: LogLevel.ERROR,
  env: Env.PROD,
});

describe("Reveal Container Class", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    onSpy = jest.spyOn(bus, "on");
    targetSpy.mockReturnValue({
      on,
      off,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("reveal should throw error with no elements", (done) => {
    const container = new RevealContainer(testMetaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    container.reveal().catch((error) => {
      done();
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(SkyflowError);
      expect(error.error.code).toEqual(400);
      expect(error.error.description).toEqual(
        logs.errorLogs.NO_ELEMENTS_IN_REVEAL
      );
    });
  });

  test("constructor", () => {
    expect(testRevealContainer1).toBeInstanceOf(RevealContainer);
    expect(testRevealContainer1).toBeInstanceOf(Object);
    expect(testRevealContainer1).toHaveProperty("create");
    expect(testRevealContainer1).toHaveProperty("reveal");
    expect(testRevealContainer1).toHaveProperty("type");
  });
  test("reveal when elment is empty when skyflow ready", async() => {
    const errPromise = testRevealContainer2.reveal()
    await expect(errPromise).rejects.toEqual(new Error(logs.errorLogs.NO_ELEMENTS_IN_REVEAL))
  });

    test("reveal when element is empty when skyflow frame not ready", (done) => {
    testRevealContainer1.reveal().catch((error: RevealResponse) => {
      done();
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(SkyflowError);
      expect(error?.error).toBeDefined();
      expect(error?.error?.code).toEqual(400);
      expect(error?.error?.description).toEqual(
        logs.errorLogs.NO_ELEMENTS_IN_REVEAL
      );
    });
  });

  test("create() will return a Reveal Element", () => {
    const testRevealElement = testRevealContainer1.create(testRecord);
    expect(testRevealElement).toBeInstanceOf(RevealElement);
  });

  test("create() will throw error if record id invalid", () => {
    try {
      testRevealContainer1.create({ token: "" });
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id ");
    }
  });

  test("create()  will throw error for invalid input format options", (done) => {
    try {
      testRevealContainer1.create({ token: "1244" }, { format: undefined });
      done("should throw error");
    } catch (error) {
      expect(error.error.description).toEqual(
        parameterizedString(
          SKYFLOW_ERROR_CODE.INVALID_INPUT_OPTIONS_FORMAT.description
        )
      );
      done();
    }
  });

  test("handle reveal errors with 404 response", async () => {
    const testRevealContainer = new RevealContainer(testMetaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const element = testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const div = document.createElement("div");
    element.mount(div);

    // First emit the mounted event
    emitSpy.mockImplementation((eventName, _, callback) => {
      if (eventName.includes(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS)) {
        callback({ error: { code: 404, description: "Not Found" } });
      }
    });

    // Trigger the mounted callback
    const mountedCallback = on.mock.calls.find((call) =>
      call[0].includes(ELEMENT_EVENTS_TO_CLIENT.MOUNTED)
    )[1];
    mountedCallback({ name: element.iframeName() });

    // Now try to reveal
    await expect(testRevealContainer.reveal()).rejects.toEqual({
      code: 404,
      description: "Not Found",
    });
  });

  test("handle successful reveal when called before mounting", async () => {
    const testRevealContainer = new RevealContainer(testMetaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const element = testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const div = document.createElement("div");

    // Setup emit spy to handle reveal request
    emitSpy.mockImplementation((eventName, _, callback) => {
      if (eventName.includes(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS)) {
        callback({ success: [{ token: "1815-6223-1073-1425" }] });
      }
    });

    const revealPromise = testRevealContainer.reveal();

    // Mount and trigger mounted event
    element.mount(div);
    const mountedCallback = on.mock.calls.find((call) =>
      call[0].includes(ELEMENT_EVENTS_TO_CLIENT.MOUNTED)
    )[1];
    mountedCallback({ name: element.iframeName() });

    const response = await revealPromise;
    expect(response.success).toBeDefined();
    expect(response.success![0].token).toBe("1815-6223-1073-1425");
  });

  test("frame controller ready event correctly", async () => {
    const testRevealContainer = new RevealContainer(testMetaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const element = testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const div = document.createElement("div");
    element.mount(div);

    // Mock frame controller ready event
    emitSpy.mockImplementation((eventName, _, callback) => {
      if (eventName.includes(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS)) {
        callback({ success: [{ token: "1815-6223-1073-1425" }] });
      }
    });

    const mountedCallback = on.mock.calls.find((call) =>
      call[0].includes(ELEMENT_EVENTS_TO_CLIENT.MOUNTED)
    )[1];
    mountedCallback({ name: element.iframeName() });

    const response = await testRevealContainer.reveal();
    expect(response.success).toBeDefined();
    expect(response.success![0].token).toBe("1815-6223-1073-1425");
  });

  test("on container mounted else call back", async () => {
    const testRevealContainer = new RevealContainer(testMetaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const element = testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const div = document.createElement("div");
    element.mount(div);

    // Mock error response
    emitSpy.mockImplementation((eventName, _, callback) => {
      if (eventName.includes(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS)) {
        callback({ error: { code: 404, description: "Not Found" } });
      }
    });

    const mountedCallback = on.mock.calls.find((call) =>
      call[0].includes(ELEMENT_EVENTS_TO_CLIENT.MOUNTED)
    )[1];
    mountedCallback({ name: element.iframeName() });

    await expect(testRevealContainer.reveal()).rejects.toEqual({
      code: 404,
      description: "Not Found",
    });
  });

  test("on container mounted else call back 1", async () => {
    const testRevealContainer = new RevealContainer(testMetaData, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });
    const element = testRevealContainer.create({
      token: "1815-6223-1073-1425",
    });
    const div = document.createElement("div");
    element.mount(div);

    // Mock successful response
    emitSpy.mockImplementation((eventName, _, callback) => {
      if (eventName.includes(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS)) {
        callback({ success: [{ token: "1815-6223-1073-1425" }] });
      }
    });

    const mountedCallback = on.mock.calls.find((call) =>
      call[0].includes(ELEMENT_EVENTS_TO_CLIENT.MOUNTED)
    )[1];
    mountedCallback({ name: element.iframeName() });

    const response = await testRevealContainer.reveal();
    expect(response.success).toBeDefined();
    expect(response.success![0].token).toBe("1815-6223-1073-1425");
  });

  test("reveal before skyflow frame ready event", async () => {
    const testRevealContainer = new RevealContainer(testMetaData2, [], {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });

    // Create reveal element with test token
    const testToken = "1815-6223-1073-1425";
    const div = document.createElement("div");
    const revealElement = testRevealContainer.create({
      token: testToken,
    });

    // Mount the element
    revealElement.mount(div);

    // Mock success response data
    const successResponse: RevealResponse = {
      success: [
        {
          token: testToken,
          valueType: "string",
        },
      ],
    };

    // Setup event listeners and callbacks before calling reveal
    const elementMountedEvent =
      ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + mockUuid;
    const revealRequestEvent =
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + testMetaData2.uuid;

    // Handle element mounted event
    bus.emit(elementMountedEvent, {
      token: testToken,
      containerId: mockUuid,
    });

    // Get and execute the mounted callback
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(elementMountedEvent);
    const onCb = on.mock.calls[0][1];
    onCb({ token: testToken, containerId: mockUuid });

    // Call reveal and await response
    const revealPromise = testRevealContainer.reveal();

    // Get and execute the reveal request callback
    const emitEventName = emitSpy.mock.calls[1][0];
    const emitData = emitSpy.mock.calls[1][1];
    const emitCb = emitSpy.mock.calls[1][2];

    expect(emitEventName).toBe(revealRequestEvent);
    expect(emitData).toEqual({
      type: REVEAL_TYPES.REVEAL,
      containerId: mockUuid,
      records: [{ token: testToken }],
      errorMessages: {},
    });

    // Simulate successful reveal response
    emitCb(successResponse);

    // Verify the final response
    const response = await revealPromise;
    expect(response).toEqual(successResponse);
    expect(response.success).toBeDefined();
    expect(response.success![0].token).toBe(testToken);
    expect(response.success![0].valueType).toBe("string");
  });

  test("reveal before skyflow frame ready when element have error", (done) => {
    var element = testRevealContainer2.create({ token: "1815-6223-1073-1425" });
    element.setError("error occ");

    testRevealContainer2.reveal().catch((error: RevealResponse) => {
      done();
      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors![0].code).toEqual(400);
      expect(error.errors![0].description).toEqual(
        logs.errorLogs.REVEAL_ELEMENT_ERROR_STATE
      );
    });
    element.resetError();
  });

  test("reveal before skyflow frame ready", (done) => {
    var element = testRevealContainer1.create({ token: "1815-6223-1073-1425" });
    element.setError("error occ");

    testRevealContainer1.reveal().catch((error: RevealResponse) => {
      done();
      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors![0].code).toEqual(400);
      expect(error.errors![0].description).toEqual(
        logs.errorLogs.REVEAL_ELEMENT_ERROR_STATE
      );
    });
  });
});
