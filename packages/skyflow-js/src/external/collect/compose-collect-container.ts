/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
// privacyDB composable collect container: the shared @core CoreComposableCollectContainer
// (controller-frame bootstrap, mount/grid layout, createMultipleElement, collect(),
// on(), the bus COMPOSABLE_CONTAINER handshake and updateListeners) plus the
// package-only surface — create() (its typed CollectElementInput and returned
// ComposableElement) and the file-upload pieces (registerElementListeners +
// uploadFiles) that privacyDB supports and flowDB does not.
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  COLLECT_TYPES,
} from '@core/constants';
import CoreComposableCollectContainer from '@core/external/collect/composable-collect-container';
import SkyflowError from '@core/errors';
import Client from '@core/client';
import { VariantCollectAdapter } from '@core/types';
import collectVariant from '../../collect-variant';
import {
  MessageType,
  CollectElementInput,
  CollectElementOptions,
  ICollectOptions,
  CollectResponse,
  UploadFilesResponse,
} from '../../utils/common';
import { printLog, parameterizedString } from '../../utils/logs-helper';
import { validateCollectElementInput, validateInitConfig } from '../../utils/validators';

const CLASS_NAME = 'CollectContainer';
class ComposableContainer extends CoreComposableCollectContainer<
ICollectOptions, CollectResponse, CollectElementInput, CollectElementOptions
> {
  // privacyDB collect key strategy (`skyflowID`/`table`); injected into each element.
  protected collectVariant: VariantCollectAdapter = collectVariant;

  protected validateCreateInput(input: CollectElementInput): void {
    validateCollectElementInput(input, this.context.logLevel);
  }

  // privacyDB composable create() adds no variant identity field (the internal
  // `table`/`skyflowID` keys arrive on the input as-is).
  // eslint-disable-next-line class-methods-use-this
  protected buildCreateElementFields(): Record<string, unknown> {
    return {};
  }

  // Collect-only per-element file-upload wiring, run from the base mount().
  protected registerElementListeners(): void {
    this.elementsList.forEach((element) => {
      this.eventEmitter.on(`${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${element.elementName}`, (data, callback) => {
        this.getSkyflowBearerToken()?.then((authToken) => {
          printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
            MessageType.LOG,
            this.context.logLevel);
          this.emitEvent(
            `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${element.elementName}`,
            {
              elementName: element.name,
              data: {
                type: COLLECT_TYPES.FILE_UPLOAD,
                containerId: this.containerId,
              },
              clientConfig: {
                vaultURL: this.metaData?.clientJSON?.config?.vaultURL,
                vaultID: this.metaData?.clientJSON?.config?.vaultID,
                authToken,
              },
              options: {
                ...data?.options,
              },
              errorMessages: this.customErrorMessages,
            },
          );
        }).catch((err:any) => {
          printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
          callback(err);
        });
      });
    });
  }

  uploadFiles = (options: ICollectOptions):
  Promise<UploadFilesResponse> => new Promise((resolve, reject) => {
    try {
      validateInitConfig(this.metaData.clientJSON.config);
      if (!this.elementsList || this.elementsList.length === 0) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE, [], true);
      }
      if (!this.isMounted) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED, [], true);
      }
      const elementIds:{ frameId:string, elementId:string }[] = [];
      this.elementsList.forEach((element) => {
        elementIds.push({
          frameId: this.tempElements.elementName,
          elementId: element.elementName ?? '',
        });
      });
      const client = Client.fromJSON(this.metaData.clientJSON) as any;
      const clientId = client.toJSON()?.metaData?.uuid || '';
      this.getSkyflowBearerToken()?.then((authToken) => {
        printLog(parameterizedString(logs.infoLogs.BEARER_TOKEN_RESOLVED, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        this.emitEvent(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS + this.containerId, {
          data: {
            type: COLLECT_TYPES.FILE_UPLOAD,
            ...options,
            // tokens: options?.tokens !== undefined ? options.tokens : true,
            elementIds,
            containerId: this.containerId,
          },
          clientConfig: {
            vaultURL: this.metaData.clientJSON.config.vaultURL,
            vaultID: this.metaData.clientJSON.config.vaultID,
            authToken,
          },
          errorMessages: this.customErrorMessages,
        });
        window.addEventListener('message', (event) => {
          if (event?.origin === properties.IFRAME_SECURE_ORIGIN) {
            if (event.data?.type
              === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + this.containerId) {
              const data = event.data.data;
              if (!data || data?.error) {
                printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
                reject(data?.error);
              } else if (data?.fileUploadResponse) {
                printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                  MessageType.LOG,
                  this.context.logLevel);
                resolve(data);
              } else {
                printLog(`${JSON.stringify(data)}`, MessageType.ERROR, this.context.logLevel);
                reject(data);
              }
            }
          }
        });
      }).catch((err:any) => {
        printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
        reject(err);
      });
    } catch (err:any) {
      printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
      reject(err);
    }
  });
}
export default ComposableContainer;
