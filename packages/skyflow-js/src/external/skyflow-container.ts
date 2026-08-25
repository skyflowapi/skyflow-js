/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import properties from '@core/properties';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  PUREJS_TYPES,
} from '@core/constants';
import logs from '@core/utils/logs';
import CoreSkyflowContainer from '@core/external/skyflow-container';
import {
  validateInsertRecords,
  validateDetokenizeInput,
  validateInitConfig,
  validateGetInput,
  validateGetByIdInput,
  validateUpsertOptions,
  validateDeleteRecords,
  validateUpdateRecord,
} from '../utils/validators';
import {
  printLog,
  parameterizedString,
} from '../utils/logs-helper';
import {
  IDetokenizeInput,
  IGetInput,
  MessageType,
  IGetByIdInput,
  IInsertOptions,
  IDeleteOptions,
  IDeleteRecordInput,
  IGetOptions,
  InsertResponse,
  GetByIdResponse,
  GetResponse,
  DeleteResponse,
  IInsertRecordInput,
  DetokenizeResponse,
  IUpdateRequest,
  UpdateResponse,
  IUpdateOptions,
} from '../utils/common';

const CLASS_NAME = 'SkyflowContainer';
// privacyDB SkyflowContainer: the shared @core controller-frame bootstrap base
// (constructor + `isControllerFrameReady`) plus the pure-JS data methods that
// flowDB does not expose.
class SkyflowContainer extends CoreSkyflowContainer {
  // Fire a pure-JS request to the controller frame. When the frame is already
  // ready the request emits immediately; otherwise it is deferred until the
  // PUREJS_FRAME_READY handshake fires. `logError` mirrors the historical
  // per-method behaviour: insert/update/delete log the error envelope before
  // rejecting, the read paths (detokenize/get/getById) do not.
  private emitPureJsRequest(
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
    type: string,
    payload: Record<string, any>,
    logError: boolean = false,
  ): void {
    const emit = () => {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .emit(
          ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
          {
            type,
            ...payload,
          },
          (responseData: any) => {
            if (responseData.error) {
              if (logError) {
                printLog(`${JSON.stringify(responseData.error)}`,
                  MessageType.ERROR, this.context.logLevel);
              }
              reject(responseData.error);
            } else resolve(responseData);
          },
        );
    };
    if (this.isControllerFrameReady) {
      emit();
    } else {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, emit);
    }
    // Emitted synchronously in both branches, preserving the original log timing.
    printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME, type),
      MessageType.LOG, this.context.logLevel);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<DetokenizeResponse> {
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);

        validateDetokenizeInput(detokenizeInput);
        this.emitPureJsRequest(resolve, reject, PUREJS_TYPES.DETOKENIZE, {
          records: detokenizeInput.records,
        });
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  insert(records: IInsertRecordInput, options?:IInsertOptions): Promise<InsertResponse> {
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.context.logLevel);
        if (options) {
          options = { ...options, tokens: options?.tokens !== undefined ? options.tokens : true };
        } else {
          options = {
            tokens: true,
          };
        }
        if (options?.upsert) {
          validateUpsertOptions(options.upsert);
        }
        validateInsertRecords(records, options);
        this.emitPureJsRequest(resolve, reject, PUREJS_TYPES.INSERT, {
          records,
          options,
        }, true);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  update(record: IUpdateRequest, options?: IUpdateOptions): Promise<UpdateResponse> {
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.context.logLevel);

        validateUpdateRecord(record, options);
        this.emitPureJsRequest(resolve, reject, PUREJS_TYPES.UPDATE, {
          record,
          options,
        }, true);
      } catch (e: any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  getById(getByIdInput: IGetByIdInput): Promise<GetByIdResponse> {
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);

        validateGetByIdInput(getByIdInput);
        this.emitPureJsRequest(resolve, reject, PUREJS_TYPES.GET_BY_SKYFLOWID, {
          records: getByIdInput.records,
        });
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  get(getInput: IGetInput, options?: IGetOptions): Promise<GetResponse> {
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);

        validateGetInput(getInput, options);
        this.emitPureJsRequest(resolve, reject, PUREJS_TYPES.GET, {
          records: getInput.records,
          options,
        });
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  delete(records: IDeleteRecordInput, options?: IDeleteOptions): Promise<DeleteResponse> {
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(
          parameterizedString(logs.infoLogs.VALIDATE_DELETE_INPUT, CLASS_NAME), MessageType.LOG,
          this.context.logLevel,
        );

        validateDeleteRecords(records, options);
        this.emitPureJsRequest(resolve, reject, PUREJS_TYPES.DELETE, {
          records,
          options,
        }, true);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }
}
export default SkyflowContainer;
