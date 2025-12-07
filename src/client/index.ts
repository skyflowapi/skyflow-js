/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { ContentType, SKY_METADATA_HEADER } from '../core/constants';
import SkyflowError from '../libs/skyflow-error';
import { ISkyflow } from '../skyflow';
import SKYFLOW_ERROR_CODE from '../utils/constants';
import logs from '../utils/logs';
import sdkDetails from '../../package.json';
import {
  getMetaObject,
} from '../utils/helpers';
import { ClientMetadata } from '../core/internal/internal-types';
import { ErrorType } from '../index-node';

export interface IClientRequest {
  body?: Document | XMLHttpRequestBodyInit | null;
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

export interface SdkInfo {
  sdkName: string;
  sdkVersion: string;
}

export interface ClientToJSON {
  config: ISkyflow;
  metaData: ClientMetadata;
}

class Client {
  config: ISkyflow;

  #metaData: ClientMetadata;

  errorMessagesList: Partial<Record<ErrorType, string>> = {};

  constructor(config: ISkyflow, metadata: ClientMetadata) {
    this.config = config;
    this.#metaData = metadata;
  }

  setErrorMessages(messages: Record<ErrorType, string>) {
    this.errorMessagesList = {
      ...messages,
    };
  }

  toJSON(): ClientToJSON {
    return {
      config: this.config,
      metaData: this.#metaData,
    };
  }

  static fromJSON(json: ClientToJSON) {
    return new Client(json.config, json.metaData);
  }

  request = (request: IClientRequest) => new Promise((resolve, reject) => {
    const httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      reject(new SkyflowError(SKYFLOW_ERROR_CODE.CONNECTION_ERROR, [], true));
      return;
    }

    httpRequest.open(request.requestMethod, request.url);

    if (request.headers) {
      const metaDataObject = getMetaObject(sdkDetails, this.#metaData, navigator);
      request.headers[SKY_METADATA_HEADER] = JSON.stringify(metaDataObject);
      const headers = request.headers;
      Object.keys(request.headers).forEach((key) => {
        if (!(key === 'content-type' && headers[key] && headers[key].includes(ContentType.FORMDATA))) {
          httpRequest.setRequestHeader(key, headers[key]);
        }
      });
    }

    if (request.headers?.['content-type']?.includes(ContentType.FORMURLENCODED)
      || request.headers?.['content-type']?.includes(ContentType.FORMDATA)) {
      httpRequest.send(request.body);
    } else {
      /* Earlier we were stringifying here, but due to TS, we're stringifying
        at the point where we are creating the request. Since the body parameter
        doesn't accept JSON object.
      */
      httpRequest.send(request.body);
    }

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
      const requestId = headerMap['x-request-id'];
      if (httpRequest.status < 200 || httpRequest.status >= 400) {
        if (contentType && contentType.includes('application/json')) {
          let description = JSON.parse(httpRequest.response);
          if (description?.error?.message) {
            description = requestId ? `${description?.error?.message} - requestId: ${requestId}` : description?.error?.message;
          }
          reject(new SkyflowError({
            code: httpRequest.status,
            description,
          }, [], true));
        } else if (contentType && contentType.includes('text/plain')) {
          reject(new SkyflowError({
            code: httpRequest.status,
            description: requestId ? `${httpRequest.response} - requestId: ${requestId}` : httpRequest.response,
          }, [], true));
        } else {
          reject(new SkyflowError({
            code: httpRequest.status,
            description: requestId ? `${logs.errorLogs.ERROR_OCCURED} - requestId: ${requestId}` : logs.errorLogs.ERROR_OCCURED,
          }, [], true));
        }
      }
      if (contentType && contentType.includes('application/json')) {
        resolve(JSON.parse(httpRequest.response));
      }
      resolve(httpRequest.response);
    };

    httpRequest.onerror = () => {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        reject(new SkyflowError({
          code: httpRequest.status,
          description: this.errorMessagesList.OFFLINE
             ?? SKYFLOW_ERROR_CODE.OFFLINE_ERROR.description,
        }, [], true));
        return;
      }
      if (httpRequest.status === 0) {
        reject(new SkyflowError({
          code: httpRequest.status,
          description: this.errorMessagesList.NETWORK_GENERIC
             ?? SKYFLOW_ERROR_CODE.GENERIC_ERROR.description,
        }, [], true));
        return;
      }
      reject(new SkyflowError({
        code: httpRequest.status,
        description: this.errorMessagesList.NETWORK_GENERIC
             ?? SKYFLOW_ERROR_CODE.GENERIC_ERROR.description,
      }, [], true));
    };

    httpRequest.ontimeout = () => {
      reject(new SkyflowError({
        code: httpRequest.status,
        description: this.errorMessagesList.TIMEOUT
             ?? SKYFLOW_ERROR_CODE.TIMEOUT_ERROR.description,
      }, [], true));
    };

    httpRequest.onabort = () => {
      reject(new SkyflowError({
        code: httpRequest.status,
        description: this.errorMessagesList.ABORT
             ?? SKYFLOW_ERROR_CODE.ABORT_ERROR.description,
      }, [], true));
    };
  });
}

export default Client;
