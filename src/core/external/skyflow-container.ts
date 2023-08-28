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
  validateThreeDSInput,
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
  IConstructedThreeDSRecord,
  IThreeDSInput,
} from '../../utils/common';
import { threeDSConfigParser, getIframeNameUsingId, redirectWithPost } from '../../utils/helpers';
import CollectElement from './collect/collect-element';

const CLASS_NAME = 'SkyflowContainer';
class SkyflowContainer {
  #containerId: string;

  #client: Client;

  #isControllerFrameReady: boolean = false;

  #context: Context;

  constructor(client, context) {
    this.#client = client;
    this.#containerId = this.#client.toJSON()?.metaData?.uuid || '';
    this.#context = context;
    const iframe = iframer({
      name: `${SKYFLOW_FRAME_CONTROLLER}:${this.#containerId}`,
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

  insert(records, options:IInsertOptions): Promise<any> {
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

  get(getInput: IGetInput) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateGetInput(getInput);

          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.GET,
                records: getInput.records,
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

        validateGetInput(getInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.GET,
                records: getInput.records,
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

  threeDS(threeDSInput: IThreeDSInput) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(
            parameterizedString(logs.infoLogs.VALIDATE_3DS_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel,
          );
          let guestCheckout = false;
          if (
            threeDSInput.cardDetails.cardNumber
            instanceof CollectElement
          ) {
            guestCheckout = true;
            threeDSConfigParser(threeDSInput.cardDetails);
          } else if (
            typeof threeDSInput.cardDetails.cardNumber
            === 'string'
          ) {
            if (
              threeDSInput.cardDetails.cardNumber.charAt(0)
              === '#'
            ) {
              guestCheckout = true;
              threeDSInput.cardDetails.cardNumber = getIframeNameUsingId(
                threeDSInput.cardDetails.cardNumber,
              );
              threeDSInput.cardDetails.cardExpiry = getIframeNameUsingId(
                threeDSInput.cardDetails.cardExpiry,
              );
              threeDSInput.cardDetails.cardHolderName = getIframeNameUsingId(
                threeDSInput.cardDetails.cardHolderName,
              );
            }
          }
          validateThreeDSInput(threeDSInput);

          // Get the current local time offset in minutes
          const localTimeOffsetMinutes = new Date().getTimezoneOffset();

          // Calculate the time difference between UTC and local time in minutes
          const timeDifferenceMinutes = -localTimeOffsetMinutes;

          const screenHeight = window.screen.height;
          const screenWidth = window.screen.width;
          const constructed3DSObject: IConstructedThreeDSRecord = {
            ...threeDSInput,
            guestCheckout,
            config: {
              vaultID: this.#client.config.vaultID || '',
              ...threeDSInput.config,
            },
            browserDetails: {
              browserAcceptHeader: 'application/json',
              browserLanguage: navigator.language || 'en',
              browserColorDepth: String(window.screen.colorDepth),
              browserScreenHeight: screenHeight,
              browserScreenWidth: screenWidth,
              browserTZ: timeDifferenceMinutes,
              browserUserAgent: window.navigator.userAgent,
              browserJavascriptEnabled: true,
              browserJavaEnabled: window.navigator.javaEnabled() || false,
            },
          };
          bus
            // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.THREE_DS,
                config: constructed3DSObject,
              },
              (response: any) => {
                if (response.error) reject(response.error);
                else {
                  if (response.authenticationResponse.transStatus === 'C') {
                    redirectWithPost(
                      response.authenticationResponse.acsURL,
                      String(response.creq),
                    );
                    const challengeResponse = {
                      messageType: response.authenticationResponse.messageType,
                      threeDSServerTransID:
                        response.authenticationResponse.threeDSServerTransID,
                      transStatus: response.authenticationResponse.transStatus,
                      messageVersion:
                        response.authenticationResponse.messageVersion,
                    };
                    resolve(challengeResponse);
                  }
                  resolve(response);
                }
              },
            );
          printLog(
            parameterizedString(
              logs.infoLogs.EMIT_PURE_JS_REQUEST,
              CLASS_NAME,
              PUREJS_TYPES.GET,
            ),
            MessageType.LOG,
            this.#context.logLevel,
          );
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);
          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(
          parameterizedString(logs.infoLogs.VALIDATE_3DS_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel,
        );
        validateThreeDSInput(threeDSInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(
            ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId,
            () => {
              bus.emit(
                ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
                {
                  type: PUREJS_TYPES.THREE_DS,
                  data: threeDSInput,
                },
                (responseData: any) => {
                  if (responseData.error) reject(responseData.error);
                  else {
                    resolve = () => responseData;
                  }
                },
              );
            },
          );
        printLog(
          parameterizedString(
            logs.infoLogs.EMIT_PURE_JS_REQUEST,
            CLASS_NAME,
            PUREJS_TYPES.THREE_DS,
          ),
          MessageType.LOG,
          this.#context.logLevel,
        );
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);
        reject(e);
      }
    });
  }

  delete(records: IDeleteRecordInput, options: IDeleteOptions) {
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
}
export default SkyflowContainer;
