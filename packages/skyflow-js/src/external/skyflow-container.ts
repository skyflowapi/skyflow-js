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
  detokenize(detokenizeInput: IDetokenizeInput): Promise<DetokenizeResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.client.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.context.logLevel);

          validateDetokenizeInput(detokenizeInput);
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
              {
                type: PUREJS_TYPES.DETOKENIZE,
                records: detokenizeInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.DETOKENIZE),
          MessageType.LOG, this.context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.context.logLevel);
          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);

        validateDetokenizeInput(detokenizeInput);
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
                {
                  type: PUREJS_TYPES.DETOKENIZE,
                  records: detokenizeInput.records,
                },
                (revealData: any) => {
                  if (revealData.error) reject(revealData.error);
                  else resolve(revealData);
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.DETOKENIZE),
        MessageType.LOG, this.context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  insert(records: IInsertRecordInput, options?:IInsertOptions): Promise<InsertResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.client.config);
        try {
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
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) {
                  printLog(`${JSON.stringify(insertedData.error)}`, MessageType.ERROR, this.context.logLevel);
                  reject(insertedData.error);
                } else resolve(insertedData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.INSERT),
          MessageType.LOG, this.context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.context.logLevel);

          reject(e);
        }
      });
    }
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
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
                {
                  type: PUREJS_TYPES.INSERT,
                  records,
                  options,
                },
                (insertedData: any) => {
                  if (insertedData.error) {
                    printLog(`${JSON.stringify(insertedData.error)}`, MessageType.ERROR, this.context.logLevel);
                    reject(insertedData.error);
                  } else resolve(insertedData);
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.INSERT),
        MessageType.LOG, this.context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  update(record: IUpdateRequest, options?: IUpdateOptions): Promise<UpdateResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
            this.context.logLevel);

          validateUpdateRecord(record, options);

          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
              {
                type: PUREJS_TYPES.UPDATE,
                record,
                options,
              },
              (updatedData: any) => {
                if (updatedData.error) {
                  printLog(`${JSON.stringify(updatedData.error)}`, MessageType.ERROR, this.context.logLevel);
                  reject(updatedData.error);
                } else resolve(updatedData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.UPDATE),
          MessageType.LOG, this.context.logLevel);
        } catch (e: any) {
          printLog(e.message, MessageType.ERROR, this.context.logLevel);
          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.context.logLevel);

        validateUpdateRecord(record, options);

        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
                {
                  type: PUREJS_TYPES.UPDATE,
                  record,
                  options,
                },
                (updatedData: any) => {
                  if (updatedData.error) {
                    printLog(`${JSON.stringify(updatedData.error)}`, MessageType.ERROR, this.context.logLevel);
                    reject(updatedData.error);
                  } else resolve(updatedData);
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.UPDATE),
        MessageType.LOG, this.context.logLevel);
      } catch (e: any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }

  getById(getByIdInput: IGetByIdInput): Promise<GetByIdResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.context.logLevel);

          validateGetByIdInput(getByIdInput);

          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
              {
                type: PUREJS_TYPES.GET_BY_SKYFLOWID,
                records: getByIdInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
            CLASS_NAME, PUREJS_TYPES.GET_BY_SKYFLOWID),
          MessageType.LOG, this.context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT,
          CLASS_NAME), MessageType.LOG,
        this.context.logLevel);

        validateGetByIdInput(getByIdInput);
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
                {
                  type: PUREJS_TYPES.GET_BY_SKYFLOWID,
                  records: getByIdInput.records,
                },
                (revealData: any) => {
                  if (revealData.error) reject(revealData.error);
                  else resolve(revealData);
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
          CLASS_NAME, PUREJS_TYPES.GET_BY_SKYFLOWID),
        MessageType.LOG, this.context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);

        reject(e);
      }
    });
  }

  get(getInput: IGetInput, options?: IGetOptions): Promise<GetResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.context.logLevel);
          validateGetInput(getInput, options);
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
              {
                type: PUREJS_TYPES.GET,
                records: getInput.records,
                options,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
            CLASS_NAME, PUREJS_TYPES.GET),
          MessageType.LOG, this.context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT,
          CLASS_NAME), MessageType.LOG,
        this.context.logLevel);

        validateGetInput(getInput, options);
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
                {
                  type: PUREJS_TYPES.GET,
                  records: getInput.records,
                  options,
                },
                (revealData: any) => {
                  if (revealData.error) reject(revealData.error);
                  else resolve(revealData);
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
          CLASS_NAME, PUREJS_TYPES.GET),
        MessageType.LOG, this.context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);

        reject(e);
      }
    });
  }

  delete(records: IDeleteRecordInput, options?: IDeleteOptions): Promise<DeleteResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.client.config);
        try {
          printLog(
            parameterizedString(logs.infoLogs.VALIDATE_DELETE_INPUT, CLASS_NAME), MessageType.LOG,
            this.context.logLevel,
          );

          validateDeleteRecords(records, options);
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
              {
                type: PUREJS_TYPES.DELETE,
                records,
                options,
              },
              (deletedData: any) => {
                if (deletedData.error) {
                  printLog(`${JSON.stringify(deletedData.error)}`, MessageType.ERROR, this.context.logLevel);
                  reject(deletedData.error);
                } else {
                  resolve(deletedData);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.DELETE),
          MessageType.LOG, this.context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.context.logLevel);

        validateDeleteRecords(records, options);
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.containerId,
                {
                  type: PUREJS_TYPES.DELETE,
                  records,
                  options,
                },
                (deletedData: any) => {
                  if (deletedData.error) {
                    printLog(`${JSON.stringify(deletedData.error)}`, MessageType.ERROR, this.context.logLevel);
                    reject(deletedData.error);
                  } else resolve(deletedData);
                },
              );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.DELETE),
        MessageType.LOG, this.context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.context.logLevel);
        reject(e);
      }
    });
  }
}
export default SkyflowContainer;
