/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import { ELEMENT_EVENTS_TO_IFRAME, ElementType } from "../../../../src/core/constants";
import ComposableElement from "../../../../src/core/external/collect/compose-collect-element";
import EventEmitter from "../../../../src/event-emitter";
import { ContainerType } from "../../../../src/skyflow";
import { ElementState } from "../../../../src/utils/common";
import SKYFLOW_ERROR_CODE from "../../../../src/utils/constants";

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
    iframeName,
    {}
  );
  const testElement2 = new ComposableElement(
    "testce2",
    testEventEmitter,
    iframeName,
    {}
  );
  const testElement3 = new ComposableElement(
    "testce3",
    testEventEmitter,
    iframeName,
    {}
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
  
  it("throws missing handler error when handler is undefined", () => {
    try {
      testElement.on("CHANGE", undefined as any);
    } catch (err: any) {
      expect(err?.error?.code).toBe(SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER.code);
    }
  });

  it("throws invalid handler error when handler is not a function", () => {
    try {
      testElement.on("CHANGE", "notAFunction" as any);
    } catch (err: any) {
      expect(err?.error?.code).toBe(SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER.code);
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
  it('rejects when multi file upload invoked on non MULT_FILE_INPUT composable element when type is not MULTI_FILE_INPUT', async () => {
    await expect(testElement3.uploadMultipleFiles()).
      rejects.toMatchObject({ error: { code: SKYFLOW_ERROR_CODE.MULTI_FILE_NOT_SUPPORTED.code } });
  });
  it('reject when multi file upload invoked on MULT_FILE_INPUT composable element case 1', async () => {
    const testEventEmitt = new EventEmitter();
    const testElement4 = new ComposableElement(
      "testce4",
      testEventEmitt,
      iframeName,
      { type: "MULTI_FILE_INPUT" }
    );
    // Trigger upload then dispatch error event AFTER listener is attached.
    testEventEmitt.on(`${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:testce4`, (_: any, cb: Function) => {
      cb({ error: 'Error occurred' });
    });
    await expect(testElement4.uploadMultipleFiles()).rejects.toMatchObject({ error: 'Error occurred' });
  });
  it('reject when multi file upload invoked on MULT_FILE_INPUT composable element case 2', async () => {
    const testEventEmitt = new EventEmitter();
    const testElement4 = new ComposableElement(
      "testce4",
      testEventEmitt,
      iframeName,
      { type: "MULTI_FILE_INPUT" }
    );
    // Trigger upload then dispatch error event AFTER listener is attached.
    const p = testElement4.uploadMultipleFiles();
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:testce4`,
        data: { error: 'Error occurred' }
      }
    }));
    await expect(p).rejects.toMatchObject({ error: 'Error occurred' });
  });
  it('uploadMultipleFiles resolves on success message event', async () => {
    const elementName = 'multiSuccess';
    const emitterStub: any = { _emit: jest.fn(), on: jest.fn() };
    const multiEl = new ComposableElement(elementName, emitterStub, iframeName, { type: ElementType.MULTI_FILE_INPUT });
    let messageHandler: any;
    const addSpy = jest.spyOn(window, 'addEventListener').mockImplementation((evt, handler) => {
      if (evt === 'message') messageHandler = handler;
    });
    const promise = multiEl.uploadMultipleFiles();
    expect(messageHandler).toBeDefined();
    // Simulate success
    messageHandler({ data: { type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${elementName}`, data: { fileUploadResponse: [{ filename: 'doc.pdf' }] } } });
    await expect(promise).resolves.toMatchObject({ fileUploadResponse: [{ filename: 'doc.pdf' }] });
    addSpy.mockRestore();
  });

  it('uploadMultipleFiles rejects when message has errorResponse', async () => {
    const elementName = 'multiErrResp';
    const emitterStub: any = { _emit: jest.fn(), on: jest.fn() };
    const multiEl = new ComposableElement(elementName, emitterStub, iframeName, { type: ElementType.MULTI_FILE_INPUT });
    let messageHandler: any;
    const addSpy = jest.spyOn(window, 'addEventListener').mockImplementation((evt, handler) => { if (evt === 'message') messageHandler = handler; });
    const promise = multiEl.uploadMultipleFiles();
    messageHandler({ data: { type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${elementName}`, data: { errorResponse: 'Upload failed' } } });
    await expect(promise).rejects.toMatchObject({ errorResponse: 'Upload failed' });
    addSpy.mockRestore();
  });

  it('uploadMultipleFiles rejects when message has error field', async () => {
    const elementName = 'multiErrField';
    const emitterStub: any = { _emit: jest.fn(), on: jest.fn() };
    const multiEl = new ComposableElement(elementName, emitterStub, iframeName, { type: ElementType.MULTI_FILE_INPUT });
    let messageHandler: any;
    const addSpy = jest.spyOn(window, 'addEventListener').mockImplementation((evt, handler) => { if (evt === 'message') messageHandler = handler; });
    const promise = multiEl.uploadMultipleFiles();
    messageHandler({ data: { type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${elementName}`, data: { error: 'Validation error' } } });
    await expect(promise).rejects.toMatchObject({ error: 'Validation error' });
    addSpy.mockRestore();
  });
});
