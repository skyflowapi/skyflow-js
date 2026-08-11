/*
Copyright (c) 2023 Skyflow, Inc.
*/
// flowDB composable reveal container: the shared @core reveal base plus the
// flowDB-only surface — create() (its token-only reveal-input and element), the
// token-only record + options validators, forwarding reveal options into the
// frame payload, and the SkyflowFlowDBError full-failure mapping.
import uuid from '@core/libs/uuid';
import logs from '@core/utils/logs';
import { COMPOSABLE_REVEAL, FRAME_ELEMENT } from '@core/constants';
import CoreComposableRevealContainer from '@core/external/reveal/composable-reveal-container';
import { MessageType } from '@core/types';
import { printLog, parameterizedString } from '../../utils/logs-helper';
import SkyflowFlowDBError from '../../libs/skyflow-flowdb-error';
import ComposableRevealElement from './composable-reveal-element';
import ComposableRevealInternalElement from './composable-reveal-internal';
import { IRevealElementOptions } from './reveal-container';
import { IFlowDBRevealElementInput } from '../../utils/common';
import { RevealResponse } from '../../internal/internal-types';
import {
  validateInputFormatOptions,
  validateRevealElementRecords,
  validateRevealOptions,
} from '../../utils/validators';
import { formatRevealElementOptions } from '../../utils/helpers';

class ComposableRevealContainer extends CoreComposableRevealContainer<RevealResponse> {
  create = (input: IFlowDBRevealElementInput, options?: IRevealElementOptions) => {
    const elementId = uuid();
    validateInputFormatOptions(options);

    const elementName = `${COMPOSABLE_REVEAL}:${btoa(elementId)}`;
    this.elementsList?.push({
      name: elementName,
      ...input,
      elementName,
      elementId,
      ...formatRevealElementOptions(options ?? {}),
    });
    const controllerIframeName = `${FRAME_ELEMENT}:group:${btoa(this.tempElements ?? {})}:${this.containerId}:${this.context?.logLevel}:${btoa(this.clientDomain ?? '')}`;
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
  protected validateOptions(options?: any): void {
    validateRevealOptions(options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected revealExtraData(options?: any): Record<string, any> {
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
