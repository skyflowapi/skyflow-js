/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB skyflow-frame controller. Elements-only: Collect + Reveal (+ composable),
// no file operations and no pure-JS data methods. It extends the shared @core base
// (CoreSkyflowFrameController) and supplies only the flowDB API-call divergence —
// the flowDB collect send path (sendCollectRequest: /v2 insert + update in one
// Promise.all, with CVV token re-mapping) and the flowDB reveal fetch/format.
// Telemetry identity + the error-envelope shape are injected via
// getSdkNameAndVersion/wrapCallbackError. Because it never overrides
// registerDataAccessListeners, the base leaves it without the PUREJS_REQUEST /
// PUREJS_FRAME_READY channel; the handleExtra* hooks stay no-ops (no file paths).
import { getAccessToken } from '@core/utils/bus-events';
import { injectCoralogixTrackingScript } from '@core/helpers';
import { SdkInfo } from '@core/client';
import { ICollectedElementsData } from '@core/internal/skyflow-frame/collect-elements';
import CoreSkyflowFrameController from '@core/internal/skyflow-frame/skyflow-frame-controller-base';
import {
  constructElementsInsertReq,
  constructFlowDBInsertRequest,
  constructFlowDBUpdateRequest,
  insertDataInCollectFlowDB,
  updateDataInCollectFlowDB,
  replaceCVVTokensInResponse,
} from '../../api-utils/collect';
import {
  fetchRecordsByTokenIdFlowDB,
  formatRecordsForClientFlowDB,
} from '../../api-utils/reveal';
import { IRevealRecord } from '../../utils/common';
import { getSDKNameAndVersion } from '../../utils/helpers';
import {
  FlowDBInsertRequestBody, FlowDBUpdateRequestBody,
  TokenizeDataInput, CollectResponse, RevealResponse, RevealError,
} from '../internal-types';

// flowDB reveal result: a normal response or a full-failure error body (the
// base's revealData rejects with the latter). Aliased to keep the class header
// within line length.
type FlowDBRevealResult = RevealResponse | RevealError;

class SkyflowFrameController
  extends CoreSkyflowFrameController<TokenizeDataInput, CollectResponse, FlowDBRevealResult> {
  // flowDB captures CVV values into cvvMap for post-response token re-mapping.
  protected collectsCVV = true;

  // flowDB resolves a partial reveal failure ({ records, errors }) as success.
  protected revealResolvesPartialFailure = true;

  static init(clientId: string = ''): SkyflowFrameController {
    injectCoralogixTrackingScript();
    return new SkyflowFrameController(clientId);
  }

  // flowDB telemetry identity (deliberate loose-coupling duplication: each
  // package owns its telemetry helper).
  // eslint-disable-next-line class-methods-use-this
  protected getSdkNameAndVersion(metaData?: string): SdkInfo {
    return getSDKNameAndVersion(metaData);
  }

  // flowDB error envelope: forward an already-enveloped body as-is (avoids
  // double-nesting the flowDB error), otherwise wrap.
  // eslint-disable-next-line class-methods-use-this
  protected wrapCallbackError(error: any): any {
    return error?.error !== undefined ? error : { error };
  }

  protected fetchRevealRecords(
    revealRecords: IRevealRecord[],
    options?: Record<string, any>,
  ): Promise<any> {
    return fetchRecordsByTokenIdFlowDB(revealRecords, this.client, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected formatRevealForClient(result: any): FlowDBRevealResult {
    return formatRecordsForClientFlowDB(result);
  }

  // flowDB collect send path: build the flowDB /v2 insert + update requests, fire
  // them together, merge records, and re-map CVV tokens in the response.
  protected sendCollectRequest(
    built: ICollectedElementsData,
    options: TokenizeDataInput,
  ): Promise<CollectResponse> {
    const { insertResponseObject, updateResponseObject, cvvMap } = built;
    let finalInsertRequest: FlowDBInsertRequestBody;
    let finalUpdateRequest: FlowDBUpdateRequestBody;
    let finalInsertRecords;
    let finalUpdateRecords;
    try {
      [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq(
        insertResponseObject, updateResponseObject, options,
      );
      finalInsertRequest = constructFlowDBInsertRequest(
        finalInsertRecords, options, this.client.config.vaultID,
      );
      finalUpdateRequest = constructFlowDBUpdateRequest(
        finalUpdateRecords, options, this.client.config.vaultID,
      );
    } catch (error:any) {
      return Promise.reject({
        error: error?.message,
      });
    }
    const client = this.client;
    const sendRequest = (): Promise<CollectResponse> => new Promise((rootResolve, rootReject) => {
      const clientId = client.toJSON()?.metaData?.uuid || '';
      getAccessToken(clientId).then((authToken) => {
        const requests: Promise<any>[] = [];
        if (finalInsertRecords.records.length !== 0) {
          requests.push(insertDataInCollectFlowDB(
            finalInsertRequest,
            client,
            authToken as string,
          ));
        }
        if (finalUpdateRecords.updateRecords.length !== 0) {
          requests.push(updateDataInCollectFlowDB(
            finalUpdateRequest,
            client,
            authToken as string,
          ));
        }
        if (requests.length === 0) {
          rootResolve({ records: [] });
          return;
        }
        Promise.all(requests).then((responses: any[]) => {
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
      }).catch((err) => {
        rootReject(err);
      });
    });

    return sendRequest();
  }
}
export default SkyflowFrameController;
