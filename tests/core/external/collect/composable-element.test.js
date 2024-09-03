import ComposableElement from "../../../../src/core/external/collect/compose-collect-element";
import { ContainerType } from "../../../../src/skyflow";

describe("test composable element", () => {
  const emitter = jest.fn();
  let emitSpy;
  const testEventEmitter = {
    on: (name, cb) => {
      if (name.includes("FOCUS")) {
        cb({
          isValid: true,
          isComplete: true,
          name: "element",
          value: undefined,
        });
      } else if (name.includes("testce2")) {
        emitSpy = cb;
      } else {
        cb({
          isValid: true,
          isComplete: true,
          name: "element",
          value: "",
        });
      }
    },
    _emit: emitter,
  };
  const handler = jest.fn();
  const iframeName = "controller_iframe";
  const testElement = new ComposableElement("testce1", testEventEmitter);
  const testElement2 = new ComposableElement("testce2", testEventEmitter);
  const testElement3 = new ComposableElement("testce3", testEventEmitter, iframeName);

  it("Check for iframe name", () => {
    expect(testElement3.type).toBe(ContainerType.COMPOSABLE);
    const iframe = testElement3.iframeName();
    expect(iframe).toBe(iframeName);
  });

  it("Check for element name", () => {
    expect(testElement3.type).toBe(ContainerType.COMPOSABLE);
    const id = testElement3.getID();
    expect(id).toBe("testce3");
  });

  it("test valid listner - 2 ", () => {
    expect(testElement.type).toBe(ContainerType.COMPOSABLE);
    testElement.on("CHANGE", handler);
    expect(handler).toBeCalledWith({ value: "", isValid: true });
  });

  it("test valid listiner 1", () => {
    expect(testElement.type).toBe(ContainerType.COMPOSABLE);
    testElement.on("FOCUS", handler);
    expect(handler).toBeCalledWith({ value: "", isValid: true });
  });

  it("invalid on listener - 1", () => {
    try {
      testElement.on("invalid_listener", (state) => {});
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("invalid on listener - 2", () => {
    try {
      testElement.on("CHANGE", null);
    } catch (err) {}
  });

  it("invalid on listener - 3", () => {
    try {
      testElement.on("CHANGE", true);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("update element propeties when element is mounted", () => {
    const testUpdateOptions = { table: "table" };
    testElement.update(testUpdateOptions);
    expect(emitter).toBeCalledWith("COMPOSABLE_UPDATE_OPTIONS", {
      elementName: "testce1",
      elementOptions: testUpdateOptions,
    });
  });

  it("update element propeties when element is not mounted", () => {
    const testUpdateOptions = { table: "table" };
    testElement2.update(testUpdateOptions);
    expect(emitter).not.toBeCalledWith("COMPOSABLE_UPDATE_OPTIONS", {
      elementName: "testce2",
      elementOptions: testUpdateOptions,
    });
    emitSpy();
    expect(emitter).toBeCalledWith("COMPOSABLE_UPDATE_OPTIONS", {
      elementName: "testce2",
      elementOptions: testUpdateOptions,
    });
  });
});
