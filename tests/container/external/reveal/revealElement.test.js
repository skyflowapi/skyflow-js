import uuid from "../../../../src/libs/uuid";
import { RedactionType } from "../../../../src/Skyflow";
import { FRAME_REVEAL } from "../../../../src/container/constants";
import RevealElement from "../../../../src/container/external/reveal/RevealElement";
import bus from "framebus";

const _on = jest.fn();
const _off = jest.fn();
const _emit = jest.fn();
const getBearerToken = jest.fn();

bus.on = _on;
bus.target = jest.fn().mockReturnValue({
  on: _on,
});
bus.off = _off;
bus.emit = _emit;

const metaData = {
  uuid: "123",
  config: {
    vaultId: "vault123",
    vaultUrl: "sb.vault.dev",
    getAccessToken: getBearerToken,
  },
  metaData: {
    clientDomain: "http://abc.com",
  },
};
const testRecord = {
  id: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  redaction: RedactionType.PLAIN_TEXT,
};

describe("Reveal Element Class", () => {
  const containerId = uuid();
  test("constructor", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      metaData,
      containerId
    );
    expect(testRevealElement).toBeInstanceOf(RevealElement);
  });
  test("Mount Method", () => {
    const testRevealElement = new RevealElement(
      testRecord,
      metaData,
      containerId
    );
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    testRevealElement.mount("#testDiv");
    expect(document.querySelector("iframe")).toBeTruthy();
    expect(document.querySelector("iframe")?.name).toBe(
      `${FRAME_REVEAL}:${btoa(testRecord.id)}:${containerId}`
    );

    expect(_on).toBeCalledTimes(1);
  });
});
