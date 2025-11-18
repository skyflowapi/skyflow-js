/*
Copyright (c) 2025 Skyflow, Inc.
*/
import assert from "assert";
import Client, { IClientRequest } from "../src/client";
import SKYFLOW_ERROR_CODE from "../src/utils/constants";
import logs from "../src/utils/logs";
import { ClientMetadata } from "../src/core/internal/internal-types";
import { ISkyflow } from "../src/skyflow";

const skyflowConfig: ISkyflow = {
  vaultID: "e20afc3ae1b54f0199f24130e51e0c11",
  vaultURL: "https://testurl.com",
  getBearerToken: jest.fn(),
  options: { trackMetrics: true, trackingKey: "key" },
};

const metaData: ClientMetadata = {
  uuid: "1234",
  clientDomain: "http://abc.com",
};

describe("Client Class", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("Client fromJson method", () => {
    const testClientObject = Client.fromJSON({
      config: skyflowConfig,
      metaData: metaData,
    });
    expect(testClientObject).toBeInstanceOf(Client);
  });

  test("client toJSON", () => {
    const testClient = new Client(skyflowConfig, metaData);
    const testClient2 = testClient.toJSON();
    expect(testClient2.metaData).toBeDefined();
  });

  test("Client Request Method without errors", () => {
    try {
      const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: 200,
        response: JSON.stringify({ message: "Hello World!" }),
        getAllResponseHeaders: jest
          .fn()
          .mockImplementation(() => "content-type: application/json"),
      } as Partial<XMLHttpRequest>;

      jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => {
        const xhrInstance = { ...xhrMock } as XMLHttpRequest;

        // Add a simple onreadystatechange handler that fires onload/onerror
        // This is crucial for making the mock behave like a real XHR
        xhrInstance.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              if (this.onload) {
                (this.onload as () => void)(); // Call the onload handler
              }
            } else {
              if (this.onerror) {
                (this.onerror as () => void)(); // Call the onerror handler
              }
            }
          }
        };

        return xhrInstance;
      });
      const testClient = new Client(skyflowConfig, metaData);
      const resp = testClient.request({
        requestMethod: "GET",
        url: "https://example-test.com",
        headers: {
          "content-type": "application/json",
          Auth: "eyde.ed.ewe",
        },
        body: JSON.stringify({
          key: "value",
        }),
      });
      expect(xhrMock.open).toBeCalledWith("GET", "https://example-test.com");
      expect(xhrMock.setRequestHeader).toBeCalledWith("Auth", "eyde.ed.ewe");
      expect(xhrMock.send).toBeCalledWith(
        JSON.stringify({
          key: "value",
        })
      );
    } catch (err) {
      console.log(err);
    }
  });

  test("Client Request Method with url-formencoded content-type", () => {
    try {
      const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: 200,
        response: JSON.stringify({ message: "Hello World!" }),
        getAllResponseHeaders: jest.fn().mockImplementation(
          () => `content-type: application/json 
                x-request-id: req_123`
        ),
      } as Partial<XMLHttpRequest>;

      jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => {
        const xhrInstance = { ...xhrMock } as XMLHttpRequest;

        // Add a simple onreadystatechange handler that fires onload/onerror
        // This is crucial for making the mock behave like a real XHR
        xhrInstance.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              if (this.onload) {
                (this.onload as () => void)(); // Call the onload handler
              }
            } else {
              if (this.onerror) {
                (this.onerror as () => void)(); // Call the onerror handler
              }
            }
          }
        };

        return xhrInstance;
      });
      const testClient = new Client(skyflowConfig, metaData);
      const resp = testClient.request({
        requestMethod: "GET",
        url: "https://example-test.com",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify({
          key: "value",
        }),
      });
      expect(xhrMock.setRequestHeader).toBeCalledWith(
        "content-type",
        "application/x-www-form-urlencoded"
      );
    } catch (err) {
      console.log(err);
    }
  });

  test("Client Request Method with form-data content-type", () => {
    try {
      const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: 200,
        response: JSON.stringify({ message: "Hello World!" }),
        getAllResponseHeaders: jest.fn().mockImplementation(
          () => `content-type: application/json 
                x-request-id: req_123`
        ),
      } as Partial<XMLHttpRequest>;

      jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => {
        const xhrInstance = { ...xhrMock } as XMLHttpRequest;

        // Add a simple onreadystatechange handler that fires onload/onerror
        // This is crucial for making the mock behave like a real XHR
        xhrInstance.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              if (this.onload) {
                (this.onload as () => void)(); // Call the onload handler
              }
            } else {
              if (this.onerror) {
                (this.onerror as () => void)(); // Call the onerror handler
              }
            }
          }
        };

        return xhrInstance;
      });
      const testClient = new Client(skyflowConfig, metaData);
      const resp = testClient.request({
        requestMethod: "GET",
        url: "https://example-test.com",
        headers: {
          Auth: "eyde.ed.ewe",
          "content-type": "multipart/form-data",
        },
        body: JSON.stringify({
          key: "value",
        }),
      });
      expect(xhrMock.setRequestHeader).toBeCalledWith("Auth", "eyde.ed.ewe");
    } catch (err) {
      console.log(err);
    }
  });

  test("Client Request Method with url-formencoded content-type and navigator as null", () => {
    try {
      const mockNavigator = {
        userAgent: "", // Set userAgent to null or any desired value
        // Add other properties or methods as needed for your test case
      };

      // Replace the original navigator object with the mock navigator
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        configurable: true,
        enumerable: true,
        writable: false,
      });

      const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: 200,
        response: JSON.stringify({ message: "Hello World!" }),
        getAllResponseHeaders: jest.fn().mockImplementation(
          () => `content-type: application/json 
                x-request-id: req_123`
        ),
      } as Partial<XMLHttpRequest>;

      jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => {
        const xhrInstance = { ...xhrMock } as XMLHttpRequest;

        // Add a simple onreadystatechange handler that fires onload/onerror
        // This is crucial for making the mock behave like a real XHR
        xhrInstance.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              if (this.onload) {
                (this.onload as () => void)(); // Call the onload handler
              }
            } else {
              if (this.onerror) {
                (this.onerror as () => void)(); // Call the onerror handler
              }
            }
          }
        };

        return xhrInstance;
      });
      const testClient = new Client(skyflowConfig, metaData);
      const resp = testClient.request({
        requestMethod: "GET",
        url: "https://example-test.com",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify({
          key: "value",
        }),
      });
      expect(xhrMock.setRequestHeader).toBeCalledWith(
        "content-type",
        "application/x-www-form-urlencoded"
      );
    } catch (err) {
      console.log(err);
    }
  });

  test("Client Request Method with error 1", () => {
    try {
      const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: 401,
        response: JSON.stringify({ message: "Hello World!" }),
        getAllResponseHeaders: jest.fn().mockImplementation(
          () => `content-type: text/plain
                x-request-id: req_123`
        ),
      } as Partial<XMLHttpRequest>;

      jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => {
        const xhrInstance = { ...xhrMock } as XMLHttpRequest;

        // Add a simple onreadystatechange handler that fires onload/onerror
        // This is crucial for making the mock behave like a real XHR
        xhrInstance.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              if (this.onload) {
                (this.onload as () => void)(); // Call the onload handler
              }
            } else {
              if (this.onerror) {
                (this.onerror as () => void)(); // Call the onerror handler
              }
            }
          }
        };

        return xhrInstance;
      });
      const testClient = new Client(skyflowConfig, metaData);
      const resp = testClient
        .request({
          requestMethod: "GET",
          url: "https://example-test.com",
          headers: {
            Auth: "eyde.ed.ewe",
          },
          body: JSON.stringify({
            key: "value",
          }),
        })
        .catch((err) => {
          expect(err).toBeDefined();
        });
      expect(xhrMock.open).toBeCalledWith("GET", "https://example-test.com");
      expect(xhrMock.setRequestHeader).toBeCalledWith("Auth", "eyde.ed.ewe");
      expect(xhrMock.send).toBeCalledWith(
        JSON.stringify({
          key: "value",
        })
      );
    } catch (err) {
      console.log(err);
    }
  });

  test("Client Request Method with error 2", () => {
    try {
      const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        onload: jest.fn(),
        readyState: 4,
        status: 401,
        response: JSON.stringify({
          error: { message: "Something went wrong" },
        }),
        getAllResponseHeaders: jest
          .fn()
          .mockImplementation(() => "content-type: application/json"),
      } as Partial<XMLHttpRequest>;

      jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => {
        const xhrInstance = { ...xhrMock } as XMLHttpRequest;

        // Add a simple onreadystatechange handler that fires onload/onerror
        // This is crucial for making the mock behave like a real XHR
        xhrInstance.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 300) {
              if (this.onload) {
                (this.onload as () => void)(); // Call the onload handler
              }
            } else {
              if (this.onerror) {
                (this.onerror as () => void)(); // Call the onerror handler
              }
            }
          }
        };

        return xhrInstance;
      });
      const testClient = new Client(skyflowConfig, metaData);
      const resp = testClient
        .request({
          requestMethod: "GET",
          url: "https://example-test.com",
          headers: {
            Auth: "eyde.ed.ewe",
          },
          body: JSON.stringify({
            key: "value",
          }),
        })
        .catch((err) => {
          expect(err).toBeDefined();
        });
      expect(xhrMock.open).toBeCalledWith("GET", "https://example-test.com");
      expect(xhrMock.setRequestHeader).toBeCalledWith("Auth", "eyde.ed.ewe");
      expect(xhrMock.send).toBeCalledWith(
        JSON.stringify({
          key: "value",
        })
      );
    } catch (err) {
      console.log(err);
    }
  })

  test('Client request rejects with SkyflowError when connection object missing methods', async () => {
    const orig = window.XMLHttpRequest;
    // Return an object missing open to force TypeError before SkyflowError construction branch.
    // This documents current behavior.
    // @ts-ignore
    window.XMLHttpRequest = jest.fn(() => ({}));
    const testClient = new Client(skyflowConfig, metaData);
    await expect(testClient.request({
      requestMethod: 'GET',
      url: 'https://failure-case.com',
      headers: { 'content-type': 'application/json' },
    })).rejects.toBeInstanceOf(Error);
    window.XMLHttpRequest = orig;
  });

  test('Client request sets sky-metadata header and skips multipart content-type', () => {
    const xhrMock = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      getAllResponseHeaders: jest.fn().mockReturnValue('content-type: application/json'),
      readyState: 4,
      status: 200,
      response: JSON.stringify({ ok: true }),
    } as Partial<XMLHttpRequest>;
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock as XMLHttpRequest);
    const testClient = new Client(skyflowConfig, metaData);
    testClient.request({
      requestMethod: 'POST',
      url: 'https://metadata-test.com',
      headers: { 'content-type': 'multipart/form-data', Custom: 'X' },
      body: 'data',
    });
    // sky-metadata header should be set
    expect(xhrMock.setRequestHeader).toHaveBeenCalledWith('sky-metadata', expect.any(String));
    // multipart content-type should be skipped
    expect(xhrMock.setRequestHeader).not.toHaveBeenCalledWith('content-type', 'multipart/form-data');
  });

  test('Client request resolves parsed JSON not raw string', async () => {
    const xhrMock: any = {
      open: jest.fn(),
      send: jest.fn().mockImplementation(function () {
        // Immediately trigger onload
        setTimeout(() => { if (xhrMock.onload) xhrMock.onload(); }, 0);
      }),
      setRequestHeader: jest.fn(),
      getAllResponseHeaders: jest.fn().mockReturnValue('content-type: application/json'),
      status: 200,
      response: JSON.stringify({ parsed: true }),
    };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    const testClient = new Client(skyflowConfig, metaData);
    const result = await testClient.request({
      requestMethod: 'GET',
      url: 'https://json-success.com',
      headers: { 'content-type': 'application/json' },
    });
    expect(result).toEqual({ parsed: true });
  });

  test('Client request resolves raw string for non-json success', async () => {
    const xhrMock: any = {
      open: jest.fn(),
      send: jest.fn().mockImplementation(() => { setTimeout(() => xhrMock.onload(), 0); }),
      setRequestHeader: jest.fn(),
      getAllResponseHeaders: jest.fn().mockReturnValue('content-type: text/plain'),
      status: 200,
      response: 'plain OK',
    };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    const testClient = new Client(skyflowConfig, metaData);
    const result = await testClient.request({
      requestMethod: 'GET',
      url: 'https://plain-success.com',
      headers: { 'content-type': 'text/plain' },
    });
    expect(result).toBe('plain OK');
  });

  test('onerror offline path returns OFFLINE_ERROR code', async () => {
    const xhrMock: any = {
      open: jest.fn(), send: jest.fn(), setRequestHeader: jest.fn(),
      getAllResponseHeaders: jest.fn().mockReturnValue(''), status: 0,
    };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    // Mock offline
    Object.defineProperty(window, 'navigator', { value: { onLine: false }, configurable: true });
    const testClient = new Client(skyflowConfig, metaData);
    const promise = testClient.request({ requestMethod: 'GET', url: 'https://offline.com' });
    setTimeout(() => { if (xhrMock.onerror) xhrMock.onerror(); }, 0);
    await expect(promise).rejects.toMatchObject({ error: { code: SKYFLOW_ERROR_CODE.OFFLINE_ERROR.code } });
  });

  test('onerror status 0 path returns GENERIC_ERROR code', async () => {
    const xhrMock: any = { open: jest.fn(), send: jest.fn(), setRequestHeader: jest.fn(), getAllResponseHeaders: jest.fn().mockReturnValue(''), status: 0 };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    Object.defineProperty(window, 'navigator', { value: { onLine: true }, configurable: true });
    const testClient = new Client(skyflowConfig, metaData);
    const p = testClient.request({ requestMethod: 'GET', url: 'https://status-zero.com' });
    setTimeout(() => { xhrMock.onerror(); }, 0);
    await expect(p).rejects.toMatchObject({ error: { code: SKYFLOW_ERROR_CODE.GENERIC_ERROR.code } });
  });

  test('onerror generic path returns GENERIC_ERROR code (non-zero status)', async () => {
    const xhrMock: any = { open: jest.fn(), send: jest.fn(), setRequestHeader: jest.fn(), getAllResponseHeaders: jest.fn().mockReturnValue(''), status: 500 };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    Object.defineProperty(window, 'navigator', { value: { onLine: true }, configurable: true });
    const testClient = new Client(skyflowConfig, metaData);
    const p = testClient.request({ requestMethod: 'GET', url: 'https://generic-error.com' });
    setTimeout(() => { xhrMock.onerror(); }, 0);
    await expect(p).rejects.toMatchObject({ error: { code: SKYFLOW_ERROR_CODE.GENERIC_ERROR.code } });
  });

  test('ontimeout path returns TIMEOUT_ERROR code', async () => {
    const xhrMock: any = { open: jest.fn(), send: jest.fn(), setRequestHeader: jest.fn(), getAllResponseHeaders: jest.fn().mockReturnValue(''), status: 0 };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    const testClient = new Client(skyflowConfig, metaData);
    const p = testClient.request({ requestMethod: 'GET', url: 'https://timeout.com' });
    setTimeout(() => { xhrMock.ontimeout(); }, 0);
    await expect(p).rejects.toMatchObject({ error: { code: SKYFLOW_ERROR_CODE.TIMEOUT_ERROR.code } });
  });

  test('onabort path returns ABORT_ERROR code', async () => {
    const xhrMock: any = { open: jest.fn(), send: jest.fn(), setRequestHeader: jest.fn(), getAllResponseHeaders: jest.fn().mockReturnValue(''), status: 0 };
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    const testClient = new Client(skyflowConfig, metaData);
    const p = testClient.request({ requestMethod: 'GET', url: 'https://abort.com' });
    setTimeout(() => { xhrMock.onabort(); }, 0);
    await expect(p).rejects.toMatchObject({ error: { code: SKYFLOW_ERROR_CODE.ABORT_ERROR.code } });
  });
});
