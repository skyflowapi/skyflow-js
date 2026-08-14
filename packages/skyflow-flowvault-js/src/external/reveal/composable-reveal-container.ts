/*
Copyright (c) 2023 Skyflow, Inc.
*/
// flowDB composable reveal container: the shared @core reveal base plus the
// flowDB-only surface — create() (its token-only reveal-input and element), the
// token-only record + options validators, forwarding reveal options into the
// frame payload, and the SkyflowFlowDBError full-failure mapping.
import logs from '@core/utils/logs';
import CoreComposableRevealContainer from '@core/external/reveal/composable-reveal-container';
import { MessageType } from '@core/types';
import { printLog, parameterizedString } from '../../utils/logs-helper';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import ComposableRevealElement from './composable-reveal-element';
import ComposableRevealInternalElement from './composable-reveal-internal';
import { IRevealElementOptions } from './reveal-container';
import { IFlowDBRevealElementInput, IRevealOptions } from '../../utils/common';
import { RevealResponse } from '../../internal/internal-types';
import {
  validateRevealElementRecords,
  validateRevealOptions,
} from '../../utils/validators';

class ComposableRevealContainer
  extends CoreComposableRevealContainer<IRevealOptions, RevealResponse> {
  create = (input: IFlowDBRevealElementInput, options?: IRevealElementOptions) => {
    const { elementName, controllerIframeName } = this.buildComposableRevealElement(input, options);
    return new ComposableRevealElement(elementName,
      this.eventEmitter,
      controllerIframeName);
  };

  protected instantiateInternalElement(
    elementId: string,
    tempElements: any,
  ): ComposableRevealInternalElement {
    return new ComposableRevealInternalElement(
      elementId,
      tempElements,
      this.metaData,
      {
        containerId: this.containerId,
        isMounted: this.containerMounted,
        type: this.type,
        eventEmitter: this.eventEmitter,
      },
      this.context,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  protected validateRecords(records: any[]): void {
    validateRevealElementRecords(records);
  }

  // eslint-disable-next-line class-methods-use-this
  protected validateOptions(options?: IRevealOptions): void {
    validateRevealOptions(options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected revealExtraData(options?: IRevealOptions): Record<string, any> {
    return { options };
  }

  protected handleRevealResponse(
    revealData: any,
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
  ): void {
    if (revealData?.error) {
      printLog(
        parameterizedString(logs?.errorLogs?.FAILED_REVEAL),
        MessageType.ERROR,
        this.context?.logLevel,
      );
      reject(new SkyflowFlowDBError(revealData.error));
    } else {
      printLog(
        parameterizedString(logs?.infoLogs?.REVEAL_SUBMIT_SUCCESS, this.getClassName()),
        MessageType.LOG,
        this.context?.logLevel,
      );
      resolve(revealData);
    }
  }
}
export default ComposableRevealContainer;
