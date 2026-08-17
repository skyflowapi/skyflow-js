/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB composable-collect controller-frame init: the shared @core base
// (validation, request-object assembly, DOM/grid build, message handling) plus the
// injected divergence — dispatchCollectRequest(), which builds the flowDB /v2
// insert/update requests, dispatches them, aggregates the response and masks CVV
// tokens. flowDB has no file upload, so the base's no-op file-message hooks are
// inherited.
import CoreFrameElementInit from '@core/internal/frame-element-init';
import Client from '@core/client';
import { CVVMap, ErrorType } from '@core/types';
import {
  constructElementsInsertReq,
  constructFlowDBInsertRequest,
  constructFlowDBUpdateRequest,
  insertDataInCollectFlowDB,
  updateDataInCollectFlowDB,
  replaceCVVTokensInResponse,
} from '../api-utils/collect';

export default class FrameElementInit extends CoreFrameElementInit {
  private static frameEle?: FrameElementInit;

  static startFrameElement = () => {
    FrameElementInit.frameEle = new FrameElementInit();
  };

  // eslint-disable-next-line class-methods-use-this
  protected dispatchCollectRequest(
    insertRequestObject: any,
    updateRequestObject: any,
    cvvMap: CVVMap,
    options: any,
    clientConfig: any,
    errorMessages?: Record<ErrorType, string>,
  ): Promise<any> {
    let finalInsertRequest;
    let finalInsertRecords;
    let finalUpdateRecords;
    let finalUpdateRequest;
    try {
      [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq(
        insertRequestObject, updateRequestObject, options,
      );
      finalInsertRequest = constructFlowDBInsertRequest(
        finalInsertRecords, options, clientConfig.vaultID,
      );
      finalUpdateRequest = constructFlowDBUpdateRequest(
        finalUpdateRecords, options, clientConfig.vaultID,
      );
    } catch (error:any) {
      return Promise.reject({
        error: error?.message,
      });
    }
    const client = new Client(clientConfig, {
      uuid: '',
      clientDomain: '',
    });
    if (errorMessages && client) {
      client.setErrorMessages(errorMessages);
    }
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      const insertPromiseSet: Promise<any>[] = [];

      if (finalInsertRecords.records.length !== 0) {
        insertPromiseSet.push(
          insertDataInCollectFlowDB(
            finalInsertRequest, client, clientConfig.authToken as string,
          ),
        );
      }
      if (finalUpdateRecords.updateRecords.length !== 0) {
        insertPromiseSet.push(
          updateDataInCollectFlowDB(
            finalUpdateRequest, client, clientConfig.authToken as string,
          ),
        );
      }
      if (insertPromiseSet.length !== 0) {
        Promise.all(insertPromiseSet).then((responses: any[]) => {
          const failure = responses.find((response) => response?.error !== undefined);
          if (failure) {
            rootReject(failure);
            return;
          }
          const records = responses.reduce(
            (acc, response) => acc.concat(response?.records || []),
            [] as any[],
          );
          replaceCVVTokensInResponse(records, cvvMap);
          rootResolve({ records });
        });
      }
    });

    return sendRequest();
  }
}
