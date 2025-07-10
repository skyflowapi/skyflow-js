/*
Copyright (c) 2025 Skyflow, Inc.
*/
import assert from "assert";
import Client, { IClientRequest } from "../src/client";
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
  });
});
