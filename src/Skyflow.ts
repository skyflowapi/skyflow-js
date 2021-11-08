import bus from 'framebus';
import uuid from './libs/uuid';
import {
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
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
import { printLog } from './utils/logsHelper';
import SkyflowError from './libs/SkyflowError';
import logs from './utils/logs';
import SKYFLOW_ERROR_CODE from './utils/constants';
import {
  IRevealResponseType,
  IConnectionConfig,
  RequestMethod,
  IInsertRecordInput,
  IDetokenizeInput,
  IGetByIdInput,
  RedactionType,
  EventName,
  Env,
  LogLevel,
  MessageType,
} from './utils/common';

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

  #logLevel:LogLevel;

  #env:Env;

  constructor(config: ISkyflow) {
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata,
    );
    this.#logLevel = config?.options?.logLevel || LogLevel.ERROR;
    this.#env = config?.options?.env || Env.PROD;
    this.#pureJsController = new PureJsController(this.#client,
      { logLevel: this.#logLevel, env: this.#env });

    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN, (data, callback) => {
        printLog(logs.infoLogs.CAPTURED_BEARER_TOKEN_EVENT, MessageType.LOG,
          this.#logLevel);
        if (
          this.#client.config.getBearerToken
          && (!this.#bearerToken || !isTokenValid(this.#bearerToken))
        ) {
          this.#client.config
            .getBearerToken()
            .then((bearerToken) => {
              printLog(logs.infoLogs.BEARER_TOKEN_RESOLVED, MessageType.LOG,
                this.#logLevel);
              this.#bearerToken = bearerToken;
              callback({ authToken: this.#bearerToken });
            })
            .catch((err) => {
              printLog(logs.errorLogs.BEARER_TOKEN_REJECTED, MessageType.ERROR,
                this.#logLevel);
              callback({ error: err });
            });
        } else {
          printLog(logs.infoLogs.REUSE_BEARER_TOKEN, MessageType.LOG,
            this.#logLevel);
          callback({ authToken: this.#bearerToken });
        }
      });
    printLog(logs.infoLogs.BEARER_TOKEN_LISTENER, MessageType.LOG,
      this.#logLevel);
    printLog(this.#env, MessageType.LOG, this.#logLevel);
  }

  static init(config: ISkyflow): Skyflow {
    const logLevel = config?.options?.logLevel || LogLevel.ERROR;
    printLog(logs.infoLogs.INITIALIZE_CLIENT, MessageType.LOG,
      logLevel);
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
    printLog(logs.infoLogs.CLIENT_INITIALIZED, MessageType.LOG, logLevel);
    return skyflow;
  }

  container(type: ContainerType, options?: Record<string, any>) {
    switch (type) {
      case ContainerType.COLLECT: {
        const collectContainer = new CollectContainer(options, {
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        },
        { logLevel: this.#logLevel, env: this.#env });
        printLog(logs.infoLogs.COLLECT_CONTAINER_CREATED, MessageType.LOG,
          this.#logLevel);
        return collectContainer;
      }
      case ContainerType.REVEAL: {
        const revealContainer = new RevealContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        },
        { logLevel: this.#logLevel });
        printLog(logs.infoLogs.REVEAL_CONTAINER_CREATED, MessageType.LOG,
          this.#logLevel);
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
    printLog(logs.infoLogs.INSERT_TRIGGERED, MessageType.LOG,
      this.#logLevel);
    return this.#pureJsController.insert(records, options);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<IRevealResponseType> {
    printLog(logs.infoLogs.DETOKENIZE_TRIGGERED,
      MessageType.LOG, this.#logLevel);
    return this.#pureJsController.detokenize(detokenizeInput);
  }

  getById(getByIdInput: IGetByIdInput) {
    printLog(logs.infoLogs.GET_BY_ID_TRIGGERED,
      MessageType.LOG, this.#logLevel);
    return this.#pureJsController.getById(getByIdInput);
  }

  invokeConnection(config: IConnectionConfig) {
    printLog(logs.infoLogs.INVOKE_CONNECTION_TRIGGERED,
      MessageType.LOG, this.#logLevel);

    return this.#pureJsController.invokeConnection(config);
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

  static get EventName() {
    return EventName;
  }

  static get Env() {
    return Env;
  }
}
export default Skyflow;
