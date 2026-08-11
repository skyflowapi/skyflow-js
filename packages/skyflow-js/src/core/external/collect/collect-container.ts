/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB collect container: the shared @core CollectContainer base bound to
// privacyDB's collect option/response types, plus the injected divergence —
// create() (uses privacyDB's collect-input validator, no tableName→table remap)
// and the A-only uploadFiles (file upload is privacyDB-only). Token handling and
// error mapping use the base defaults. The element interfaces are re-exported
// from @core under the same public names (imported as './collect-container').
import bus from 'framebus';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  COLLECT_TYPES,
} from '@core/constants';
import properties from '@core/properties';
import SkyflowError from '@core/errors';
import {
  formatValidations, formatOptions,
} from '@core/libs/element-options';
import CollectElement from '@core/external/collect/collect-element';
import { CollectElementInput, CollectElementOptions, MessageType } from '@core/types';
import CoreCollectContainer, { ElementGroup } from '@core/external/collect/collect-container';
import { printLog, parameterizedString } from '../../../utils/logs-helper';
import { validateCollectElementInput, validateInitConfig } from '../../../utils/validators';
import {
  CollectResponse,
  ICollectOptions,
  UploadFilesResponse,
} from '../../../utils/common';

export type {
  ICollectElement, ElementGroupItem, ElementGroup,
} from '@core/external/collect/collect-container';

const CLASS_NAME = 'CollectContainer';
class CollectContainer extends CoreCollectContainer<ICollectOptions, CollectResponse> {
  create = (input: CollectElementInput, options: CollectElementOptions = {
    required: false,
  }): CollectElement => {
    validateCollectElementInput(input, this.context.logLevel);
    const validations = formatValidations(input.validations);
    const formattedOptions = formatOptions(input.type, options, this.context.logLevel);

    const elementGroup: ElementGroup = {
      rows: [{
        elements: [{
          elementType: input.type,
          name: input.column,
          accept: options.allowedFileType,
          ...input,
          ...formattedOptions,
          validations,
        }],
      }],
    };

    return this.createMultipleElement(elementGroup, true);
  };

  uploadFiles = (options?: ICollectOptions): Promise<UploadFilesResponse> => {
    this.isSkyflowFrameReady = this.metaData.skyflowContainer.isControllerFrameReady;
    if (this.isSkyflowFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.metaData.clientJSON.config);
          if (Object.keys(this.elements).length === 0) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
          }
          this.removeStaleElements();
          const fileElements = Object.values(this.elements);
          const elementIds = Object.keys(this.elements);
          fileElements.forEach((element) => {
            if (!element.isMounted()) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
            }
            element.isValidElement();
          });
          bus
            // .target(properties.IFRAME_SECURE_ORIGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.metaData.uuid,
              {
                type: COLLECT_TYPES.FILE_UPLOAD,
                ...options,
                elementIds,
                containerId: this.containerId,
                errorMessages: this.customErrorMessages,
              },
              (data: any) => {
                if (!data || data?.error) {
                  printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
                  reject(data?.error);
                } else {
                  printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                    MessageType.LOG,
                    this.context.logLevel);

                  resolve(data);
                }
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
          MessageType.LOG, this.context.logLevel);
        } catch (err:any) {
          printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
          reject(err);
        }
      });
    }
    return new Promise((resolve, reject) => {
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.containerId, () => {
          try {
            validateInitConfig(this.metaData.clientJSON.config);
            if (Object.keys(this.elements).length === 0) {
              throw new SkyflowError(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT, [], true);
            }
            this.removeStaleElements();
            const fileElements = Object.values(this.elements);
            const elementIds = Object.keys(this.elements);
            fileElements.forEach((element) => {
              if (!element.isMounted()) {
                throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED, [], true);
              }
              element.isValidElement();
            });
            bus
              // .target(properties.IFRAME_SECURE_ORIGIN)
              .emit(
                ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.metaData.uuid,
                {
                  type: COLLECT_TYPES.FILE_UPLOAD,
                  ...options,
                  elementIds,
                  containerId: this.containerId,
                  errorMessages: this.customErrorMessages,
                },
                (data: any) => {
                  if (!data || data?.error) {
                    printLog(`${JSON.stringify(data?.error)}`, MessageType.ERROR, this.context.logLevel);
                    reject(data?.error);
                  } else {
                    printLog(parameterizedString(logs.infoLogs.COLLECT_SUBMIT_SUCCESS, CLASS_NAME),
                      MessageType.LOG,
                      this.context.logLevel);

                    resolve(data);
                  }
                },
              );
            printLog(parameterizedString(logs.infoLogs.EMIT_EVENT,
              CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.FILE_UPLOAD),
            MessageType.LOG, this.context.logLevel);
          } catch (err:any) {
            printLog(`${err.message}`, MessageType.ERROR, this.context.logLevel);
            reject(err);
          }
        });
    });
  };
}
export default CollectContainer;
