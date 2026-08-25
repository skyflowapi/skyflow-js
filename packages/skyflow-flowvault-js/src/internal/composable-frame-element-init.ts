/*
Copyright (c) 2023 Skyflow, Inc.
*/
// flowDB composable reveal-frame init: the shared @core base bound to flowDB's
// reveal transport (api-utils/reveal `*ComposableFlowDB` mappers) and its
// `RevealFrame`. Instantiated only from src/index-internal (iframe bundle) via
// the static factory, so `RevealFrame` stays out of the main-thread bundles.
import CoreRevealComposableFrameElementInit from '@core/internal/composable-frame-element-init';
import { Context, IRevealRecordComposable, IRevealResponseType } from '@core/types';
import {
  fetchRecordsByTokenIdComposableFlowDB,
  formatRecordsForClientComposableFlowDB,
} from '../api-utils/reveal';
import RevealFrame from './reveal/reveal-frame';

class RevealComposableFrameElementInit extends CoreRevealComposableFrameElementInit {
  private static frameEle?: RevealComposableFrameElementInit;

  static startFrameElement = () => {
    RevealComposableFrameElementInit.frameEle = new RevealComposableFrameElementInit();
  };

  // eslint-disable-next-line class-methods-use-this
  protected fetchRecordsByTokenIdComposable(
    tokenIdRecords: IRevealRecordComposable[],
    client: any,
    authToken: string,
    options?: Record<string, any>,
  ): Promise<IRevealResponseType> {
    return fetchRecordsByTokenIdComposableFlowDB(tokenIdRecords, client, authToken, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected formatRecordsForClientComposable(response: any): Record<string, any> {
    return formatRecordsForClientComposableFlowDB(response);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createRevealFrame(
    record: any,
    context: Context,
    containerId: string,
    rootDiv?: HTMLDivElement,
  ) {
    return new RevealFrame(record, context, containerId, rootDiv);
  }
}

export default RevealComposableFrameElementInit;
