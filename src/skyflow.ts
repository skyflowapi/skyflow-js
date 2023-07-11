/*
Copyright (c) 2022 Skyflow, Inc.
*/

/**
 * @module Skyflow
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
  RequestMethod,
  IInsertRecordInput,
  IDetokenizeInput,
  IGetInput,
  RedactionType,
  EventName,
  Env,
  LogLevel,
  MessageType,
  ValidationRuleType,
  IGetByIdInput,
  IInsertOptions,
  IDeleteRecordInput,
  IDeleteOptions,
} from './utils/common';
import { formatVaultURL } from './utils/helpers';
import ComposableContainer from './core/external/collect/compose-collect-container';
import { validateComposableContainerOptions } from './utils/validators';

/**
 * Supported Container types.
 */
export enum ContainerType {
  COLLECT = 'COLLECT',
  REVEAL = 'REVEAL',
  COMPOSABLE = 'COMPOSABLE',
}

/** Wrapper for parameters required by Skyflow. */
export interface ISkyflow {
  /** Id of the vault that the client should connect to */
  vaultID?: string;
  /** URL of the vault that the client should connect to */
  vaultURL?: string;
  /** Helper function that retrieves a Skyflow bearer token from your backend */
  getBearerToken: () => Promise<string>;
  /** An optional object that contains keys as env, loglevel */
  options?: Record<string, any>;
}
const CLASS_NAME = 'Skyflow';

/**
  * Parent skyflow class, that consists of all the methods exposed to the client.
  * @class Skyflow
  */
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

  /** @internal */
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

  /**
  * Method to initialize skyflow client
  * @public
  * @param config Configuration for the skyflow client.
  * @returns returns an instance of skyflow client.
  */
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

  /**
  * This method is used to create the skyflow container
  * @public
  * @param type Type of skyflow container to create.
  * @param options Additional paramater for container.
  * @returns Returns the skyflow container of the specified type.
  */
  container(type: ContainerType, options?: Record<string, any>) {
    switch (type) {
      case ContainerType.COLLECT: {
        const collectContainer = new CollectContainer(options, {
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
          containerType: type,
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
          containerType: type,
        },
        this.#skyflowElements,
        { logLevel: this.#logLevel });
        printLog(parameterizedString(logs.infoLogs.REVEAL_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        return revealContainer;
      }
      case ContainerType.COMPOSABLE: {
        validateComposableContainerOptions(options);
        const collectContainer = new ComposableContainer(options, {
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
          containerType: type,
        },
        this.#skyflowElements,
        { logLevel: this.#logLevel, env: this.#env });
        printLog(parameterizedString(logs.infoLogs.COLLECT_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        return collectContainer;
      }

      default:
        if (!type) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_CONTAINER_TYPE, [], true);
        }
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONTAINER_TYPE, [], true);
    }
  }

  /**
  * This method is used to insert data into the vault
  * @public
  * @param records The records parameter takes a JSON object of the records to insert into the below format. 
  * @param options The options parameter takes an object of optional parameters for the insertion.
  * @returns Returns the insert response.
  */
  insert(
    records: IInsertRecordInput,
    options: IInsertOptions,
  ) {
    printLog(parameterizedString(logs.infoLogs.INSERT_TRIGGERED, CLASS_NAME), MessageType.LOG,
      this.#logLevel);
    return this.#skyflowContainer.insert(records, options);
  }

  /**
  * This method is used to reveal using skyflow tokens
  * @public
  * @param detokenizeInput Input required by detokenize method.
  * @returns It will return detokenized values that correspond to the specified tokens.
  */
  detokenize(detokenizeInput: IDetokenizeInput): Promise<IRevealResponseType> {
    printLog(parameterizedString(logs.infoLogs.DETOKENIZE_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#skyflowContainer.detokenize(detokenizeInput);
  }

  /**
  * To reveal elements using skyflow ids
  * @public
  * @param getByIdInput Input required by getById method.
  * @returns Returns the records of fetched by skyflow ids. It returns errors if any.
  */
  getById(getByIdInput: IGetByIdInput) {
    printLog(logs.warnLogs.GET_BY_ID_DEPRECATED, MessageType.WARN, this.#logLevel);
    printLog(parameterizedString(logs.infoLogs.GET_BY_ID_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#skyflowContainer.getById(getByIdInput);
  }

  /**
  * Use to fetch records either by skyflow ids or by column values
  * @public
  * @param getInput Input required by get method.
  * @returns Returns an array of fetched records or errors if any.
  */
  get(getInput: IGetInput) {
    printLog(parameterizedString(logs.infoLogs.GET_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.#logLevel);
    return this.#skyflowContainer.get(getInput);
  }

  /**
  * This method is used to delete data from the vault
  * @public
  * @param records The records parameter takes an array of records to delete in the following format.
  * @param options The options parameter is optional and takes an object of deletion parameters. 
  * @returns Returns an array of deleted records or errors if any.
  */
  delete(records: IDeleteRecordInput, options: IDeleteOptions) {
    printLog(parameterizedString(logs.infoLogs.DELETE_TRIGGERED, CLASS_NAME), MessageType.LOG,
      this.#logLevel);
    return this.#skyflowContainer.delete(records, options);
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
