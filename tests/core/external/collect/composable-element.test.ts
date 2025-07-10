/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import ComposableElement from "../../../../src/core/external/collect/compose-collect-element";
import EventEmitter from "../../../../src/event-emitter";
import { ContainerType } from "../../../../src/skyflow";
import { ElementState } from "../../../../src/utils/common";

describe("test composable element", () => {
  const emitter = jest.fn();
  let emitSpy: Function;
  const testEventEmitter: EventEmitter = {
    _emit: emitter,
    on: (name: string, cb: Function) => {
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
    off: jest.fn(),
    events: {},
    hasListener: jest.fn(),
    resetEvents: jest.fn(),
  };

  const handler = jest.fn();
  const iframeName = "controller_iframe";
  const testElement = new ComposableElement(
    "testce1",
    testEventEmitter,
    iframeName
  );
  const testElement2 = new ComposableElement(
    "testce2",
    testEventEmitter,
    iframeName
  );
  const testElement3 = new ComposableElement(
    "testce3",
    testEventEmitter,
    iframeName
  );

  it("tests for iframe name to be correct", () => {
    expect(testElement3.type).toBe(ContainerType.COMPOSABLE);
    const iframe = testElement3.iframeName();
    expect(iframe).toBe(iframeName);
  });

  it("tests for element name to be correct", () => {
    expect(testElement3.type).toBe(ContainerType.COMPOSABLE);
    const id = testElement3.getID();
    expect(id).toBe("testce3");
  });

  it("tests valid CHANGE listener on composable element", () => {
    expect(testElement.type).toBe(ContainerType.COMPOSABLE);
    testElement.on("CHANGE", handler);
    expect(handler).toBeCalledWith({ value: "", isValid: true });
  });

  it("tests valid FOCUS listener on composable element", () => {
    expect(testElement.type).toBe(ContainerType.COMPOSABLE);
    testElement.on("FOCUS", handler);
    expect(handler).toBeCalledWith({ value: "", isValid: true });
  });

  it("tests invalid listener on composable element", () => {
    try {
      testElement.on("invalid_listener", (_: ElementState) => {});
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("should update element propeties when element is mounted", () => {
    const testUpdateOptions = { table: "table" };
    testElement.update(testUpdateOptions);
    expect(emitter).toBeCalledWith("COMPOSABLE_UPDATE_OPTIONS", {
      elementName: "testce1",
      elementOptions: testUpdateOptions,
    });
  });

  it("should update element propeties when element is not mounted", () => {
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
