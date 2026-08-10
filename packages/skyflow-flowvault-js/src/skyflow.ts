/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault (flowDB) public Skyflow shell. Structurally parallel to skyflow-js's
// Skyflow class, but elements-only: it exposes ONLY the element container()
// factory (COLLECT / REVEAL / COMPOSE_REVEAL) — no pure-JS insert/detokenize/
// get/delete/update, no 3DS (per package-split §9 decisions). COMPOSABLE collect
// is deferred (its container classes were not ported from 2.9.0-beta.1). The
// public error surface is SkyflowFlowDBError; internal container-type validation
// uses the neutral @core SkyflowError base.
import bus from 'framebus';
import uuid from '@core/libs/uuid';
import isTokenValid from '@core/utils/jwt-utils';
import {
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
  SDK_VERSION,
  SESSION_ID,
  CardType,
} from '@core/constants';
import properties from '@core/properties';
import logs from '@core/utils/logs';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { ContainerType, ISkyflow, SkyflowConfigOptions } from '@core/types';
import { setVariantAdapter } from '@core/adapters';
import Client from './client';
import RevealContainer from './core/external/reveal/reveal-container';
import CollectContainer from './core/external/collect/collect-container';
import ComposableRevealContainer from './core/external/reveal/composable-reveal-container';
import SkyflowContainer from './core/external/skyflow-container';
import { parameterizedString, printLog } from './utils/logs-helper';
import SkyflowError from '@core/errors';
import SkyflowFlowDBError from './libs/skyflow-flowdb-error';
import {
  RequestMethod,
  RedactionType,
  EventName,
  Env,
  LogLevel,
  MessageType,
  ValidationRuleType,
  ErrorType,
  ContainerOptions,
  UpdateType,
} from './utils/common';
import { formatVaultURL, checkAndSetForCustomUrl } from './utils/helpers';
import { validateComposableContainerOptions } from './utils/validators';
import { ClientMetadata, SkyflowElementProps } from './core/internal/internal-types';
import flowVaultVariantAdapter from './variant-adapter';

// Register this package's variant behaviour with the shared @core layer once,
// at module load. The main-thread SDK entry points (index.ts, index-node.ts,
// index-internal.ts) all import this module, so the adapter is registered
// before any @core code that reads it (e.g. @core/metrics) runs.
setVariantAdapter(flowVaultVariantAdapter);

// Relocated to @core/types (variant-neutral); re-exported here under the same
// names so `./skyflow` importers and the public surface are unchanged.
export { ContainerType, ISkyflow, SkyflowConfigOptions };

const CLASS_NAME = 'Skyflow';
class Skyflow {
  #client: Client;

  #uuid: string = uuid();

  #metadata: ClientMetadata = {
    uuid: this.#uuid,
    clientDomain: window.location.origin,
  };

  #skyflowContainer: SkyflowContainer;

  #bearerToken: string = '';

  #options: any;

  #logLevel:LogLevel;

  #env:Env;

  #skyflowElements: Array<SkyflowElementProps>;

  constructor(config: ISkyflow) {
    const localSDKversion = localStorage.getItem('sdk_version') || '';
    this.#metadata[SDK_VERSION] = localSDKversion;
    this.#metadata[SESSION_ID] = uuid();
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata,
    );
    this.#logLevel = config?.options?.logLevel || LogLevel.ERROR;
    this.#env = config?.options?.env || Env.PROD;
    this.#skyflowElements = [];
    this.#skyflowContainer = new SkyflowContainer(this.#client,
      { logLevel: this.#logLevel, env: this.#env });

    const cb = (data, callback: Function) => {
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
              printLog(parameterizedString(
                logs.errorLogs.INVALID_BEARER_TOKEN,
              ), MessageType.ERROR, this.#logLevel);
              callback({
                error: parameterizedString(
                  logs.errorLogs.INVALID_BEARER_TOKEN,
                ),
              });
            }
          })
          .catch((err) => {
            printLog(parameterizedString(logs.errorLogs.BEARER_TOKEN_REJECTED), MessageType.ERROR,
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
      .target(properties.IFRAME_SECURE_ORIGIN)
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
    checkAndSetForCustomUrl(config);
    printLog(parameterizedString(logs.infoLogs.INITIALIZE_CLIENT, CLASS_NAME), MessageType.LOG,
      logLevel);

    const tempConfig = config;
    tempConfig.vaultURL = formatVaultURL(config.vaultURL);
    const skyflow = new Skyflow(tempConfig);
    printLog(parameterizedString(logs.infoLogs.CLIENT_INITIALIZED, CLASS_NAME),
      MessageType.LOG, logLevel);
    return skyflow;
  }

  #getSkyflowBearerToken: () => Promise<string> = () => new Promise((resolve, reject) => {
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
            resolve(this.#bearerToken);
          } else {
            printLog(parameterizedString(
              logs.errorLogs.INVALID_BEARER_TOKEN,
            ), MessageType.ERROR, this.#logLevel);
            reject({
              error: parameterizedString(
                logs.errorLogs.INVALID_BEARER_TOKEN,
              ),
            });
          }
        })
        .catch((err) => {
          printLog(parameterizedString(logs.errorLogs.BEARER_TOKEN_REJECTED), MessageType.ERROR,
            this.#logLevel);
          reject({ error: err });
        });
    } else {
      printLog(parameterizedString(logs.infoLogs.REUSE_BEARER_TOKEN, CLASS_NAME),
        MessageType.LOG,
        this.#logLevel);
      resolve(this.#bearerToken);
    }
  });

  container(type: ContainerType.COLLECT, options?: ContainerOptions): CollectContainer;
  container(type: ContainerType.REVEAL, options?: ContainerOptions): RevealContainer;
  container(type: ContainerType.COMPOSE_REVEAL,
    options?: ContainerOptions)
  : ComposableRevealContainer;
  container(type: ContainerType, options?: ContainerOptions) {
    switch (type) {
      case ContainerType.COLLECT: {
        const collectContainer = new CollectContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
          containerType: type,
          skyflowContainer: this.#skyflowContainer,
          getSkyflowBearerToken: this.#getSkyflowBearerToken,
        },
        this.#skyflowElements,
        { logLevel: this.#logLevel, env: this.#env }, options);
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
          skyflowContainer: this.#skyflowContainer,
          getSkyflowBearerToken: this.#getSkyflowBearerToken,
        },
        this.#skyflowElements,
        { logLevel: this.#logLevel, env: this.#env }, options);
        printLog(parameterizedString(logs.infoLogs.REVEAL_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        return revealContainer;
      }
      case ContainerType.COMPOSE_REVEAL: {
        validateComposableContainerOptions(options!);
        const revealComposableContainer = new ComposableRevealContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
          containerType: type,
          skyflowContainer: this.#skyflowContainer,
          getSkyflowBearerToken: this.#getSkyflowBearerToken,
        },
        this.#skyflowElements,
        { logLevel: this.#logLevel, env: this.#env }, options);
        printLog(parameterizedString(logs.infoLogs.REVEAL_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.#logLevel);
        return revealComposableContainer;
      }

      default:
        if (!type) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_CONTAINER_TYPE, [], true);
        }
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONTAINER_TYPE, [type], true);
    }
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

  static get UpdateType() {
    return UpdateType;
  }

  static get ErrorType() {
    return ErrorType;
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

  static get CardType() {
    return CardType;
  }

  static get Error() {
    return SkyflowFlowDBError;
  }
}
export default Skyflow;
