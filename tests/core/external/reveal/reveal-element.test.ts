/*
Copyright (c) 2025 Skyflow, Inc.
*/
import { LogLevel, Env } from "../../../../src/utils/common";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_REVEAL,
  ELEMENT_EVENTS_TO_CLIENT,
  REVEAL_TYPES,
  REVEAL_ELEMENT_OPTIONS_TYPES,
  ElementType,
} from "../../../../src/core/constants";
import RevealElement from "../../../../src/core/external/reveal/reveal-element";
import SkyflowContainer from "../../../../src/core/external/skyflow-container";
import Client from "../../../../src/client";

import * as busEvents from "../../../../src/utils/bus-events";

import bus from "framebus";
import { JSDOM } from "jsdom";
import { Metadata } from "../../../../src/core/internal/internal-types";
import { ContainerType, ISkyflow } from "../../../../src/skyflow";
import { IRevealElementInput } from "../../../../src/core/external/reveal/reveal-container";
import EventEmitter from "../../../../src/event-emitter";
import { RevealElementInput } from "../../../../src/index-node";

jest
  .spyOn(busEvents, "getAccessToken")
  .mockImplementation(() => Promise.reject("access token"));

const mockUuid = "1234";
const elementId = "id";
jest.mock("../../../../src/libs/uuid", () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const getBearerToken = jest.fn();
const getBearerTokenReject = jest
  .fn()
  .mockImplementation(() => Promise.reject());
const groupEmittFn = jest.fn();

let groupOnCb: Function;
const groupEmiitter: EventEmitter = {
  _emit: groupEmittFn,
  on: jest.fn().mockImplementation((args, cb) => {
    groupOnCb = cb;
  }),
  events: {},
  off: jest.fn(),
  hasListener: jest.fn(),
  resetEvents: jest.fn(),
};

jest.mock("../../../../src/libs/jss-styles", () => {
  return {
    __esModule: true,
    default: jest.fn(),
    generateCssWithoutClass: jest.fn(),
    getCssClassesFromJss: jest.fn().mockReturnValue({
      base: { color: "red" },
      global: { backgroundColor: "black" },
    }),
  };
});

jest.mock("../../../../src/core/external/skyflow-container", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

const skyflowConfig: ISkyflow = {
  vaultID: "e20afc3ae1b54f0199f24130e51e0c11",
  vaultURL: "https://testurl.com",
  getBearerToken: jest.fn(),
  options: { trackMetrics: true, trackingKey: "key" },
};
const clientDomain = "http://abc.com";
const metaData: Metadata = {
  uuid: "123",
  clientDomain: clientDomain,
  sdkVersion: "",
  sessionId: "1234",
  containerType: ContainerType.REVEAL,
  clientJSON: {
    config: {
      vaultID: "vault123",
      vaultURL: "https://sb.vault.dev",
      getBearerToken: getBearerToken,
    },
    metaData: {
      uuid: "123",
      clientDomain: clientDomain,
    },
  },
  getSkyflowBearerToken: getBearerToken,
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

// const clientData = {
//   uuid: "123",
//   client: {
//     config: { ...skyflowConfig },
//     metadata: { uuid: "123", skyflowContainer: controller },
//   },
//   clientJSON: {
//     context: { logLevel: LogLevel.ERROR, env: Env.PROD },
//     config: {
//       ...skyflowConfig,
//       getBearerToken: jest.fn().toString(),
//     },
//   },
//   skyflowContainer: {
//     isControllerFrameReady: true,
//   },
//   clientDomain: clientDomain,
// };

// const clientData2: Metadata = {
//   uuid: "123",
//   clientDomain: clientDomain,
//   client: {
//     config: { ...skyflowConfig },
//     metadata: {
//       uuid: "123",
//       skyflowContainer: {
//         isControllerFrameReady: true,
//       } as unknown as SkyflowContainer
//     },
//   },
//   clientJSON: {
//     context: { logLevel: LogLevel.ERROR, env: Env.PROD },
//     config: {
//       ...skyflowConfig,
//       getBearerToken: jest.fn(),
//     },
//   },
//   skyflowContainer: {
//     isControllerFrameReady: false,
//   } as unknown as SkyflowContainer,
// };

// const client: Client = new Client(clientData.client.config, clientData);

// let controller = new SkyflowContainer(client, {
//   logLevel: LogLevel.DEBUG,
//   env: Env.DEV,
// });

const testRecord: IRevealElementInput = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
};
const on = jest.fn();
const off = jest.fn();
let skyflowContainer: SkyflowContainer;

describe("Reveal Element Class", () => {
  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      off,
    });
    const client = new Client(skyflowConfig, metaData);
    skyflowContainer = new SkyflowContainer(client, {
      logLevel: LogLevel.DEBUG,
      env: Env.PROD,
    });
  });

  const containerId = mockUuid;

  test("Constructor for reveal element", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: false,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    expect(testRevealElement).toBeInstanceOf(RevealElement);
  });

  test("Mount method for reveal element", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: true,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);

    expect(document.getElementById("testDiv")).not.toBeNull();
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();

    const testIframeName = `${FRAME_REVEAL}:${btoa(
      mockUuid
    )}:${containerId}:ERROR:${btoa(clientDomain)}`;

    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);

    const onCb = on.mock.calls[0][1];
    onCb({ name: testIframeName });

    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });

  test("Mount method for file render element", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: true,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);

    expect(document.getElementById("testDiv")).not.toBeNull();
    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");

    expect(document.querySelector("iframe")).toBeTruthy();

    const testIframeName = `${FRAME_REVEAL}:${btoa(
      mockUuid
    )}:${containerId}:ERROR:${btoa(clientDomain)}`;

    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);

    const onCb = on.mock.calls[0][1];
    onCb({ name: testIframeName });

    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
  });

  test("file render success scenario", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      {},
      metaData2,
      {
        containerId: containerId,
        isMounted: true,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(
      mockUuid
    )}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testIframeName,
    });

    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);

    testRevealElement
      .renderFile()
      .then((data) =>
        expect(data).toEqual({
          success: { skyflow_id: "1244", column: "column" },
        })
      )
      .catch((error) => console.log("error", error));
    const frameReadyEvent = on.mock.calls[1][0];
    expect(frameReadyEvent).toBe(
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + "123"
    );
    const onCallback = on.mock.calls[1][1];
    const cb = jest.fn();
    onCallback({}, cb);
    expect(emitSpy.mock.calls[3][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + "123"
    );
    expect(emitSpy.mock.calls[3][1]).toEqual({
      type: REVEAL_TYPES.RENDER_FILE,
      records: {
        altText: "alt text",
        skyflowID: "1244",
        column: "column",
        table: "table",
      },
      containerId: mockUuid,
      iframeName: testIframeName,
    });
    const emitCb = emitSpy.mock.calls[3][2];
    emitCb({ success: { skyflow_id: "1244", column: "column" } });
  });

  test("renderFile when SKYFLOW_FRAME_CONTROLLER_READY is not triggered success case", (done) => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      undefined,
      metaData2,
      {
        containerId: containerId,
        isMounted: true,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    expect(testRevealElement.isMounted()).toBe(false);

    // Call renderFile before triggering SKYFLOW_FRAME_CONTROLLER_READY
    const renderPromise = testRevealElement.renderFile();

    // Verify that the else block is executed
    const frameReadyEventName =
      ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + "123";
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(frameReadyEventName);

    // Simulate the SKYFLOW_FRAME_CONTROLLER_READY event
    const onCb = on.mock.calls[1][1];
    const cb = jest.fn();
    onCb({}, cb);

    const emitCb = emitSpy.mock.calls[0][2];
    emitCb({ success: { skyflow_id: "1244", column: "column" } });

    // Verify the renderFile promise resolves correctly
    renderPromise
      .then((data) => {
        expect(data).toEqual({});
        done();
      })
      .catch((error) => {
        console.error("Error:", error);
        done(error);
      });
  });

  test("renderFile when SKYFLOW_FRAME_CONTROLLER_READY is not triggered error case", (done) => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: true,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );

    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    expect(testRevealElement.isMounted()).toBe(false);

    // Call renderFile before triggering SKYFLOW_FRAME_CONTROLLER_READY
    const renderPromise = testRevealElement.renderFile();

    const emitCb = emitSpy.mock.calls[0][2];
    emitCb({
      errors: {
        column: "column",
        skyflowId: "1244",
        error: { code: 400, description: "No Records Found" },
      },
    });

    // Verify the renderFile promise resolves correctly
    renderPromise.catch((error) => {
      expect(error).toEqual({
        errors: {
          column: "column",
          skyflowId: "1244",
          error: {
            code: 400,
            description: "No Records Found",
          },
        },
      });
      done();
    });
  });

  test("file render error case", () => {
    const testRevealElement = new RevealElement(
      {
        skyflowID: "1244",
        column: "column",
        table: "table",
        altText: "alt text",
      },
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: true,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(
      mockUuid
    )}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    const eventListenerName = ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testIframeName;
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(eventListenerName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testIframeName,
    });
    expect(testRevealElement.isMounted()).toBe(true);
    expect(testRevealElement.iframeName()).toBe(testIframeName);
    testRevealElement.renderFile().then(
      data => console.log('data', data)
      ).catch (
      (error) => {
        expect(error).toEqual({ errors: { skyflowId:'1244', error: "No Records Found", column: "Not column" } });
    });

    expect(emitSpy.mock.calls[3][0]).toBe(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + '123');
    expect(emitSpy.mock.calls[3][1]).toEqual({type: REVEAL_TYPES.RENDER_FILE, records: {altText: "alt text", skyflowID: '1244', column: 'column', table: 'table' }, containerId: mockUuid, iframeName: testIframeName});
    const emitCb = emitSpy.mock.calls[3][2];
    emitCb({ errors: { skyflowId:'1244', error: "No Records Found", column: "Not column" } });
  });

  test("Mount method with ready to mount false", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: false,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(
      mockUuid
    )}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });

  test("Mount method with ready to mount false case 2", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: false,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    expect(testRevealElement.isMounted()).toBe(false);

    testRevealElement.mount("#testDiv");

    expect(document.querySelector("iframe")).toBeTruthy();
    const testIframeName = `${FRAME_REVEAL}:${btoa(
      mockUuid
    )}:${containerId}:ERROR:${btoa(clientDomain)}`;
    expect(document.querySelector("iframe")?.name).toBe(testIframeName);

    expect(testRevealElement.iframeName()).toBe(testIframeName);
    expect(testRevealElement.hasToken()).toBe(true);
  });

  test("has token should return false, without token", () => {
    const testRevealElement = new RevealElement(
      {},
      undefined,
      metaData,
      {
        containerId: containerId,
        isMounted: false,
        eventEmitter: groupEmiitter,
        type: ContainerType.REVEAL
      },
      elementId,
      { logLevel: LogLevel.ERROR, env: Env.PROD }
    );
    expect(testRevealElement.hasToken()).toBe(false);
  });
});

describe("Reveal Element Methods", () => {
  const containerId = mockUuid;
  const testRevealElement = new RevealElement(
    {
      token: "1244",
    },
    undefined,
    metaData,
    { containerId: containerId, isMounted: false, eventEmitter: groupEmiitter, type: ContainerType.REVEAL
 },
    elementId,
    { logLevel: LogLevel.ERROR, env: Env.PROD }
  );
  const testRevealElement2 = new RevealElement(
    {
      skyflowID: "1244",
      column: "column",
      table: "table",
      altText: "demo",
      inputStyles: {
        base: {
          border: "5px solid orange",
          padding: "10px 10px",
          borderRadius: "10px",
          color: "#1d1d1d",
          marginTop: "4px",
          height: "260px",
          width: "400px",
        },
        global: {
          "@import":
            'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
        },
      },
      errorTextStyles: {
        base: {
          border: "5px solid orange",
          padding: "10px 10px",
          borderRadius: "10px",
          color: "#1d1d1d",
          marginTop: "4px",
          height: "260px",
          width: "400px",
        },
        global: {
          "@import":
            'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
        },
      },
    },
    undefined,
    metaData,
    { containerId: containerId, isMounted: false, eventEmitter: groupEmiitter, type: ContainerType.REVEAL
 },
    elementId,
    { logLevel: LogLevel.ERROR, env: Env.PROD }
  );

  let emitSpy: jest.SpyInstance;
  let targetSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, "emit");
    targetSpy = jest.spyOn(bus, "target");
    targetSpy.mockReturnValue({
      on,
      off,
    });
  });

  test("unmount method", () => {
    testRevealElement.unmount();
    testRevealElement2.unmount();
  });

  test("check for isSetError False", () => {
    expect(testRevealElement.isClientSetError()).toBe(false);
  });

  test("setError method", () => {
    testRevealElement.mount("#testDiv");
    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
    testRevealElement.setError("errorText");
    expect(testRevealElement.isClientSetError()).toBe(true);
    expect(emitSpy.mock.calls[1][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[1][1]).toEqual({
      name: testRevealElement.iframeName(),
      clientErrorText: "errorText",
      isTriggerError: true,
    });
    expect(emitSpy).toBeCalled();
  });

  test("when element is not mounted then setError method", () => {
    testRevealElement.unmount();
    testRevealElement.setError("errorText");

    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
    expect(testRevealElement.isClientSetError()).toBe(true);
    expect(emitSpy).toBeCalled();
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      clientErrorText: "errorText",
      isTriggerError: true,
    });
    expect(emitSpy).toBeCalled();
    testRevealElement.mount("123");
  });

  test("setErrorOverride method", () => {
    testRevealElement.setErrorOverride("errorText");
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      clientErrorText: "errorText",
      isTriggerError: true,
    });
    expect(emitSpy).toBeCalled();
  });

  test("setErrorOverride method when element is not mounted", () => {
    testRevealElement.unmount();
    testRevealElement.setErrorOverride("errorText");
    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      clientErrorText: "errorText",
      isTriggerError: true,
    });
    expect(emitSpy).toBeCalled();
    testRevealElement.mount("123");
  });

  test("check for isSetError True", () => {
    expect(testRevealElement.isClientSetError()).toBe(true);
  });

  test("resetError method", () => {
    testRevealElement.resetError();
  });

  test("resetError method when element is not mounted", () => {
    testRevealElement.unmount();
    testRevealElement.resetError();
    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
    expect(testRevealElement.isClientSetError()).toBe(false);
    expect(emitSpy).toBeCalled();
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      isTriggerError: false,
    });
    expect(emitSpy).toBeCalled();
    testRevealElement.mount("123");
  });

  test("setAltText method", () => {
    testRevealElement.setAltText("altText");
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: "altText",
    });
    expect(emitSpy).toBeCalled();
  });

  test("setAltText method when element is not mounted", () => {
    testRevealElement.unmount();
    testRevealElement.setAltText("altText");
    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: "altText",
    });
    expect(emitSpy).toBeCalled();
    testRevealElement.mount("123");
  });

  test("clearAltText method", () => {
    testRevealElement.clearAltText();
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: null,
    });
    expect(emitSpy).toBeCalled();
  });

  test("clearAltText method when element is not mounted", () => {
    testRevealElement.unmount();
    testRevealElement.clearAltText();

    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS +
        testRevealElement.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement.iframeName(),
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
      updatedValue: null,
    });
    expect(emitSpy).toBeCalled();
    testRevealElement.mount("123");
  });

  test("getRecord Data", () => {
    const testRecordData = testRevealElement.getRecordData();
    expect(testRecordData).toStrictEqual({ token: "1244" });
  });

  test("setToken method", () => {
    testRevealElement.setToken("testToken");
  });

  test("setToken method when mount event not happen", () => {
    testRevealElement.unmount();
    testRevealElement.setToken("testToken");

    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement.iframeName(),
    });
  });

  test("getRecord Data", () => {
    const testRecordData = testRevealElement.getRecordData();
    expect(testRecordData).toStrictEqual({ token: "testToken" });
  });

  test("update the properties of elements when element is mounted", () => {
    const { window } = new JSDOM('<!DOCTYPE html><div id="mockElement"></div>');
    document = window._document;
    const element = document.createElement("div");
    element.setAttribute("id", "#mockElement");
    testRevealElement2.mount("#mockElement");

    const testUpdateOptions: RevealElementInput = {
      label: "Updated Label",
      inputStyles: {
        base: {
          borderWitdth: "5px",
        },
      },
    };
    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement2.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement2.iframeName(),
    });
    testRevealElement2.update(testUpdateOptions);
    expect(emitSpy.mock.calls[2][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS +
        testRevealElement2.iframeName()
    );
    expect(emitSpy.mock.calls[2][1]).toEqual({
      name: testRevealElement2.iframeName(),
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      updatedValue: {
        label: "Updated Label",
        inputStyles: { base: { borderWitdth: "5px" } },
      },
    });
    expect(emitSpy).toBeCalled();
  });

  test("update the properties of elements when element is unmounted", () => {
    testRevealElement2.unmount();

    const testUpdateOptions: RevealElementInput = {
      label: "Updated Label",
      inputStyles: {
        base: {
          borderWitdth: "5px",
        },
      },
    };
    testRevealElement2.update(testUpdateOptions);
    const mountedEventName =
      ELEMENT_EVENTS_TO_CLIENT.MOUNTED + testRevealElement2.iframeName();
    const onCbName = on.mock.calls[0][0];
    expect(onCbName).toBe(mountedEventName);
    const onCb = on.mock.calls[0][1];
    onCb({
      name: testRevealElement2.iframeName(),
    });
    expect(emitSpy.mock.calls[0][0]).toBe(
      ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS +
        testRevealElement2.iframeName()
    );
    expect(emitSpy.mock.calls[0][1]).toEqual({
      name: testRevealElement2.iframeName(),
      updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
      updatedValue: {
        label: "Updated Label",
        inputStyles: { base: { borderWitdth: "5px" } },
      },
    });
    expect(emitSpy).toBeCalled();
  });
});
