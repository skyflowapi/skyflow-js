/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import deepClone from '@core/libs/deep-clone';
import uuid from '@core/libs/uuid';
import EventEmitter from '@core/event-emitter';
import iframer, { setAttributes, getIframeSrc, setStyles } from '@core/iframe-libs/iframer';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES, ELEMENT_EVENTS_TO_IFRAME,
  ELEMENTS, FRAME_ELEMENT,
  COLLECT_TYPES,
  ElementType,
} from '@core/constants';
import properties from '@core/properties';
import Container from '@core/external/common/container';
import SkyflowError from '@core/errors';
import {
  validateElementOptions,
  formatValidations,
  formatOptions,
} from '@core/libs/element-options';
import CollectElement from '@core/external/collect/collect-element';
import {
  ContainerType, Context, MessageType,
  CollectElementInput,
  ICollectElementOptionsBase,
  ContainerOptions,
  ErrorType,
  ICoreMetadata,
  ISkyflowElement,
  ICollectOptionsBase,
  ICollectResponseBase,
  ICollectElementUpdateOptionsBase,
  VariantCollectAdapter,
} from '@core/types';
import { printLog, parameterizedString } from '@core/utils/logs-helper';
import {
  validateInitConfig,
  validateAdditionalFieldsInCollect,
  validateUpsertOptions,
  validateBooleanOptions,
} from '@core/validators';

// Variant-neutral collect-element descriptor base. Omits the identity key that
// diverges by package — privacyDB `table` vs flowDB `tableName` — which each
// package's own `ICollectElement extends ICollectElementBase` adds. `column` is
// the shared column key.
export interface ICollectElementBase {
  elementType: ElementType;
  elementName: string;
  name: string;
  column?: string;
  sensitive?: boolean;
  replacePattern?: RegExp;
  mask?: string[];
  value?: string;
  isMounted: boolean;
  [key: string]: unknown;
}

export interface ElementGroupItem extends CollectElementInput, ICollectElementOptionsBase {
  elementType: ElementType;
  name?: string;
  accept?: string[];
  elementName?: string;
  // Internal identity keys. `table` is canonical (both packages remap to it in
  // create()); the skyflow-id key is variant (privacyDB `skyflowID` / flowDB
  // `skyflowId`) and read via getVariantAdapter().collect.skyflowIdKey. `tableName`
  // may linger from the flowDB input spread before the tableName→table remap.
  table?: string;
  skyflowID?: string;
  skyflowId?: string;
  tableName?: string;
}

export interface ElementGroup {
  rows: Array<{
    elements: Array<ElementGroupItem>;
  }>;
}

const CLASS_NAME = 'CollectContainer';
// Shared collect-container base. Owns the controller-frame bootstrap, the
// element lifecycle (create + createMultipleElement + stale-element cleanup) and
// the collect() orchestration common to both SDKs. Generic over the collect()
// options (TOptions) and response (TResponse), plus the public create() input
// (TCreateInput) and options (TCreateOptions) so each package keeps its own
// consumer-facing typing (privacyDB table/skyflowID + file options, flowDB
// tableName/skyflowId). Divergence is injected via hooks: validateCollectOptions
// (token handling) and wrapCollectError (error mapping); the create() input
// validator (validateCreateInput) and its one variant identity field
// (buildCreateElementFields — privacyDB `accept`, flowDB `table`); the
// skyflowID vs skyflowId wire key is read from the VariantAdapter. Only the
// privacyDB-only uploadFiles stays in the subclass. The element interfaces are
// defined here and re-exported by each package's subclass (imported as
// './collect-container' by compose-collect).
abstract class CollectContainer<
  TOptions extends ICollectOptionsBase,
  TResponse extends ICollectResponseBase,
  TUpdateOptions extends ICollectElementUpdateOptionsBase,
  TCreateInput extends CollectElementInput,
  TCreateOptions extends ICollectElementOptionsBase,
> extends Container {
  protected containerId: string;

  // Package-specific collect key strategy (privacyDB vs flowDB `skyflowId`/`table`
  // naming). Abstract — each package MUST supply it; there is no default, so a
  // missing implementation is a compile error, not a silent privacyDB fallback.
  // Read here (skyflowIdKey) and injected into every CollectElement this container
  // builds, replacing the former global getVariantAdapter().collect lookup.
  protected abstract collectVariant: VariantCollectAdapter;

  protected elements: Record<string, CollectElement<TUpdateOptions>> = {};

  protected metaData: ICoreMetadata;

  protected context: Context;

  #skyflowElements: Record<string, ISkyflowElement>;

  type:string = ContainerType.COLLECT;

  #eventEmitter: EventEmitter;

  #isMounted: boolean = false;

  protected isSkyflowFrameReady: boolean = false;

  protected customErrorMessages: Partial<Record<ErrorType, string>> = {};

  constructor(
    metaData: ICoreMetadata,
    skyflowElements: Record<string, ISkyflowElement>,
    context: Context,
    options?: ContainerOptions,
  ) {
    super();
    this.isSkyflowFrameReady = metaData.skyflowContainer.isControllerFrameReady;
    this.containerId = uuid();
    this.metaData = {
      ...metaData,
      clientJSON: {
        ...metaData.clientJSON,
        config: {
          ...metaData.clientJSON.config,
          options: {
            ...metaData.clientJSON.config?.options,
            ...options,
          },
        },
      },
    };
    this.#skyflowElements = skyflowElements;
    this.context = context;
    this.#eventEmitter = new EventEmitter();

    const clientDomain = this.metaData.clientDomain || '';
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.containerId}:${this.context.logLevel}:${btoa(clientDomain)}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, CLASS_NAME),
      MessageType.LOG,
      this.context.logLevel);

    this.#isMounted = true;
  }

  // Shared create() orchestration. The two packages differed only in the input
  // validator and a single identity field on the element descriptor, both now
  // injected via hooks (validateCreateInput / buildCreateElementFields), so the
  // body is single-sourced here. Typed over TCreateInput/TCreateOptions so each
  // package's public signature keeps its own input/options keys.
  create = (
    input: TCreateInput,
    options: TCreateOptions = { required: false } as TCreateOptions,
  ): CollectElement<TUpdateOptions> => {
    this.validateCreateInput(input);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.context.logLevel);

    const elementGroup: ElementGroup = {
      rows: [{
        elements: [{
          elementType: input.type,
          name: input.column,
          ...input,
          ...this.buildCreateElementFields(input, options),
          ...formattedOptions,
          validations,
        }],
      }],
    };

    return this.createMultipleElement(elementGroup, true);
  };

  setError(errors: Partial<Record<ErrorType, string>>) {
    this.customErrorMessages = errors;
  }

  protected createMultipleElement = (
    multipleElements: ElementGroup,
    isSingleElementAPI: boolean = false,
  ): CollectElement<TUpdateOptions> => {
    const elements: any[] = [];
    const tempElements = deepClone(multipleElements);

    tempElements.rows.forEach((row) => {
      row.elements.forEach((element) => {
        const options = element;
        const { elementType } = options;
        validateElementOptions(elementType, options);

        options.sensitive = options.sensitive || ELEMENTS[elementType].sensitive;
        options.replacePattern = options.replacePattern || ELEMENTS[elementType].replacePattern;
        options.mask = options.mask || ELEMENTS[elementType].mask;

        // options.elementName = `${options.table}.${options.name}:${btoa(uuid())}`;
        // options.elementName = (options.table && options.name) ? `${options.elementType}:${btoa(
        //   options.elementName,
        // )}` : `${options.elementType}:${btoa(uuid())}`;

        options.isMounted = false;

        if (
          options.elementType === ELEMENTS.radio.name
          || options.elementType === ELEMENTS.checkbox.name
        ) {
          options.elementName = `${options.elementName}:${btoa(options.value)}`;
        }

        options.elementName = `${FRAME_ELEMENT}:${options.elementType}:${btoa(uuid())}`;
        options.label = element.label;
        // skyflowID (privacyDB) vs skyflowId (flowDB) is a wire-key contract; the
        // active key comes from the registered VariantAdapter.
        options.skyflowID = element[this.collectVariant.skyflowIdKey];

        elements.push(options);
      });
    });

    tempElements.elementName = isSingleElementAPI
      ? elements[0].elementName
      : `${FRAME_ELEMENT}:group:${btoa(tempElements.name)}`;

    if (
      isSingleElementAPI
      && !this.elements[elements[0].elementName]
      && this.#hasElementName(elements[0].name)
    ) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.UNIQUE_ELEMENT_NAME, [`${elements[0].name}`], true);
    }

    let element = this.elements[tempElements.elementName];
    if (element) {
      if (isSingleElementAPI) {
        element.updateElementGroup(elements[0]);
      } else {
        element.updateElementGroup(tempElements);
      }
    } else {
      const elementId = uuid();
      element = new CollectElement<TUpdateOptions>(
        elementId,
        tempElements,
        this.metaData,
        {
          containerId: this.containerId,
          isMounted: this.#isMounted,
          type: this.type,
        },
        isSingleElementAPI,
        this.#destroyCallback,
        this.#updateCallback,
        this.context,
        this.collectVariant,
        this.#eventEmitter,
      );
      this.elements[tempElements.elementName] = element;
      this.#skyflowElements[elementId] = element;
    }

    if (!isSingleElementAPI) {
      elements.forEach((iElement) => {
        const name = iElement.elementName;
        if (!this.elements[name]) {
          this.elements[name] = this.create(iElement.elementType, iElement);
        } else {
          this.elements[name].updateElementGroup(iElement);
        }
      });
    }
    return element;
  };

  #removeElement = (elementName: string) => {
    Object.keys(this.elements).forEach((element) => {
      if (element === elementName) delete this.elements[element];
    });
  };

  #destroyCallback = (elementNames: string[]) => {
    elementNames.forEach((elementName) => {
      this.#removeElement(elementName);
    });
  };

  #updateCallback = (elements: any[]) => {
    elements.forEach((element) => {
      if (this.elements[element.elementName]) {
        this.elements[element.elementName].updateElementGroup(element);
      }
    });
  };

  #hasElementName = (name: string) => {
    const tempElements = Object.keys(this.elements);
    for (let i = 0; i < tempElements.length; i += 1) {
      if (atob(tempElements[i].split(':')[2]) === name) {
        return true;
      }
    }
    return false;
  };

  collect = (options: TOptions = {} as TOptions): Promise<TResponse> => {
    this.isSkyflowFrameReady = this.metaData.skyflowContainer.isControllerFrameReady;
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.metaData.clientJSON.config);
        if (Object.keys(this.elements).length === 0) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
        }
        this.removeStaleElements();
        const collectElements = Object.values(this.elements);
        const elementIds = Object.keys(this.elements)
          .map((element) => ({ frameId: element, elementId: element }));
        collectElements.forEach((element) => {
          if (!element.isMounted()) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
          }
          element.isValidElement();
        });
        const resolvedOptions = this.validateCollectOptions(options);

        const emit = () => {
          bus
          // .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.metaData.uuid,
              {
                type: COLLECT_TYPES.COLLECT,
                // Spread the normalized options bag as an index-signature type so
                // the framebus payload stays assignable (the emit arg is untyped).
                // `tokens` is already resolved inside validateCollectOptions.
                ...(resolvedOptions as Record<string, any>),
                elementIds,
                containerId: this.containerId,
                errorMessages: this.customErrorMessages,
              },
              (data: any) => {
                if (!data || data?.error) {
                  printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
                  reject(this.wrapCollectError(data?.error));
                } else {
                  printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.context.logLevel);
                  resolve(data);
                }
              },
            );
        };

        if (this.isSkyflowFrameReady) {
          emit();
          // EMIT_EVENT logged synchronously in the ready path only, preserving the
          // original log timing (the deferred not-ready path never logged it).
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
          MessageType.LOG, this.context.logLevel);
        } else {
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.containerId, emit);
        }
      } catch (err: any) {
        printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
        reject(err);
      }
    });
  };

  protected removeStaleElements = (): void => {
    try {
      if (this.#hasNoElements()) return;

      const mountedIframeIds = this.#getMountedIframeIds();
      if (!mountedIframeIds.length) return;

      this.#removeUnmountedElements(mountedIframeIds);
    } catch (error: unknown) {
      printLog(`${error}`, MessageType.LOG, this.context.logLevel);
    }
  };

  #hasNoElements = (): boolean => Object.keys(this.elements).length === 0;

  #getMountedIframeIds = (): string[] => {
    const body = document?.body;
    if (!body) return [];

    const iframes = body.getElementsByTagName('iframe');
    if (!iframes?.length) return [];

    return Array.from(iframes).map((iframe) => iframe.id);
  };

  #removeUnmountedElements = (mountedIframeIds: string[]): void => {
    Object.entries(this.elements).forEach(([key, element]) => {
      if (this.#shouldRemoveElement(element, mountedIframeIds)) {
        delete this.elements[key];
      }
    });
  };

  #shouldRemoveElement = (
    element: CollectElement<TUpdateOptions>,
    mountedIframeIds: string[],
  ): boolean => (
    element.isMounted()
    && !mountedIframeIds.includes(element.iframeName())
  );

  // ---- Injected divergence (see class doc) --------------------------------
  // create() input validator: privacyDB validates table/skyflowID, flowDB
  // validates tableName/skyflowId (each forwards to its own package validator).
  protected abstract validateCreateInput(input: TCreateInput): void;

  // The one variant identity field folded into the element descriptor from a
  // create() call: privacyDB `{ accept: options.allowedFileType }` (file API),
  // flowDB `{ table: input.tableName }` (client tableName → internal table).
  protected abstract buildCreateElementFields(
    input: TCreateInput,
    options: TCreateOptions,
  ): Record<string, unknown>;

  // Single collect-options seam: validates the options AND resolves the emitted
  // `tokens` value, returning a normalized copy (never mutates the caller's
  // object). Because `TOptions extends ICollectOptionsBase` (a structural marker),
  // the divergent fields are read through a local cast, not the bound.
  // Base default = privacyDB: validate a provided `tokens` boolean, validate
  // additionalFields/upsert, default tokens to true. flowDB overrides to skip
  // token validation and force tokens on while keeping field validation.
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
}
export default CollectContainer;
