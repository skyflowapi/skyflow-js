/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB composable reveal-internal element: the shared @core base bound to
// privacyDB's reveal-input shape, plus the file-render feature. `renderFile`
// (and the RENDER_FILE_REQUEST listener that drives it, wired through the base's
// registerRenderFileRequestListener hook) stays here because it pulls in the
// package-only render transport; flowDB is token-only and has no renderFile.
import {
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_TYPES,
} from '@core/constants';
import logs from '@core/utils/logs';
import properties from '@core/properties';
import {
  Context, ICoreMetadata, RevealContainerProps,
} from '@core/types';
import CoreComposableRevealInternalElement from '@core/external/reveal/composable-reveal-internal';
import {
  MessageType, RenderFileResponse,
} from '../../../utils/common';
import { IRevealElementInput, IRevealElementOptions } from './reveal-container';
import { parameterizedString, printLog } from '../../../utils/logs-helper';
import { validateInitConfig, validateRenderElementRecord } from '../../../utils/validators';

const CLASS_NAME = 'RevealElementInteranalElement';

export interface RevealComposableGroup{
  record: IRevealElementInput
  options: IRevealElementOptions
}

class ComposableRevealInternalElement
  extends CoreComposableRevealInternalElement<IRevealElementInput> {
  #getSkyflowBearerToken: () => Promise<string> | undefined;

  constructor(elementId: string,
    recordGroup,
    metaData: ICoreMetadata,
    container: RevealContainerProps,
    context: Context) {
    super(elementId, recordGroup, metaData, container, context);
    this.#getSkyflowBearerToken = metaData?.getSkyflowBearerToken;
  }

  protected registerRenderFileRequestListener(element: any): void {
    this.eventEmitter?.on(
      `${ELEMENT_EVENTS_TO_IFRAME?.RENDER_FILE_REQUEST}:${element?.name}`,
      (data, callback) => {
        this.renderFile(element)?.then((response) => {
          callback?.(response);
        })?.catch((error) => {
          callback?.({ error });
        });
      },
    );
  }

  renderFile(recordData: any): Promise<RenderFileResponse> {
    let altText = '';
    if (Object.prototype.hasOwnProperty.call(recordData, 'altText')) {
      altText = recordData.altText;
    }
    this.setAltText('loading...', recordData);
    const loglevel = this.context.logLevel;
    if (this.isComposableFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.metaData.clientJSON.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
            MessageType.LOG,
            loglevel);
          validateRenderElementRecord(recordData);
          this.#getSkyflowBearerToken()?.then((authToken) => {
            printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
              MessageType.LOG,
              this.context.logLevel);
            this.emitEvent(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + recordData.name,
              {
                data: {
                  type: REVEAL_TYPES.RENDER_FILE,
                  containerId: this.containerId,
                  iframeName: recordData.name,
                },
                clientConfig: {
                  vaultURL: this.metaData.clientJSON.config.vaultURL,
                  vaultID: this.metaData.clientJSON.config.vaultID,
                  authToken,
                },
              },
            );
            window?.addEventListener('message', (event) => {
              if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
                if (event?.data
                  && event?.data?.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE
       + recordData.name) {
                  if (event?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
                    const revealData = event?.data?.data?.result;
                    if (revealData?.error || revealData?.errors) {
                      printLog(parameterizedString(
                        logs.errorLogs.FAILED_RENDER,
                      ), MessageType.ERROR,
                      this.context.logLevel);
                      if (Object.prototype.hasOwnProperty.call(recordData, 'altText')) {
                        this.setAltText(altText, recordData);
                      }
                      reject(revealData?.error || revealData?.errors);
                    } else {
                      printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                        MessageType.LOG,
                        this.context.logLevel);
                      printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                        CLASS_NAME, recordData.skyflowID),
                      MessageType.LOG, this.context.logLevel);
                      resolve(revealData);
                    }
                  }
                }
              }
            });
          }).catch((err:any) => {
            printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
            reject(err);
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
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.metaData.clientJSON.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RENDER_RECORDS, CLASS_NAME),
          MessageType.LOG,
          loglevel);
        validateRenderElementRecord(recordData);
        window.addEventListener('message', (event) => {
          if (event.data.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                  + recordData?.name) {
            this.markMounted();
            this.#getSkyflowBearerToken()?.then((authToken) => {
              printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
                MessageType.LOG,
                this.context.logLevel);
              this.emitEvent(
                ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + recordData.name,
                {
                  data: {
                    type: REVEAL_TYPES.RENDER_FILE,
                    containerId: this.containerId,
                    iframeName: recordData.name,
                  },
                  clientConfig: {
                    vaultURL: this.metaData.clientJSON.config.vaultURL,
                    vaultID: this.metaData.clientJSON.config.vaultID,
                    authToken,
                  },
                },
              );
              window.addEventListener('message', (event1) => {
                if (event1?.origin === properties.IFRAME_SECURE_ORIGIN) {
                  if (event1?.data
                         && event1?.data?.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE
             + recordData.name) {
                    if (event1?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
                      const revealData = event1?.data?.data?.result;
                      if (revealData?.error || revealData?.errors) {
                        printLog(parameterizedString(
                          logs.errorLogs.FAILED_RENDER,
                        ), MessageType.ERROR,
                        this.context.logLevel);
                        if (Object.prototype.hasOwnProperty.call(recordData, 'altText')) {
                          this.setAltText(altText, recordData);
                        }
                        reject(revealData?.error || revealData?.errors);
                      } else {
                      // eslint-disable-next-line max-len
                        printLog(parameterizedString(logs.infoLogs.RENDER_SUBMIT_SUCCESS, CLASS_NAME),
                          MessageType.LOG,
                          this.context.logLevel);
                        printLog(parameterizedString(logs.infoLogs.FILE_RENDERED,
                          CLASS_NAME, recordData.skyflowID),
                        MessageType.LOG, this.context.logLevel);
                        resolve(revealData);
                      }
                    }
                  }
                }
              });
            }).catch((err:any) => {
              printLog(`${err?.message}`, MessageType.ERROR, this.context.logLevel);
              reject(err);
            });
          }
        });
        printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
          CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST),
        MessageType.LOG, loglevel);
      } catch (err: any) {
        printLog(`Error: ${err?.message}`, MessageType.ERROR,
          loglevel);
        reject(err);
      }
    });
  }
}

export default ComposableRevealInternalElement;
