import { ISkyflow } from "../Skyflow";
import { isTokenValid } from "../utils/jwtUtils";

export interface IClientRequest {
  body?: Record<string, any>;
  headers?: Record<string, string>;
  requestMethod:
    | "GET"
    | "HEAD"
    | "POST"
    | "PUT"
    | "DELETE"
    | "CONNECT"
    | "OPTIONS"
    | "PATCH";
  url: string;
}

class Client {
  config: ISkyflow;
  accessToken: string;
  #metaData: any;
  constructor(config: ISkyflow, metadata) {
    this.config = config;
    this.#metaData = metadata;
    this.accessToken = "";
  }

  toJSON() {
    return {
      config: this.config,
      metaData: this.#metaData,
    };
  }

  static fromJSON(json) {
    return new Client(json.config, json.metadata);
  }

  request = (request: IClientRequest) => {
    // todo: link has to be https
    return new Promise(async (resolve, reject) => {
      const httpRequest = new XMLHttpRequest();
      if (!httpRequest) {
        reject("Error while initializing the connection");
        return;
      }

      httpRequest.open(request.requestMethod, request.url);

      try {
        if (
          this.config.getBearerToken &&
          (!this.accessToken || !isTokenValid(this.accessToken))
        ) {
          this.accessToken = await this.config.getBearerToken();
        }
      } catch (err) {
        reject(err);
        return;
      }
      !request.headers?.Authorization &&
        httpRequest.setRequestHeader(
          "Authorization",
          "Bearer " + this.accessToken
        );
      httpRequest.setRequestHeader(
        "Content-Type",
        "application/json; charset=utf-8"
      );

      if (request.headers) {
        const headers = request.headers;
        Object.keys(request.headers).forEach((key) => {
          httpRequest.setRequestHeader(key, headers[key]);
        });
      }

      // httpRequest.responseType = "json";

      httpRequest.send(JSON.stringify({ ...request.body }));

      httpRequest.onload = () => {
        const responseHeaders = httpRequest.getAllResponseHeaders();
        const headersList = responseHeaders.trim().split(/[\r\n]+/);
        const headerMap = {};
        headersList.forEach((line) => {
          const parts = line.split(": ");
          const header = parts.shift() || "";
          const value = parts.join(": ");
          headerMap[header] = value;
        });
        const contentType = headerMap["content-type"];
        if (httpRequest.status < 200 || httpRequest.status >= 400) {
          if (contentType === "application/json")
            reject(JSON.parse(httpRequest.response));
          else if (contentType === "text/plain") {
            const error = {
              http_code: httpRequest.status,
              message: httpRequest.response,
            };
            reject({ error });
          } else {
            const error = {
              http_code: httpRequest.status,
              message: "Error occurred",
            };
            reject({ error });
          }
        }
        if (contentType === "application/json") {
          resolve(JSON.parse(httpRequest.response));
        } else {
          resolve(httpRequest.response);
        }
      };

      httpRequest.onerror = (error) => {
        reject("An error occurred during transaction");
      };
    });
  };
}

export default Client;
