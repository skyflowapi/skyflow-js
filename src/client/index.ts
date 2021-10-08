import { ISkyflow } from '../Skyflow';
import logs from '../utils/logs';

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

  #metaData: any;

  constructor(config: ISkyflow, metadata) {
    this.config = config;
    this.#metaData = metadata;
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
      reject(new Error(logs.errorLogs.CONNECTION_ERROR));
      return;
    }

    httpRequest.open(request.requestMethod, request.url);

    if (request.headers) {
      const { headers } = request;
      Object.keys(request.headers).forEach((key) => {
        httpRequest.setRequestHeader(key, headers[key]);
      });
    }

    httpRequest.send(JSON.stringify({ ...request.body }));

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
        if (contentType.includes('application/json')) {
          reject(JSON.parse(httpRequest.response));
        } else if (contentType.includes('text/plain')) {
          const error = {
            http_code: httpRequest.status,
            message: httpRequest.response,
          };
          reject({ error });
        } else {
          const error = {
            http_code: httpRequest.status,
            message: logs.errorLogs.ERROR_OCCURED,
          };
          reject({ error });
        }
      }
      if (contentType.includes('application/json')) {
        resolve(JSON.parse(httpRequest.response));
      }
      resolve(httpRequest.response);
    };

    httpRequest.onerror = () => {
      reject(new Error(logs.errorLogs.TRANSACTION_ERROR));
    };
  });
}

export default Client;
