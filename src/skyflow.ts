/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import uuid from './libs/uuid';
import {
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
} from './core/constants';
import Client from './client';
import RevealContainer from './core/external/reveal/reveal-container';
import CollectContainer from './core/external/collect/collect-container';
import properties from './properties';
import isTokenValid from './utils/jwt-utils';
import SkyflowContainer from './core/external/skyflow-container';
import { parameterizedString, printLog } from './utils/logs-helper';
import SkyflowError from './libs/skyflow-error';
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
  ISoapConnectionConfig,
} from './utils/common';
import { formatVaultURL } from './utils/helpers';

export enum ContainerType {
  COLLECT = 'COLLECT',
  REVEAL = 'REVEAL',
}
export interface ISkyflow {
  vaultID?: string;
  vaultURL?: string;
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

  #skyflowContainer: SkyflowContainer;

  #bearerToken: string = '';

  #options: any;

  #logLevel:LogLevel;

  #env:Env;

  #skyflowElements: any;

  constructor(config: ISkyflow) {
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata,
    );
    this.#logLevel = config?.options?.logLevel || LogLevel.ERROR;
    this.#env = config?.options?.env || Env.PROD;
    this.#skyflowElements = {};
    this.#skyflowContainer = new SkyflowContainer(this.#client,
      { logLevel: this.#logLevel, env: this.#env });

    const cb = (data, callback) => {
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
            if (isTokenValid(bearerToken)) {
              printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
                MessageType.LOG,
                this.#logLevel);
              this.#bearerToken = bearerToken;
              callback({ authToken: this.#bearerToken });
            } else {
              printLog(logs.errorLogs.INVALID_BEARER_TOKEN, MessageType.ERROR, this.#logLevel);
              callback({ error: logs.errorLogs.INVALID_BEARER_TOKEN });
            }
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
    };

    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN + this.#uuid, cb);
    printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_LISTENER, CLASS_NAME), MessageType.LOG,
      this.#logLevel);
    printLog(parameterizedString(logs.infoLogs.CURRENT_ENV, CLASS_NAME, this.#env),
      MessageType.LOG, this.#logLevel);
    printLog(parameterizedString(logs.infoLogs.CURRENT_LOG_LEVEL, CLASS_NAME, this.#logLevel),
      MessageType.LOG, this.#logLevel);
  }

  static init(config: ISkyflow): Skyflow {
    const logLevel = config?.options?.logLevel || LogLevel.ERROR;
    printLog(parameterizedString(logs.infoLogs.INITIALIZE_CLIENT, CLASS_NAME), MessageType.LOG,
      logLevel);

    const tempConfig = config;
    tempConfig.vaultURL = formatVaultURL(config.vaultURL);
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
        this.#skyflowElements,
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
        this.#skyflowElements,
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
    return this.#skyflowContainer.insert(records, options);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<IRevealResponseType> {
    printLog(parameterizedString(logs.infoLogs.DETOKENIZE_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#skyflowContainer.detokenize(detokenizeInput);
  }

  getById(getByIdInput: IGetByIdInput) {
    printLog(parameterizedString(logs.infoLogs.GET_BY_ID_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#skyflowContainer.getById(getByIdInput);
  }

  /**
 * 1. Invoke Connection method
 *
 * @deprecated [#1]

 */
  invokeConnection(config: IConnectionConfig) {
    printLog(logs.warnLogs.DEPRECATE_INVOKE_CONNECTION, MessageType.WARN, this.#logLevel);
    printLog(parameterizedString(logs.infoLogs.INVOKE_CONNECTION_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);

    return this.#skyflowContainer.invokeConnection(config);
  }

  invokeSoapConnection(config: ISoapConnectionConfig) {
    printLog(parameterizedString(logs.infoLogs.INVOKE_SOAP_CONNECTION_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);

    return this.#skyflowContainer.invokeSoapConnection(config, this.#skyflowElements);
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
