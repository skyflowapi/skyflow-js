/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB composable reveal-frame init: the shared @core base bound to
// privacyDB's reveal transport (api-utils/reveal `*Composable` mappers) and its
// DOM-heavy `RevealFrame`. Instantiated only from src/index-internal (iframe
// bundle) via the static factory, so `RevealFrame` stays out of the main-thread
// browser/node bundles.
import CoreRevealComposableFrameElementInit from '@core/internal/composable-frame-element-init';
import { Context, IRevealRecordComposable, IRevealResponseType } from '@core/types';
import {
  fetchRecordsByTokenIdComposable,
  formatRecordsForClientComposable,
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
  ): Promise<IRevealResponseType> {
    return fetchRecordsByTokenIdComposable(tokenIdRecords, client, authToken);
  }

  // eslint-disable-next-line class-methods-use-this
  protected formatRecordsForClientComposable(response: any): Record<string, any> {
    return formatRecordsForClientComposable(response);
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
