import bus from 'framebus';
import Client from '../../client';
import iframer, {
  getIframeSrc,
  setAttributes,
  setStyles,
} from '../../iframe-libs/iframer';
import { gatewayConfigParser } from '../../libs/objectParse';
import properties from '../../properties';
import {
  IGatewayConfig, Context, IDetokenizeInput, IGetByIdInput,
} from '../../Skyflow';
import {
  validateGatewayConfig, validateInsertRecords, validateDetokenizeInput, validateGetByIdInput,
} from '../../utils/validators';
import {
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  gatewayConfigParseKeys,
  PUREJS_FRAME_CONTROLLER,
  PUREJS_TYPES,
  MessageType,
} from '../constants';
import { LogLevelOptions, printLog, parameterizedString } from '../../utils/helper';
import logs from '../../utils/logs';

class PureJsController {
  #client: Client;

  #isControllerFrameReady: boolean = false;

  #context:Context;

  #showErrorLogs: boolean;

  #showInfoLogs: boolean;

  constructor(client, context) {
    this.#client = client;
    this.#context = context;
    const iframe = iframer({
      name: `${PUREJS_FRAME_CONTROLLER}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    const { showInfoLogs, showErrorLogs } = LogLevelOptions[this.#context.logLevel];
    this.#showInfoLogs = showInfoLogs;
    this.#showErrorLogs = showErrorLogs;
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, (data, callback) => {
        printLog(logs.infoLogs.CAPTURE_PUREJS_FRAME, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);
        callback({
          client: this.#client,
          bearerToken: this.#client.config.getBearerToken.toString(),
          context,
        });
        this.#isControllerFrameReady = true;
      });
    printLog(logs.infoLogs.PUREJS_CONTROLLER_INITIALIZED, MessageType.INFO,
      this.#showErrorLogs, this.#showInfoLogs);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          printLog(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, MessageType.INFO,
            this.#showErrorLogs, this.#showInfoLogs);

          validateDetokenizeInput(detokenizeInput);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.DETOKENIZE,
                records: detokenizeInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, PUREJS_TYPES.DETOKENIZE),
            MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);
          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        printLog(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);

        validateDetokenizeInput(detokenizeInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
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
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, PUREJS_TYPES.DETOKENIZE),
          MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);
        reject(e);
      }
    });
  }

  insert(records, options): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          printLog(logs.infoLogs.VALIDATE_RECORDS, MessageType.INFO,
            this.#showErrorLogs, this.#showInfoLogs);

          validateInsertRecords(records);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) reject(insertedData.error);
                else resolve(insertedData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, PUREJS_TYPES.INSERT),
            MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        printLog(logs.infoLogs.VALIDATE_RECORDS, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);

        validateInsertRecords(records);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) reject(insertedData.error);
                else resolve(insertedData);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, PUREJS_TYPES.INSERT),
          MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);

        reject(e);
      }
    });
  }

  getById(getByIdInput: IGetByIdInput) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          printLog(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, MessageType.INFO,
            this.#showErrorLogs, this.#showInfoLogs);

          validateGetByIdInput(getByIdInput);

          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
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
            PUREJS_TYPES.GET_BY_SKYFLOWID),
          MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        printLog(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);

        validateGetByIdInput(getByIdInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
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
          PUREJS_TYPES.GET_BY_SKYFLOWID),
        MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);

        reject(e);
      }
    });
  }

  invokeGateway(config: IGatewayConfig) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          printLog(logs.infoLogs.VALIDATE_GATEWAY_CONFIG, MessageType.INFO,
            this.#showErrorLogs, this.#showInfoLogs);

          validateGatewayConfig(config);
          gatewayConfigParseKeys.forEach((configKey) => {
            if (config[configKey]) {
              gatewayConfigParser(config[configKey], configKey);
            }
          });
          if (config.responseBody) {
            gatewayConfigParser(config.responseBody, 'responseBody');
          }

          bus
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.INVOKE_GATEWAY,
                config,
              },
              (response: any) => {
                if (response.error) reject(response.error);
                else resolve(response);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
            PUREJS_TYPES.INVOKE_GATEWAY),
          MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
        } catch (error) {
          printLog(error.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);

          reject(error?.message);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        printLog(logs.infoLogs.VALIDATE_GATEWAY_CONFIG, MessageType.INFO,
          this.#showErrorLogs, this.#showInfoLogs);

        validateGatewayConfig(config);
        gatewayConfigParseKeys.forEach((configKey) => {
          if (config[configKey]) {
            gatewayConfigParser(config[configKey], configKey);
          }
          if (config.responseBody) {
            gatewayConfigParser(config.responseBody, 'responseBody');
          }
        });
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST,
              {
                type: PUREJS_TYPES.INVOKE_GATEWAY,
                config,
              },
              (response: any) => {
                if (response.error) reject(response.error);
                else resolve(response);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
          PUREJS_TYPES.INVOKE_GATEWAY),
        MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
      } catch (error) {
        printLog(error.message, MessageType.ERROR, this.#showErrorLogs, this.#showInfoLogs);

        reject(error?.message);
      }
    });
  }
}
export default PureJsController;
