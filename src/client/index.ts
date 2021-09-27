import { ISkyflow } from '../Skyflow';
import isTokenValid from '../utils/jwtUtils';

export interface IClientRequest {
  body?: Record<string, any>;
  headers?: Record<string, string>;
  requestMethod:
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'PATCH';
  url: string;
}

class Client {
  config: ISkyflow;

  accessToken: string;

  #metaData: any;

  constructor(config: ISkyflow, metadata) {
    this.config = config;
    this.#metaData = metadata;
    this.accessToken = '';
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

  request = (request: IClientRequest) => new Promise((resolve, reject) => {
    const httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      reject(new Error('Error while initializing the connection'));
      return;
    }

    httpRequest.open(request.requestMethod, request.url);

    const sendRequest = () => {
      if (!request.headers?.Authorization) {
        httpRequest.setRequestHeader(
          'Authorization',
          `Bearer ${this.accessToken}`,
        );
      }
      httpRequest.setRequestHeader(
        'Content-Type',
        'application/json; charset=utf-8',
      );

      if (request.headers) {
        const { headers } = request;
        Object.keys(request.headers).forEach((key) => {
          httpRequest.setRequestHeader(key, headers[key]);
        });
      }

      httpRequest.send(JSON.stringify({ ...request.body }));
    };

    if (this.config.getBearerToken
        && (!this.accessToken || !isTokenValid(this.accessToken))
    ) {
      this.config.getBearerToken().then((token: string) => {
        this.accessToken = token;
        sendRequest();
      }).catch((err) => reject(err));
    } else {
      sendRequest();
    }

    // httpRequest.responseType = "json";

    httpRequest.onload = () => {
      const responseHeaders = httpRequest.getAllResponseHeaders();
      const headersList = responseHeaders.trim().split(/[\r\n]+/);
      const headerMap = {};
      headersList.forEach((line) => {
        const parts = line.split(': ');
        const header = parts.shift() || '';
        const value = parts.join(': ');
        headerMap[header] = value;
      });
      const contentType = headerMap['content-type'];
      if (httpRequest.status < 200 || httpRequest.status >= 400) {
        if (contentType === 'application/json') {
          reject(JSON.parse(httpRequest.response));
        } else if (contentType === 'text/plain') {
          const error = {
            http_code: httpRequest.status,
            message: httpRequest.response,
          };
          reject({ error });
        } else {
          const error = {
            http_code: httpRequest.status,
            message: 'Error occurred',
          };
          reject({ error });
        }
      }
      if (contentType === 'application/json') {
        resolve(JSON.parse(httpRequest.response));
      }
      resolve(httpRequest.response);
    };

    httpRequest.onerror = () => {
      reject(new Error('An error occurred during transaction'));
    };
  });
}

export default Client;
