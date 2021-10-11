import bus from 'framebus';
import uuid from './libs/uuid';
import {
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
  LogLevel,
  MessageType,
} from './container/constants';
import Client from './client';
import CollectContainer from './container/external/CollectContainer';
import RevealContainer from './container/external/RevealContainer';
import {
  isValidURL,
} from './utils/validators';
import properties from './properties';
import isTokenValid from './utils/jwtUtils';
import PureJsController from './container/external/PureJsController';
import { LogLevelOptions, printLog } from './utils/logsHelper';
import SkyflowError from './libs/SkyflowError';
import logs from './utils/logs';
import SKYFLOW_ERROR_CODE from './utils/constants';

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

export interface Context{
  logLevel:LogLevel
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface IGatewayConfig {
  gatewayURL: string;
  methodName: RequestMethod;
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

  #bearerToken: string = '';

  #options: any;

  #showErrorLogs: boolean;

  #showInfoLogs: boolean;

  #logLevel:LogLevel;

  constructor(config: ISkyflow) {
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata,
    );
    this.#logLevel = config?.options?.logLevel || LogLevel.PROD;
    this.#pureJsController = new PureJsController(this.#client, { logLevel: this.#logLevel });

    const { showInfoLogs, showErrorLogs } = LogLevelOptions[this.#logLevel];

    this.#showInfoLogs = showInfoLogs;
    this.#showErrorLogs = showErrorLogs;

    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN, (data, callback) => {
        printLog(logs.infoLogs.CAPTURED_BEARER_TOKEN_EVENT, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);
        if (
          this.#client.config.getBearerToken
          && (!this.#bearerToken || !isTokenValid(this.#bearerToken))
        ) {
          this.#client.config
            .getBearerToken()
            .then((bearerToken) => {
              printLog(logs.infoLogs.BEARER_TOKEN_RESOLVED, MessageType.INFO,
                this.#showErrorLogs, this.#showInfoLogs);
              this.#bearerToken = bearerToken;
              callback({ authToken: this.#bearerToken });
            })
            .catch((err) => {
              printLog(logs.errorLogs.BEARER_TOKEN_REJECTED, MessageType.ERROR,
                this.#showErrorLogs, this.#showInfoLogs);
              callback({ error: err });
            });
        } else {
          printLog(logs.infoLogs.REUSE_BEARER_TOKEN, MessageType.INFO,
            this.#showErrorLogs, this.#showInfoLogs);
          callback({ authToken: this.#bearerToken });
        }
      });
    printLog(logs.infoLogs.BEARER_TOKEN_LISTENER, MessageType.INFO,
      this.#showErrorLogs, this.#showInfoLogs);
  }

  static init(config: ISkyflow): Skyflow {
    const {
      showInfoLogs,
      showErrorLogs,
    } = LogLevelOptions[config?.options?.logLevel || LogLevel.PROD];
    printLog(logs.infoLogs.INITIALIZE_CLIENT, MessageType.INFO, showErrorLogs, showInfoLogs);
    if (
      !config
      || !config.vaultID
      || !isValidURL(config.vaultURL)
      || !config.getBearerToken
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CREDENTIALS, [], true);
    }
    const tempConfig = config;
    tempConfig.vaultURL = config.vaultURL.slice(-1) === '/'
      ? config.vaultURL.slice(0, -1)
      : config.vaultURL;
    const skyflow = new Skyflow(tempConfig);
    printLog(logs.infoLogs.CLIENT_INITIALIZED, MessageType.INFO, showErrorLogs, showInfoLogs);
    return skyflow;
  }

  container(type: ContainerType, options?: Record<string, any>) {
    switch (type) {
      case ContainerType.COLLECT: {
        const collectContainer = new CollectContainer(options, {
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        },
        { logLevel: this.#logLevel });
        printLog(logs.infoLogs.COLLECT_CONTAINER_CREATED, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);
        return collectContainer;
      }
      case ContainerType.REVEAL: {
        const revealContainer = new RevealContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        },
        { logLevel: this.#logLevel });
        printLog(logs.infoLogs.REVEAL_CONTAINER_CREATED, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);
        return revealContainer;
      }
      default:
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONTAINER_TYPE, [], true);
    }
  }

  insert(
    records: IInsertRecordInput,
    options: Record<string, any> = { tokens: true },
  ) {
    printLog(logs.infoLogs.INSERT_TRIGGERED, MessageType.INFO,
      this.#showErrorLogs, this.#showInfoLogs);
    return this.#pureJsController.insert(records, options);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<IRevealResponseType> {
    printLog(logs.infoLogs.DETOKENIZE_TRIGGERED,
      MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
    return this.#pureJsController.detokenize(detokenizeInput);
  }

  getById(getByIdInput: IGetByIdInput) {
    printLog(logs.infoLogs.GET_BY_ID_TRIGGERED,
      MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
    return this.#pureJsController.getById(getByIdInput);
  }

  invokeGateway(config: IGatewayConfig) {
    printLog(logs.infoLogs.INVOKE_GATEWAY_TRIGGERED,
      MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);

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

  static get LogLevel() {
    return LogLevel;
  }
}
export default Skyflow;
