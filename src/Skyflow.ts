import bus from 'framebus';
import Client from './client';
import CollectContainer from './container/external/CollectContainer';
import RevealContainer from './container/external/RevealContainer';
import uuid from './libs/uuid';
import { ElementType, ELEMENT_EVENTS_TO_IFRAME } from './container/constants';
import {
  validateInsertRecords,
  validateDetokenizeInput,
  validateGetByIdInput,
  isValidURL,
} from './utils/validators';
import PureJsController from './container/external/PureJsController';
import properties from './properties';
import isTokenValid from './utils/jwtUtils';

export interface IInsertRecord {
  table: string;
  fields: Record<string, any>;
}

export interface IInsertRecordInput {
  records: IInsertRecord[];
}

export enum ContainerType {
  COLLECT = 'COLLECT',
  REVEAL = 'REVEAL',
}
export interface ISkyflow {
  vaultID: string;
  vaultURL: string;
  getBearerToken: () => Promise<string>;
  options?: Record<string, any>;
}

export enum RedactionType {
  DEFAULT = 'DEFAULT',
  PLAIN_TEXT = 'PLAIN_TEXT',
  MASKED = 'MASKED',
  REDACTED = 'REDACTED',
}
export interface IRevealRecord {
  token: string;
  redaction: RedactionType;
}
export interface IRevealResponseType {
  records?: Record<string, string>[];
  errors?: Record<string, any>[];
}
export interface IDetokenizeInput {
  records: IRevealRecord[];
}

export interface ISkyflowIdRecord {
  ids: string[];
  redaction: RedactionType;
  table: string;
}

export interface IGetByIdInput {
  records: ISkyflowIdRecord[];
}

export enum RequestMethod{
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface IGatewayConfig {
  gatewayURL: string;
  methodName:RequestMethod;
  pathParams?: any;
  queryParams?: any;
  requestBody?: any;
  requestHeader?: any;
  responseBody?: any;
}

class Skyflow {
  #client: Client;

  #uuid: string = uuid();

  #metadata = {
    uuid: this.#uuid,
    clientDomain: window.location.origin,
  };

  #pureJsController: PureJsController;

  #bearerToken:string = '';

  constructor(config: ISkyflow) {
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata,
    );
    this.#pureJsController = new PureJsController(this.#client);
    bus.target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN,
        (data, callback) => {
          if (this.#client.config.getBearerToken
        && (!this.#bearerToken || !isTokenValid(this.#bearerToken))
          ) {
            this.#client.config.getBearerToken().then((bearerToken) => {
              this.#bearerToken = bearerToken;
              callback({ authToken: this.#bearerToken });
            }).catch((err) => {
              callback({ error: err });
            });
          } else {
            callback({ authToken: this.#bearerToken });
          }
        });
  }

  static init(config: ISkyflow): Skyflow {
    if (
      !config
      || !config.vaultID
      || !isValidURL(config.vaultURL)
      || !config.getBearerToken
    ) {
      throw new Error('Invalid client credentials');
    }

    const tempConfig = config;
    tempConfig.vaultURL = config.vaultURL.slice(-1) === '/'
      ? config.vaultURL.slice(0, -1)
      : config.vaultURL;

    return new Skyflow(tempConfig);
  }

  container(type: ContainerType, options?: Record<string, any>) {
    switch (type) {
      case ContainerType.COLLECT:
        return new CollectContainer(options, {
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        });
      case ContainerType.REVEAL:
        return new RevealContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        });
      default:
        throw new Error('Invalid container type');
    }
  }

  insert(
    records: IInsertRecordInput,
    options: Record<string, any> = { tokens: true },
  ) {
    validateInsertRecords(records);
    return this.#pureJsController.insert(records, options);
  }

  detokenize(
    detokenizeInput: IDetokenizeInput,
  ): Promise<IRevealResponseType> {
    validateDetokenizeInput(detokenizeInput);
    return this.#pureJsController.detokenize(detokenizeInput.records);
  }

  getById(getByIdInput: IGetByIdInput) {
    validateGetByIdInput(getByIdInput);
    return this.#pureJsController.getById(getByIdInput.records);
  }

  invokeGateway(config: IGatewayConfig) {
    return this.#pureJsController.invokeGateway(config);
  }

  static get ContainerType() {
    return ContainerType;
  }

  static get ElementType() {
    return ElementType;
  }

  static get RedactionType() {
    return RedactionType;
  }

  static get RequestMethod() {
    return RequestMethod;
  }
}
export default Skyflow;
