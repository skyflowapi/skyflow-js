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
  ElementType,
} from './utils/common';
import ComposableContainer from './external/collect/compose-collect-container';
import ThreeDS from './external/threeds/threeds';
import ComposableRevealContainer from './external/reveal/composable-reveal-container';

// Relocated to @core/types (variant-neutral); re-exported here under the same
// names so `./skyflow` importers and the public surface are unchanged.
export { ContainerType };
export type { ISkyflow, SkyflowConfigOptions };

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
    context: Context,
    options?: ContainerOptions,
  ): CollectContainer {
    return new CollectContainer(metaData, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createRevealContainer(
    metaData: ICoreMetadata,
    context: Context,
    options?: ContainerOptions,
  ): RevealContainer {
    return new RevealContainer(metaData, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createComposableContainer(
    metaData: ICoreMetadata,
    context: Context,
    options: ContainerOptions,
  ): ComposableContainer {
    return new ComposableContainer(metaData, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createComposeRevealContainer(
    metaData: ICoreMetadata,
    context: Context,
    options?: ContainerOptions,
  ): ComposableRevealContainer {
    return new ComposableRevealContainer(metaData, context, options);
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

  // privacyDB's ElementType (base + file elements). Overrides the removed @core
  // base getter so `Skyflow.ElementType.FILE_INPUT` stays available for privacyDB.
  static get ElementType() {
    return ElementType;
  }
}
export default Skyflow;
