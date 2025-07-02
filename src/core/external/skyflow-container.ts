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
  InsertResponse,
  GetByIdResponse,
  GetResponse,
  DeleteResponse,
  IInsertRecordInput,
  DetokenizeResponse,
} from '../../utils/common';

const CLASS_NAME = 'SkyflowContainer';
class SkyflowContainer {
  #containerId: string;

  #client: Client;

  isControllerFrameReady: boolean = false;

  #context: Context;

  constructor(client, context) {
    this.#client = client;
    this.#containerId = this.#client.toJSON()?.metaData?.uuid || '';
    this.#context = context;
    const clientDomain = window.location.origin || '';
    const iframe = iframer({
      name: `${SKYFLOW_FRAME_CONTROLLER}:${this.#containerId}:${btoa(clientDomain)}:${!!this.#client.toJSON()?.config?.options?.trackingKey}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    const iframe2 = document.querySelector('iframe[id*="skyflow_controller"]') as HTMLIFrameElement | null;
    console.log('Found iframe:', iframe2);
    if (iframe2 && iframe2.contentWindow) {
      iframe2.contentWindow.postMessage({
        type: 'collectData1',
        payload: {
          cardNumber: '',
          cvv: '',
          expiryDate: '',
          cardHolderName: '',
        },
      }, '*');
    }

    bus
      .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PUREJS_FRAME, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        callback({
          client: this.#client,
          context,
        });
        this.isControllerFrameReady = true;
      });
    printLog(parameterizedString(logs.infoLogs.PUREJS_CONTROLLER_INITIALIZED, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<DetokenizeResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#client.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateDetokenizeInput(detokenizeInput);
          bus
          // .target(properties.IFRAME_SECURE_ORIGIN)
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
          .target(properties.IFRAME_SECURE_ORIGIN)
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

  insert(records: IInsertRecordInput, options?:IInsertOptions): Promise<InsertResponse> {
    if (this.isControllerFrameReady) {
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
          // .target(properties.IFRAME_SECURE_ORIGIN)
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
          .target(properties.IFRAME_SECURE_ORIGIN)
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

  getById(getByIdInput: IGetByIdInput): Promise<GetByIdResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateGetByIdInput(getByIdInput);

          bus
          // .target(properties.IFRAME_SECURE_ORIGIN)
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
          .target(properties.IFRAME_SECURE_ORIGIN)
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

  get(getInput: IGetInput, options?: IGetOptions): Promise<GetResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);
          validateGetInput(getInput, options);
          bus
          // .target(properties.IFRAME_SECURE_ORIGIN)
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
          .target(properties.IFRAME_SECURE_ORIGIN)
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

  delete(records: IDeleteRecordInput, options?: IDeleteOptions): Promise<DeleteResponse> {
    if (this.isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(
            parameterizedString(logs.infoLogs.VALIDATE_DELETE_INPUT, CLASS_NAME), MessageType.LOG,
            this.#context.logLevel,
          );

          validateDeleteRecords(records, options);
          bus
            // .target(properties.IFRAME_SECURE_ORIGIN)
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
          .target(properties.IFRAME_SECURE_ORIGIN)
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
}
export default SkyflowContainer;
