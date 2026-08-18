/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Shared public-entry base for the SDK `Skyflow` class. Both packages shipped
// near-identical entry classes (~75% byte-identical); everything that did not
// actually differ lives here now:
//   - the constructor (uuid/session metadata, Client construction, controller
//     container bootstrap, the framebus GET_BEARER_TOKEN listener, startup logs)
//   - `static init()` — URL normalization + custom-elements-URL handling
//   - `getSkyflowBearerToken()` — the promise-shaped token accessor threaded into
//     every container
//   - `container()` — the four overloads and the shared switch/props assembly
//   - the ten static enum getters whose values are the same `@core` objects in
//     both packages
//
// Divergence is injected through five abstract factory hooks (which concrete
// container class to `new`), exactly as the container bases in this folder do.
// Boundary-clean: this file names only `@core` types and the type parameters'
// bounds — never a `packages/*` class. Core calls into the subclass purely by
// dynamic dispatch on the abstract hooks.
//
// Generic parameters exist so `container()`'s overloads — written once here —
// still return each package's own container classes at the call site. Each is
// bounded to the matching `@core` container base class (CoreCollectContainer,
// CoreRevealContainer, …) — the shared supertype both packages extend — so a
// subclass can only wire a container of the right family and no `packages/*`
// class is named here.
//
// What deliberately stays in each package's `skyflow.ts` subclass:
//   - the five `instantiate*`/`create*Container` hooks
//   - `static get Error()`         — SkyflowError vs SkyflowFlowDBError
//   - privacyDB's pure-JS API (insert/detokenize/get/getById/delete/update) and
//     `static get ThreeDS()`; flowDB's `static get UpdateType()`
//   - the `setVariantAdapter()` registration call
import bus from 'framebus';
import uuid from '@core/libs/uuid';
import isTokenValid from '@core/utils/jwt-utils';
import {
  CardType,
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
  SDK_VERSION_KEY,
  SESSION_ID,
} from '@core/constants';
import properties from '@core/properties';
import logs from '@core/utils/logs';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';
import Client from '@core/client';
import CoreSkyflowContainer from '@core/external/skyflow-container';
import CoreCollectContainer from '@core/external/collect/collect-container';
import CoreRevealContainer from '@core/external/reveal/reveal-container';
import CoreComposableCollectContainer from '@core/external/collect/composable-collect-container';
import CoreComposableRevealContainer from '@core/external/reveal/composable-reveal-container';
import type CoreRevealElement from '@core/external/reveal/reveal-element';
import { checkAndSetForCustomUrl, formatVaultURL } from '@core/helpers';
import { validateComposableContainerOptions } from '@core/validators';
import { printLog, parameterizedString } from '@core/utils/logs-helper';
import {
  ClientMetadata,
  CollectElementInput,
  ContainerOptions,
  ContainerType,
  Context,
  Env,
  ErrorType,
  EventName,
  ICollectElementOptionsBase,
  ICollectElementUpdateOptionsBase,
  ICollectOptionsBase,
  ICollectResponseBase,
  ICoreMetadata,
  IRevealInputBase,
  IRevealOptionsBase,
  IRevealResponseBase,
  ISkyflow,
  LogLevel,
  MessageType,
  RedactionType,
  RequestMethod,
  ValidationRuleType,
} from '@core/types';

const CLASS_NAME = 'Skyflow';

// The container-generic bounds each subclass must satisfy, extracted to named
// aliases so the class header stays readable and the marker lists live in one
// place. They use the shared `@core` marker bases (ICollectOptionsBase /
// ICollectResponseBase / ICollectElementUpdateOptionsBase / IRevealInputBase /
// IRevealOptionsBase / IRevealResponseBase) rather than `any` — so a subclass can
// only wire a container of the right family AND the right input/option/response
// contract. Package option/response types are never named here (that would cross
// the @core ⇏ packages line); the markers are their common supertype, which is all
// BaseSkyflow needs.
type CollectContainerContract = CoreCollectContainer<
ICollectOptionsBase, ICollectResponseBase, ICollectElementUpdateOptionsBase,
CollectElementInput, ICollectElementOptionsBase
>;
// The reveal options slots read `void | IRevealOptionsBase` because privacyDB binds
// `TRevealOptions = void` (it has no reveal options) while flowDB binds an object:
// `void` is not assignable to the empty marker, but the union admits both, and
// `reveal(options?)` is a method so the type argument is checked bivariantly — no
// package-side change needed.
type RevealContainerContract = CoreRevealContainer<
IRevealInputBase, void | IRevealOptionsBase, IRevealResponseBase,
CoreRevealElement<IRevealInputBase>
>;
type ComposableCollectContract = CoreComposableCollectContainer<
ICollectOptionsBase, ICollectResponseBase, CollectElementInput, ICollectElementOptionsBase
>;
type ComposeRevealContract = CoreComposableRevealContainer<
void | IRevealOptionsBase, IRevealResponseBase
>;

abstract class BaseSkyflow<
  TSkyflowContainer extends CoreSkyflowContainer,
  TCollectContainer extends CollectContainerContract,
  TRevealContainer extends RevealContainerContract,
  TComposableContainer extends ComposableCollectContract,
  TComposeRevealContainer extends ComposeRevealContract,
> {
  // `protected` (not `#private`) because the subclasses reach these: privacyDB's
  // pure-JS methods delegate to `skyflowContainer`. `#uuid`/`#bearerToken` are
  // read only in here, so they stay hard-private.
  protected client: Client;

  #uuid: string = uuid();

  protected metadata: ClientMetadata = {
    uuid: this.#uuid,
    clientDomain: window.location.origin,
  };

  protected skyflowContainer: TSkyflowContainer;

  #bearerToken: string = '';

  protected logLevel: LogLevel;

  protected env: Env;

  constructor(config: ISkyflow) {
    const localSDKversion = localStorage.getItem('sdk_version') || '';
    this.metadata[SDK_VERSION_KEY] = localSDKversion;
    this.metadata[SESSION_ID] = uuid();
    this.client = new Client(
      {
        ...config,
      },
      this.metadata,
    );
    this.logLevel = config?.options?.logLevel || LogLevel.ERROR;
    this.env = config?.options?.env || Env.PROD;
    // Prototype-method dispatch, so it resolves to the subclass override even
    // though we are still inside the base constructor. The hook must therefore be
    // implemented as a method, never as an arrow-function class field (those
    // initialize after `super()` and would still be undefined here).
    this.skyflowContainer = this.instantiateSkyflowContainer(
      this.client,
      { logLevel: this.logLevel, env: this.env },
    );

    const cb = (data, callback: Function) => {
      printLog(parameterizedString(logs.infoLogs.CAPTURED_BEARER_TOKEN_EVENT, CLASS_NAME),
        MessageType.LOG,
        this.logLevel);
      if (
        this.client.config.getBearerToken
        && (!this.#bearerToken || !isTokenValid(this.#bearerToken))
      ) {
        this.client.config
          .getBearerToken()
          .then((bearerToken) => {
            if (isTokenValid(bearerToken)) {
              printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
                MessageType.LOG,
                this.logLevel);
              this.#bearerToken = bearerToken;
              callback({ authToken: this.#bearerToken });
            } else {
              printLog(parameterizedString(
                logs.errorLogs.INVALID_BEARER_TOKEN,
              ), MessageType.ERROR, this.logLevel);
              callback({
                error: parameterizedString(
                  logs.errorLogs.INVALID_BEARER_TOKEN,
                ),
              });
            }
          })
          .catch((err) => {
            printLog(parameterizedString(logs.errorLogs.BEARER_TOKEN_REJECTED), MessageType.ERROR,
              this.logLevel);
            callback({ error: err });
          });
      } else {
        printLog(parameterizedString(logs.infoLogs.REUSE_BEARER_TOKEN, CLASS_NAME),
          MessageType.LOG,
          this.logLevel);
        callback({ authToken: this.#bearerToken });
      }
    };

    bus
      .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN + this.#uuid, cb);
    printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_LISTENER, CLASS_NAME), MessageType.LOG,
      this.logLevel);
    printLog(parameterizedString(logs.infoLogs.CURRENT_ENV, CLASS_NAME, this.env),
      MessageType.LOG, this.logLevel);
    printLog(parameterizedString(logs.infoLogs.CURRENT_LOG_LEVEL, CLASS_NAME, this.logLevel),
      MessageType.LOG, this.logLevel);
  }

  // Written once, but still returns the *concrete* package class: the
  // polymorphic `this` parameter binds to `typeof Skyflow` at the call site, so
  // `Skyflow.init(config)` types as that package's `Skyflow` and `new this(...)`
  // constructs it. `BaseSkyflow.init(...)` is rejected — an abstract constructor
  // is not assignable to the `new (...) => T` bound.
  static init<T>(this: new (config: ISkyflow) => T, config: ISkyflow): T {
    const logLevel = config?.options?.logLevel || LogLevel.ERROR;
    checkAndSetForCustomUrl(config);
    printLog(parameterizedString(logs.infoLogs.INITIALIZE_CLIENT, CLASS_NAME), MessageType.LOG,
      logLevel);

    const tempConfig = config;
    tempConfig.vaultURL = formatVaultURL(config.vaultURL);
    const skyflow = new this(tempConfig);
    printLog(parameterizedString(logs.infoLogs.CLIENT_INITIALIZED, CLASS_NAME),
      MessageType.LOG, logLevel);
    return skyflow;
  }

  protected getSkyflowBearerToken: () => Promise<string> = () => new Promise((resolve, reject) => {
    if (
      this.client.config.getBearerToken
        && (!this.#bearerToken || !isTokenValid(this.#bearerToken))
    ) {
      this.client.config
        .getBearerToken()
        .then((bearerToken) => {
          if (isTokenValid(bearerToken)) {
            printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
              MessageType.LOG,
              this.logLevel);
            this.#bearerToken = bearerToken;
            resolve(this.#bearerToken);
          } else {
            printLog(parameterizedString(
              logs.errorLogs.INVALID_BEARER_TOKEN,
            ), MessageType.ERROR, this.logLevel);
            reject({
              error: parameterizedString(
                logs.errorLogs.INVALID_BEARER_TOKEN,
              ),
            });
          }
        })
        .catch((err) => {
          printLog(parameterizedString(logs.errorLogs.BEARER_TOKEN_REJECTED), MessageType.ERROR,
            this.logLevel);
          reject({ error: err });
        });
    } else {
      printLog(parameterizedString(logs.infoLogs.REUSE_BEARER_TOKEN, CLASS_NAME),
        MessageType.LOG,
        this.logLevel);
      resolve(this.#bearerToken);
    }
  });

  // ---- Injected divergence (see class doc) ----------------------------------
  // Each hook is the minimal "which concrete class do I `new`" decision. They
  // are prototype methods, not arrow-function fields: `instantiateSkyflowContainer`
  // is invoked from the base constructor, and keeping the whole set consistent
  // avoids the field-initialization-order trap.

  protected abstract instantiateSkyflowContainer(
    client: Client,
    context: Context,
  ): TSkyflowContainer;

  protected abstract createCollectContainer(
    metaData: ICoreMetadata,
    context: Context,
    options?: ContainerOptions,
  ): TCollectContainer;

  protected abstract createRevealContainer(
    metaData: ICoreMetadata,
    context: Context,
    options?: ContainerOptions,
  ): TRevealContainer;

  protected abstract createComposableContainer(
    metaData: ICoreMetadata,
    context: Context,
    options: ContainerOptions,
  ): TComposableContainer;

  protected abstract createComposeRevealContainer(
    metaData: ICoreMetadata,
    context: Context,
    options?: ContainerOptions,
  ): TComposeRevealContainer;

  // --------------------------------------------------------------------------

  #containerProps = (type: ContainerType): ICoreMetadata => ({
    ...this.metadata,
    clientJSON: this.client.toJSON(),
    containerType: type,
    skyflowContainer: this.skyflowContainer,
    getSkyflowBearerToken: this.getSkyflowBearerToken,
  });

  #context = (): Context => ({ logLevel: this.logLevel, env: this.env });

  container(type: ContainerType.COLLECT, options?: ContainerOptions): TCollectContainer;
  container(type: ContainerType.REVEAL, options?: ContainerOptions): TRevealContainer;
  container(type: ContainerType.COMPOSABLE, options?: ContainerOptions): TComposableContainer;
  container(type: ContainerType.COMPOSE_REVEAL,
    options?: ContainerOptions)
  : TComposeRevealContainer;
  container(type: ContainerType, options?: ContainerOptions) {
    switch (type) {
      case ContainerType.COLLECT: {
        const collectContainer = this.createCollectContainer(
          this.#containerProps(type),
          this.#context(),
          options,
        );
        printLog(parameterizedString(logs.infoLogs.COLLECT_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.logLevel);
        return collectContainer;
      }
      case ContainerType.REVEAL: {
        const revealContainer = this.createRevealContainer(
          this.#containerProps(type),
          this.#context(),
          options,
        );
        printLog(parameterizedString(logs.infoLogs.REVEAL_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.logLevel);
        return revealContainer;
      }
      case ContainerType.COMPOSABLE: {
        validateComposableContainerOptions(options!);
        const composableContainer = this.createComposableContainer(
          this.#containerProps(type),
          this.#context(),
          options!,
        );
        printLog(parameterizedString(logs.infoLogs.COLLECT_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.logLevel);
        return composableContainer;
      }

      case ContainerType.COMPOSE_REVEAL: {
        validateComposableContainerOptions(options!);
        const revealComposableContainer = this.createComposeRevealContainer(
          this.#containerProps(type),
          this.#context(),
          options,
        );
        printLog(parameterizedString(logs.infoLogs.REVEAL_CONTAINER_CREATED, CLASS_NAME),
          MessageType.LOG,
          this.logLevel);
        return revealComposableContainer;
      }

      default:
        if (!type) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_CONTAINER_TYPE, [], true);
        }
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_CONTAINER_TYPE, [type], true);
    }
  }

  // Static members inherit through the prototype chain, so these are exposed
  // unchanged on each package's `Skyflow`. Both packages re-exported the very
  // same `@core` objects here, so there is nothing variant-specific to keep in
  // the subclasses — except `Error` (SkyflowError vs SkyflowFlowDBError), which
  // each package defines itself, and their package-only additions.

  static get ContainerType() {
    return ContainerType;
  }

  static get ElementType() {
    return ElementType;
  }

  static get RedactionType() {
    return RedactionType;
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
}

export default BaseSkyflow;
