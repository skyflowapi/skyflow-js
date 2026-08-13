/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB public Skyflow shell. The constructor, `static init()`, the
// bearer-token plumbing, the `container()` overloads/switch and the shared static
// enum getters all live in `@core/external/base-skyflow`; this subclass supplies
// only what is genuinely privacyDB-specific:
//   - the five container factory hooks (which concrete class to `new`)
//   - the pure-JS API surface (insert/detokenize/getById/get/delete/update),
//     which flowDB does not have
//   - `static get Error()` (SkyflowError) and `static get ThreeDS()`
import Client from '@core/client';
import { setVariantAdapter } from '@core/adapters';
import SkyflowError from '@core/errors';
import BaseSkyflow from '@core/external/base-skyflow';
import {
  ContainerOptions,
  ContainerType,
  Context,
  ICoreMetadata,
  ISkyflow,
  SkyflowConfigOptions,
} from '@core/types';
import logs from '@core/utils/logs';
import RevealContainer from './external/reveal/reveal-container';
import CollectContainer from './external/collect/collect-container';
import SkyflowContainer from './external/skyflow-container';
import { printLog, parameterizedString } from './utils/logs-helper';
import {
  IInsertRecordInput,
  IDetokenizeInput,
  IGetInput,
  MessageType,
  IGetByIdInput,
  IInsertOptions,
  IDeleteRecordInput,
  IDeleteOptions,
  IGetOptions,
  InsertResponse,
  GetResponse,
  GetByIdResponse,
  DeleteResponse,
  DetokenizeResponse,
  IUpdateRequest,
  UpdateResponse,
  IUpdateOptions,
} from './utils/common';
import ComposableContainer from './external/collect/compose-collect-container';
import ThreeDS from './external/threeds/threeds';
import ComposableRevealContainer from './external/reveal/composable-reveal-container';
import skyflowVariantAdapter from './variant-adapter';

// Register this package's variant behaviour with the shared @core layer once,
// at module load. The main-thread SDK entry points (index.ts, index-node.ts,
// index-internal.ts) all import this module, so the adapter is registered
// before any @core code that reads it (e.g. @core/metrics) runs.
setVariantAdapter(skyflowVariantAdapter);

// Relocated to @core/types (variant-neutral); re-exported here under the same
// names so `./skyflow` importers and the public surface are unchanged.
export { ContainerType, ISkyflow, SkyflowConfigOptions };

const CLASS_NAME = 'Skyflow';
class Skyflow extends BaseSkyflow<
SkyflowContainer,
CollectContainer,
RevealContainer,
ComposableContainer,
ComposableRevealContainer
> {
  // ---- Injected divergence: which concrete class to `new` --------------------
  // Prototype methods, not arrow-function fields — `instantiateSkyflowContainer`
  // is called from the base constructor, before subclass fields initialize.

  // eslint-disable-next-line class-methods-use-this
  protected instantiateSkyflowContainer(client: Client, context: Context): SkyflowContainer {
    return new SkyflowContainer(client, context);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createCollectContainer(
    metaData: ICoreMetadata,
    skyflowElements: any[],
    context: Context,
    options?: ContainerOptions,
  ): CollectContainer {
    return new CollectContainer(metaData, skyflowElements, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createRevealContainer(
    metaData: ICoreMetadata,
    skyflowElements: any[],
    context: Context,
    options?: ContainerOptions,
  ): RevealContainer {
    return new RevealContainer(metaData, skyflowElements, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createComposableContainer(
    metaData: ICoreMetadata,
    skyflowElements: any[],
    context: Context,
    options: ContainerOptions,
  ): ComposableContainer {
    return new ComposableContainer(metaData, skyflowElements, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createComposeRevealContainer(
    metaData: ICoreMetadata,
    skyflowElements: any[],
    context: Context,
    options?: ContainerOptions,
  ): ComposableRevealContainer {
    return new ComposableRevealContainer(metaData, skyflowElements, context, options);
  }

  // ---- privacyDB-only pure-JS API -------------------------------------------

  insert(
    records: IInsertRecordInput,
    options?: IInsertOptions,
  ): Promise<InsertResponse> {
    printLog(parameterizedString(logs.infoLogs.INSERT_TRIGGERED, CLASS_NAME), MessageType.LOG,
      this.logLevel);
    return this.skyflowContainer.insert(records, options);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<DetokenizeResponse> {
    printLog(parameterizedString(logs.infoLogs.DETOKENIZE_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.logLevel);
    return this.skyflowContainer.detokenize(detokenizeInput);
  }

  getById(getByIdInput: IGetByIdInput): Promise<GetByIdResponse> {
    printLog(logs.warnLogs.GET_BY_ID_DEPRECATED, MessageType.WARN, this.logLevel);
    printLog(parameterizedString(logs.infoLogs.GET_BY_ID_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.logLevel);
    return this.skyflowContainer.getById(getByIdInput);
  }

  get(getInput: IGetInput, options?: IGetOptions): Promise<GetResponse> {
    printLog(parameterizedString(logs.infoLogs.GET_TRIGGERED, CLASS_NAME),
      MessageType.LOG, this.logLevel);
    return this.skyflowContainer.get(getInput, options);
  }

  delete(records: IDeleteRecordInput, options?: IDeleteOptions): Promise<DeleteResponse> {
    printLog(parameterizedString(logs.infoLogs.DELETE_TRIGGERED, CLASS_NAME), MessageType.LOG,
      this.logLevel);
    return this.skyflowContainer.delete(records, options);
  }

  update(record: IUpdateRequest, options?: IUpdateOptions): Promise<UpdateResponse> {
    printLog(parameterizedString(logs.infoLogs.UPDATE_TRIGGERED, CLASS_NAME), MessageType.LOG,
      this.logLevel);
    return this.skyflowContainer.update(record, options);
  }

  // ---- Package-specific statics (the rest are inherited from BaseSkyflow) ----

  static get Error() {
    return SkyflowError;
  }

  static get ThreeDS() {
    return ThreeDS;
  }
}
export default Skyflow;
