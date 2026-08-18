/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
// Shared composable-collect container base (extends ComposableContainerBase). Owns
// the entire variant-agnostic collect surface: the createMultipleElement shell
// (grid → @core CollectElement, with destroy/update callbacks), the bus
// COMPOSABLE_CONTAINER handshake (registerReadyListener + updateListeners), the
// on() submit listener and collect() — which just emits COMPOSABLE_CALL_REQUESTS
// with COLLECT_TYPES.COLLECT and resolves on the unified { records } envelope. The
// flowDB-vs-privacyDB request/response mapping lives entirely inside the collect
// frame controller, so nothing here branches on variant. create() is single-
// sourced here too (its returned ComposableElement is the shared @core class both
// packages re-export); it is generic over the public input/options types so each
// package keeps its own consumer-facing signature. The divergence stays in each
// package subclass:
//   - validateCreateInput()       — each package's collect-input validator.
//   - buildCreateElementFields()  — the one variant identity field on the element
//                                   descriptor (flowDB `table`; privacyDB none).
//   - registerElementListeners()  — privacyDB's per-element file-upload wiring;
//                                   flowDB has no file upload so it inherits the
//                                   empty ComposableContainerBase default.
//   - uploadFiles()               — privacyDB-only, added in that subclass.
import bus from 'framebus';
import deepClone from '@core/libs/deep-clone';
import uuid from '@core/libs/uuid';
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT, ELEMENT_EVENTS_TO_CLIENT,
  COLLECT_TYPES,
} from '@core/constants';
import ComposableContainerBase from '@core/external/common/composable-container';
import SkyflowError from '@core/errors';
import {
  getElements, validateElementOptions, formatValidations, formatOptions,
} from '@core/libs/element-options';
import Client from '@core/client';
import CollectElement from '@core/external/collect/collect-element';
import ComposableElement from '@core/external/collect/composable-collect-element';
import {
  ContainerType, MessageType, InputStyles, ErrorTextStyles,
  ICollectOptionsBase,
  ICollectResponseBase,
  CollectElementInput,
  ICollectElementOptionsBase,
  VariantCollectAdapter,
} from '@core/types';
import {
  validateInitConfig, validateAdditionalFieldsInCollect, validateUpsertOptions,
  validateBooleanOptions,
} from '@core/validators';
import { printLog, parameterizedString } from '@core/utils/logs-helper';
import { ElementGroup } from '@core/external/collect/collect-container';

export interface ComposableElementGroup extends ElementGroup {
  styles: InputStyles;
  errorTextStyles: ErrorTextStyles;
}

const CLASS_NAME = 'CollectContainer';

abstract class CoreComposableCollectContainer<
  TOptions extends ICollectOptionsBase,
  TResponse extends ICollectResponseBase,
  TCreateInput extends CollectElementInput,
  TCreateOptions extends ICollectElementOptionsBase,
> extends ComposableContainerBase<CollectElement> {
  type:string = ContainerType.COMPOSABLE;

  // Package-specific collect key strategy (privacyDB `skyflowID`/`table` vs flowDB
  // `skyflowId`/`tableName`). Abstract — each package MUST supply it (no default,
  // so a missing impl is a compile error). Read here (skyflowIdKey) and injected
  // into every CollectElement this container builds; mirrors CoreCollectContainer.
  protected abstract collectVariant: VariantCollectAdapter;

  protected elementGroup: ComposableElementGroup = { rows: [], styles: {}, errorTextStyles: {} };

  // eslint-disable-next-line class-methods-use-this
  protected getClassName(): string {
    return CLASS_NAME;
  }

  // Shared create() orchestration. The two packages differed only in the input
  // validator and a single identity field on the element descriptor, both now
  // injected via hooks (validateCreateInput / buildCreateElementFields), so the
  // body is single-sourced here. The returned ComposableElement is the shared
  // @core class both packages re-export. Typed over TCreateInput/TCreateOptions
  // so each package's public signature keeps its own input/options keys.
  create = (
    input: TCreateInput,
    options: TCreateOptions = { required: false } as TCreateOptions,
  ): ComposableElement => {
    this.validateCreateInput(input);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.context.logLevel);

    const elementName = `${FRAME_ELEMENT}:${input.type}:${btoa(uuid())}`;

    this.elementsList.push({
      elementType: input.type,
      name: input.column,
      ...input,
      ...this.buildCreateElementFields(input, options),
      ...formattedOptions,
      validations,
      elementName,
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.tempElements)}:${this.containerId}:${this.context.logLevel}:${btoa(this.clientDomain)}`;
    this.iframeID = controllerIframeName;
    return new ComposableElement(
      elementName, this.eventEmitter, controllerIframeName,
      { ...this.metaData, type: input.type },
    );
  };

  protected createMultipleElement = (
    multipleElements: ComposableElementGroup,
    isSingleElementAPI: boolean = false,
  ): CollectElement => {
    const elements: any[] = [];
    this.tempElements = deepClone(multipleElements);
    this.tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const { elementType } = options;
        validateElementOptions(elementType, options);

        options.sensitive = options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern = options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        options.isMounted = false;

        options.label = element.label;
        // skyflowID (privacyDB) vs skyflowId (flowDB) is a wire-key contract; the
        // active key comes from the injected collect variant (was hardcoded to
        // `element.skyflowID`, which read `undefined` for flowDB).
        options.skyflowID = element[this.collectVariant.skyflowIdKey];

        elements.push(options);
      });
    });

    this.tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_ELEMENT}:group:${btoa(this.tempElements)}`;
    if (
      isSingleElementAPI
      && !this.elements[elements[0].elementName]
      && this.hasElementName(elements[0].name)
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
    }

    let element = this.elements[this.tempElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.update(elements[0]);
      } else {
        element.update(this.tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement(
        elementId,
        this.tempElements,
        this.metaData,
        {
          containerId: this.containerId,
          isMounted: this.containerMounted,
          type: this.type,
        },
        true,
        this.destroyCallback,
        this.updateCallback,
        this.context,
        this.collectVariant,
        this.eventEmitter,
      );
      this.elements[this.tempElements.elementName] = element;
    }
    return element;
  };

  protected removeElement = (elementName: string) => {
    Object.keys(this.elements).forEach((element) => {
      if (element === elementName) delete this.elements[element];
    });
  };

  protected destroyCallback = (elementNames: string[]) => {
    elementNames.forEach((elementName) => {
      this.removeElement(elementName);
    });
  };

  protected updateCallback = (elements: any[]) => {
    elements.forEach((element) => {
      if (this.elements[element.elementName]) {
        this.elements[element.elementName].update(element);
      }
    });
  };

  on = (eventName:string, handler:Function) => {
    if (!Object.values(ELEMENT_EVENTS_TO_CLIENT).includes(eventName)) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (!handler) {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.MISSING_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }
    if (typeof handler !== 'function') {
      throw new SkyflowError(
        SKYFLOW_ERROR_CODE.INVALID_HANDLER_IN_EVENT_LISTENER,
        [],
        true,
      );
    }

    this.eventEmitter.on(ELEMENT_EVENTS_TO_CLIENT.SUBMIT, () => {
      handler();
    });
  };

  // Handshake with the composable controller frame (bus). Invoked from the base
  // constructor, so it is a prototype method (available during super()).
  protected registerReadyListener(): void {
    this.updateListeners();
    bus
      // .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.INITIALIZE_COMPOSABLE_CLIENT, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        callback({
          client: this.metaData.clientJSON,
          context: this.context,
        });
        this.isComposableFrameReady = true;
      });
  }

  collect = (options: TOptions = {} as TOptions) :
  Promise<TResponse> => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.metaData.clientJSON.config);
      if (!this.elementsList || this.elementsList.length === 0) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
      }
      if (!this.isMounted) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
      }
      const containerElements = getElements(this.tempElements);
      containerElements.forEach((element:any) => {
        if (!element?.isMounted) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
        }
      });
      const elementIds:{ frameId:string, elementId:string }[] = [];
      const collectElements = Object.values(this.elements);
      collectElements.forEach((element) => {
        element.isValidElement();
      });
      const resolvedOptions = this.validateCollectOptions(options);
      this.elementsList.forEach((element) => {
        elementIds.push({
          frameId: this.tempElements.elementName,
          elementId: element.elementName ?? '',
        });
      });
      const client = Client.fromJSON(this.metaData.clientJSON) as any;
      const clientId = client.toJSON()?.metaData?.uuid || '';
      this.getSkyflowBearerToken()?.then((authToken) => {
        printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        this.emitEvent(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + this.containerId, {
          data: {
            type: COLLECT_TYPES.COLLECT,
            // Spread the normalized options bag as an index-signature type so the
            // payload stays assignable; `tokens` is already resolved inside
            // validateCollectOptions.
            ...(resolvedOptions as Record<string, any>),
            elementIds,
            containerId: this.containerId,
          },
          clientConfig: {
            vaultURL: this.metaData.clientJSON.config.vaultURL,
            vaultID: this.metaData.clientJSON.config.vaultID,
            authToken,
          },
          errorMessages: this.customErrorMessages,
        });
      }).catch((err:any) => {
        printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
        reject(err);
      });
      window.addEventListener('message', (event) => {
        if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
          if (event?.data?.type
              === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + this.containerId) {
            const data = event.data.data;
            if (!data || data?.error) {
              printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
              reject(this.wrapCollectError(data?.error));
            } else if (data?.records) {
              printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                MessageType.LOG,
                this.context.logLevel);
              resolve(data);
            } else {
              printLog(`${JSON.stringify(data)}`, MessageType.ERROR, this.context.logLevel);
              reject(data);
            }
          }
        }
      });
      printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
        CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
      MessageType.LOG, this.context.logLevel);
    } catch (err:any) {
      printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
      reject(err);
    }
  });

  // ---- Injected divergence (see class doc) --------------------------------
  // create() input validator: privacyDB validates table/skyflowID, flowDB
  // validates tableName/skyflowId (each forwards to its own package validator).
  protected abstract validateCreateInput(input: TCreateInput): void;

  // The one variant identity field folded into the element descriptor from a
  // create() call: flowDB `{ table: input.tableName }` (client tableName →
  // internal table); privacyDB adds none (returns {}).
  protected abstract buildCreateElementFields(
    input: TCreateInput,
    options: TCreateOptions,
  ): Record<string, unknown>;

  // Single collect-options seam (mirrors CoreCollectContainer.validateCollectOptions):
  // validates the options AND resolves the emitted `tokens` value, returning a
  // normalized copy (never mutates the caller's object). Because `TOptions extends
  // ICollectOptionsBase` (a structural marker), the divergent fields are read
  // through a local cast, not the bound. Base default = privacyDB; flowDB overrides
  // to force tokens on while keeping field validation, and maps errors via
  // wrapCollectError.
  // eslint-disable-next-line class-methods-use-this
  protected validateCollectOptions(options: TOptions): TOptions {
    const opts = options as { tokens?: boolean; additionalFields?: any; upsert?: any[] };
    if (Object.prototype.hasOwnProperty.call(opts, 'tokens') && !validateBooleanOptions(opts.tokens)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT, [], true);
    }
    if (opts.additionalFields) {
      validateAdditionalFieldsInCollect(opts.additionalFields);
    }
    if (opts.upsert) {
      validateUpsertOptions(opts.upsert);
    }
    return { ...options, tokens: opts.tokens !== undefined ? opts.tokens : true } as TOptions;
  }

  // Error mapping: identity for privacyDB, SkyflowFlowDBError for flowDB.
  // eslint-disable-next-line class-methods-use-this
  protected wrapCollectError(err: any): any {
    return err;
  }

  // Registered from registerReadyListener (prototype method, available during
  // super()); relays element-option updates to the mounted controller element.
  protected updateListeners(): void {
    this.eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS, (data) => {
      let elementIndex;
      const elementList = this.elementsList.map((element, index) => {
        if (element.elementName === data.elementName) {
          elementIndex = index;
          return {
            elementName: element.elementName,
            ...data.elementOptions,
          };
        }
        return element;
      });

      if (this.containerElement) {
        this.containerElement.updateElement({
          ...elementList[elementIndex],
        });
      }
    });
  }
}
export default CoreComposableCollectContainer;
