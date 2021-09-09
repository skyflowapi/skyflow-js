import RevealContainer from "../../../src/container/external/RevealContainer";
import { REVEAL_FRAME_CONTROLLER } from "../../../src/container/constants";
import bus from "framebus";
import EventEmitter from "../../../src/event-emitter";
import { RedactionType } from "../../../src/Skyflow";
import RevealElement from "../../../src/container/external/reveal/RevealElement";

const mockBusOn = jest.fn();
const mockBusEmit = jest.fn();

bus.on = mockBusOn;
bus.target = jest.fn().mockReturnValue({
  on: mockBusOn,
  emit: mockBusEmit,
});

const eventEmitter = new EventEmitter();
eventEmitter._emit = jest.fn();
eventEmitter.on = jest.fn();

jest.setTimeout(30000);
describe("Reveal Container Class", () => {
  const testMetaData = {
    uuid: "123",
    config: {
      vaultID: "vault123",
      vaultURL: "sb.vault.dev",
      getBearerToken: jest.fn(),
    },
    metaData: {
      clientDomain: "http://abc.com",
    },
  };

  const testRecord = {
    token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
    redaction: RedactionType.PLAIN_TEXT,
    label: "",
    styles: {
      base: {
        color: "#32ce21",
      },
    },
  };
  const testRevealContainer = new RevealContainer(testMetaData);
  test("constructor", () => {
    expect(testRevealContainer).toBeInstanceOf(RevealContainer);
    expect(document.querySelector("iframe")).toBeTruthy();
    expect(
      document.querySelector("iframe")?.name.includes(REVEAL_FRAME_CONTROLLER)
    ).toBe(true);
    expect(mockBusOn).toBeCalledTimes(3);
    expect(RevealContainer.hasAccessTokenListner).toBe(true);
  });

  test("create() will return a Reveal Element", () => {
    const testRevealElement = testRevealContainer.create(testRecord);
    expect(testRevealElement).toBeInstanceOf(RevealElement);
  });
  test("create() will throw error if record id invalid", () => {
    try {
      testRevealContainer.create({
        token: "",
        redaction: RedactionType.REDACTED,
      });
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id ");
    }
    try {
      testRevealContainer.create({
        token: true,
        redaction: RedactionType.PLAIN_TEXT,
      });
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id true");
    }
  });
  test("create() will throw error if record redaction is invalid", () => {
    try {
      testRevealContainer.create({
        token: "jfdkaj-fksdkjfksa-kej",
        redaction: "",
      });
    } catch (error) {
      expect(error.message).toBe("Invalid Redaction Type ");
    }
    try {
      testRevealContainer.create({
        token: "jfdkaj-fksdkjfksa-kej",
        redaction: "PLAIN",
      });
    } catch (error) {
      expect(error.message).toBe("Invalid Redaction Type PLAIN");
    }
  });

  test("reval() will return a promise", () => {
    const testRevealElement = testRevealContainer.create(testRecord);
    const testDivElement = document.createElement("div");
    testDivElement.setAttribute("id", "testDiv");
    document.body.appendChild(testDivElement);
    testRevealElement.mount("#testDiv");

    testRevealContainer.reveal();
  });
});
