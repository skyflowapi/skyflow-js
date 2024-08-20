/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import Client from '../../client';
import iframer, {
  getIframeSrc,
  setAttributes,
  setStyles,
} from '../../iframe-libs/iframer';
import properties from '../../properties';
import {
  validateInsertRecords,
  validateDetokenizeInput,
  validateInitConfig,
  validateGetInput,
  validateGetByIdInput,
  validateUpsertOptions,
  validateDeleteRecords,
  validateRenderElementRecord,
} from '../../utils/validators';
import {
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  SKYFLOW_FRAME_CONTROLLER,
  PUREJS_TYPES,
} from '../constants';
import {
  printLog,
  parameterizedString,
} from '../../utils/logs-helper';
import logs from '../../utils/logs';
import {
  IDetokenizeInput,
  IGetInput,
  Context,
  MessageType,
  IGetByIdInput,
  IInsertOptions,
  IDeleteOptions,
  IDeleteRecordInput,
  IGetOptions,
} from '../../utils/common';
import { formatForRenderClient } from '../../core-utils/reveal';

const CLASS_NAME = 'SkyflowContainer';
class SkyflowContainer {
  #containerId: string;

  #client: Client;

  #isControllerFrameReady: boolean = false;

  #context: Context;

  #clientDomain: string;

  constructor(client, context) {
    this.#client = client;
    this.#containerId = this.#client.toJSON()?.metaData?.uuid || '';
    this.#context = context;
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/') || '';
    const iframe = iframer({
      name: `${SKYFLOW_FRAME_CONTROLLER}:${this.#containerId}:${btoa(this.#clientDomain)}`,
      referrer: this.#clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PUREJS_FRAME, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        callback({
          client: this.#client,
          context,
        });
        this.#isControllerFrameReady = true;
      });
    printLog(parameterizedString(logs.infoLogs.PUREJS_CONTROLLER_INITIALIZED, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#client.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateDetokenizeInput(detokenizeInput);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
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
          MessageType.LOG, this.#context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);
          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);

        validateDetokenizeInput(detokenizeInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
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
        MessageType.LOG, this.#context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);
        reject(e);
      }
    });
  }

  insert(records, options?:IInsertOptions): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
            this.#context.logLevel);
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
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) {
                  printLog(`${JSON.stringify(insertedData.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(insertedData.error);
                } else resolve(insertedData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.INSERT),
          MessageType.LOG, this.#context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.#context.logLevel);

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
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) {
                  printLog(`${JSON.stringify(insertedData.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(insertedData.error);
                } else resolve(insertedData);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.INSERT),
        MessageType.LOG, this.#context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);
        reject(e);
      }
    });
  }

  getById(getByIdInput: IGetByIdInput) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateGetByIdInput(getByIdInput);

          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
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
          MessageType.LOG, this.#context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT,
          CLASS_NAME), MessageType.LOG,
        this.#context.logLevel);

        validateGetByIdInput(getByIdInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
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
        MessageType.LOG, this.#context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);

        reject(e);
      }
    });
  }

  get(getInput: IGetInput, options?: IGetOptions) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          validateGetInput(getInput, options);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
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
          MessageType.LOG, this.#context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT,
          CLASS_NAME), MessageType.LOG,
        this.#context.logLevel);

        validateGetInput(getInput, options);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
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
        MessageType.LOG, this.#context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);

        reject(e);
      }
    });
  }

  delete(records: IDeleteRecordInput, options?: IDeleteOptions) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(
            parameterizedString(logs.infoLogs.VALIDATE_DELETE_INPUT, CLASS_NAME), MessageType.LOG,
            this.#context.logLevel,
          );

          validateDeleteRecords(records, options);
          bus
            // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.DELETE,
                records,
                options,
              },
              (deletedData: any) => {
                if (deletedData.error) {
                  printLog(`${JSON.stringify(deletedData.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(deletedData.error);
                } else {
                  resolve(deletedData);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.DELETE),
          MessageType.LOG, this.#context.logLevel);
        } catch (e:any) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.#context.logLevel);

        validateDeleteRecords(records, options);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.DELETE,
                records,
                options,
              },
              (deletedData: any) => {
                if (deletedData.error) {
                  printLog(`${JSON.stringify(deletedData.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(deletedData.error);
                } else resolve(deletedData);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.DELETE),
        MessageType.LOG, this.#context.logLevel);
      } catch (e:any) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);
        reject(e);
      }
    });
  }

  renderFile(recordData, metaData, containerId, iframeName) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#client.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          validateRenderElementRecord(recordData);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + this.#containerId,
              {
                records: recordData,
                containerId,
                iframeName,
              },
              (revealData: any) => {
                if (revealData.errors) {
                  reject(formatForRenderClient(revealData, recordData.column as string));
                } else {
                  resolve(revealData);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
          MessageType.LOG, this.#context.logLevel);
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR,
            this.#context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        validateRenderElementRecord(recordData);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus
              // .target(properties.IFRAME_SECURE_ORGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + this.#containerId,
                {
                  records: recordData,
                  containerId,
                  iframeName,
                },
                (revealData: any) => {
                  if (revealData.errors) {
                    reject(formatForRenderClient(revealData, recordData.column as string));
                  } else {
                    resolve(revealData);
                  }
                },
              );
            printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
              CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
            MessageType.LOG, this.#context.logLevel);
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
          CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
        MessageType.LOG, this.#context.logLevel);
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR,
          this.#context.logLevel);
        reject(err);
      }
    });
  }
}
export default SkyflowContainer;
