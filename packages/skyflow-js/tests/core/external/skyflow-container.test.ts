/*
Copyright (c) 2025 Skyflow, Inc.
*/
import bus from "framebus";
import SkyflowContainer from "../../../src/external/skyflow-container";
import Client from "@core/client";
import * as iframerUtils from "@core/iframe-libs/iframer";
import { Env, LogLevel } from "../../../src/utils/common";
import { ISkyflow } from "../../../src/skyflow";

jest
  .spyOn(iframerUtils, "getIframeSrc")
  .mockImplementation(() => "https://google.com");

const skyflowConfig: ISkyflow = {
  vaultID: "e20afc3ae1b54f0199f24130e51e0c11",
  vaultURL: "https://testurl.com",
  getBearerToken: jest.fn(),
  options: { trackMetrics: true, trackingKey: "key" },
};

const metaData = {
  uuid: "123",
  clientDomain: "http://abc.com",
};

// Guards the pre-split serialized shape of the SkyflowContainer that rides the
// element iframe `src` URL. `client`/`containerId`/`context` are `protected`
// (enumerable at runtime) for subclass access; without `toJSON()` they leak the
// whole client config into every element URL. See SK-3041 metadata regression.
describe("SkyflowContainer metadata serialization", () => {
  beforeEach(() => {
    jest.spyOn(bus, "target").mockReturnValue({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("serializes only isControllerFrameReady, not client/containerId/context", () => {
    const client = new Client(skyflowConfig, metaData);
    const container = new SkyflowContainer(client, {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });

    // The live object still exposes state for client-side readiness reads.
    expect(container.isControllerFrameReady).toBe(false);

    // But JSON.stringify (the iframe-URL path) emits only the ready flag.
    const serialized = JSON.parse(JSON.stringify(container));
    expect(serialized).toEqual({ isControllerFrameReady: false });
    expect(serialized).not.toHaveProperty("client");
    expect(serialized).not.toHaveProperty("containerId");
    expect(serialized).not.toHaveProperty("context");
  });

  it("reflects the live isControllerFrameReady value when serialized", () => {
    const client = new Client(skyflowConfig, metaData);
    const container = new SkyflowContainer(client, {
      logLevel: LogLevel.ERROR,
      env: Env.PROD,
    });

    container.isControllerFrameReady = true;
    const serialized = JSON.parse(JSON.stringify(container));
    expect(serialized).toEqual({ isControllerFrameReady: true });
  });
});
