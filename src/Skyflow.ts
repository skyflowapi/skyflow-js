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
  validateInitConfig,
} from './utils/validators';
import properties from './properties';
import isTokenValid from './utils/jwtUtils';
import PureJsController from './container/external/PureJsController';
import { parameterizedString, printLog } from './utils/logsHelper';
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
  ValidationRuleType,
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
const CLASS_NAME = 'Skyflow';
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
        printLog(parameterizedString(logs.infoLogs.CAPTURED_BEARER_TOKEN_EVENT, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        if (
          this.#client.config.getBearerToken
          && (!this.#bearerToken || !isTokenValid(this.#bearerToken))
        ) {
          this.#client.config
            .getBearerToken()
            .then((bearerToken) => {
              printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
                MessageType.LOG,
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
          printLog(parameterizedString(logs.infoLogs.REUSE_BEARER_TOKEN, CLASS_NAME),
            MessageType.LOG,
            this.#logLevel);
          callback({ authToken: this.#bearerToken });
        }
      });
    printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_LISTENER, CLASS_NAME), MessageType.LOG,
      this.#logLevel);
    printLog(parameterizedString(logs.infoLogs.CURRENT_ENV, CLASS_NAME, this.#env),
      MessageType.LOG, this.#logLevel);
    printLog(parameterizedString(logs.infoLogs.CURRENT_ENV, CLASS_NAME, this.#logLevel),
      MessageType.LOG, this.#logLevel);
  }

  static init(config: ISkyflow): Skyflow {
    const logLevel = config?.options?.logLevel || LogLevel.ERROR;
    printLog(parameterizedString(logs.infoLogs.INITIALIZE_CLIENT, CLASS_NAME), MessageType.LOG,
      logLevel);
    validateInitConfig(config);
    const tempConfig = config;
    tempConfig.vaultURL = config.vaultURL.slice(-1) === '/'
      ? config.vaultURL.slice(0, -1)
      : config.vaultURL;
    const skyflow = new Skyflow(tempConfig);
    printLog(parameterizedString(logs.infoLogs.CLIENT_INITIALIZED, CLASS_NAME),
      MessageType.LOG, logLevel);
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
        printLog(parameterizedString(logs.infoLogs.COLLECT_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        return collectContainer;
      }
      case ContainerType.REVEAL: {
        const revealContainer = new RevealContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        },
        { logLevel: this.#logLevel });
        printLog(parameterizedString(logs.infoLogs.REVEAL_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        return revealContainer;
      }
      default:
        if (!type) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_CONTAINER_TYPE, [], true);
        }
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONTAINER_TYPE, [], true);
    }
  }

  insert(
    records: IInsertRecordInput,
    options: Record<string, any> = { tokens: true },
  ) {
    printLog(parameterizedString(logs.infoLogs.INSERT_TRIGGERED, CLASS_NAME), MessageType.LOG,
      this.#logLevel);
    return this.#pureJsController.insert(records, options);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<IRevealResponseType> {
    printLog(parameterizedString(logs.infoLogs.DETOKENIZE_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#pureJsController.detokenize(detokenizeInput);
  }

  getById(getByIdInput: IGetByIdInput) {
    printLog((logs.infoLogs.GET_BY_ID_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#pureJsController.getById(getByIdInput);
  }

  invokeConnection(config: IConnectionConfig) {
    printLog(parameterizedString(logs.infoLogs.INVOKE_CONNECTION_TRIGGERED, CLASS_NAME),
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

  static get ValidationRuleType() {
    return ValidationRuleType;
  }
}
export default Skyflow;
