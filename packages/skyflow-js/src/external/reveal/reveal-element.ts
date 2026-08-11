/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB reveal element: the shared @core reveal-element base bound to
// privacyDB's reveal-input shape, plus the file-render feature. `renderFile`
// stays here (not in @core) because it pulls in the package-only reveal
// transport (`formatForRenderClient`) and render validators; flowDB is
// token-only and has no renderFile.
import bus from 'framebus';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_TYPES,
} from '@core/constants';
import logs from '@core/utils/logs';
import properties from '@core/properties';
import CoreRevealElement from '@core/external/reveal/reveal-element';
import {
  MessageType, RenderFileResponse,
} from '../../utils/common';
import { IRevealElementInput } from './reveal-container';
import { parameterizedString, printLog } from '../../utils/logs-helper';
import { formatForRenderClient } from '../../api-utils/reveal';
import { validateInitConfig, validateRenderElementRecord } from '../../utils/validators';

const CLASS_NAME = 'RevealElement';

class RevealElement extends CoreRevealElement<IRevealElementInput> {
  #isSkyflowFrameReady: boolean = false;

  renderFile(): Promise<RenderFileResponse> {
    this.#isSkyflowFrameReady = this.metaData.skyflowContainer.isControllerFrameReady;
    let altText = '';
    if (Object.prototype.hasOwnProperty.call(this.recordData, 'altText')) {
      altText = this.recordData.altText;
    }
    this.setAltText('loading...');
    const loglevel = this.context.logLevel;
    if (this.#isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
            MessageType.LOG,
            loglevel);
          validateRenderElementRecord(this.recordData);
          bus
            .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.metaData.uuid,
              {
                type: REVEAL_TYPES.RENDER_FILE,
                records: this.recordData,
                containerId: this.containerId,
                iframeName: this.iframe.name,
                errorMessages: this.customerErrorMessages,
              },
              (revealData: any) => {
                if (revealData.errors) {
                  printLog(parameterizedString(
                    logs.errorLogs.FAILED_RENDER,
                  ), MessageType.ERROR,
                  this.context.logLevel);
                  if (Object.prototype.hasOwnProperty.call(this.recordData, 'altText')) {
                    this.setAltText(altText);
                  }
                  reject(formatForRenderClient(revealData, this.recordData.column as string));
                } else {
                  printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.context.logLevel);
                  printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                    CLASS_NAME, this.recordData.skyflowID),
                  MessageType.LOG, this.context.logLevel);
                  resolve(formatForRenderClient(revealData, this.recordData.column as string));
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
          MessageType.LOG, loglevel);
        } catch (err: any) {
          printLog(`Error: ${err.message}`, MessageType.ERROR,
            loglevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
          MessageType.LOG,
          loglevel);
        validateRenderElementRecord(this.recordData);
        bus
          .target(properties.IFRAME_SECURE_ORIGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.metaData.uuid, () => {
            bus
              .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.metaData.uuid,
                {
                  type: REVEAL_TYPES.RENDER_FILE,
                  records: this.recordData,
                  containerId: this.containerId,
                  iframeName: this.iframe.name,
                  errorMessages: this.customerErrorMessages,
                },
                (revealData: any) => {
                  if (revealData.errors) {
                    printLog(parameterizedString(
                      logs.errorLogs.FAILED_RENDER,
                    ), MessageType.ERROR,
                    this.context.logLevel);
                    if (Object.prototype.hasOwnProperty.call(this.recordData, 'altText')) {
                      this.setAltText(altText);
                    }
                    reject(formatForRenderClient(revealData, this.recordData.column as string));
                  } else {
                    printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.context.logLevel);
                    printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                      CLASS_NAME, this.recordData.skyflowID),
                    MessageType.LOG, this.context.logLevel);
                    resolve(formatForRenderClient(revealData, this.recordData.column as string));
                  }
                },
              );
            printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
              CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
            MessageType.LOG, loglevel);
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
          CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
        MessageType.LOG, loglevel);
      } catch (err: any) {
        printLog(`Error: ${err.message}`, MessageType.ERROR,
          loglevel);
        reject(err);
      }
    });
  }
}

export default RevealElement;
