/*
Copyright (c) 2023 Skyflow, Inc.
*/
// privacyDB composable reveal container: the shared @core reveal base plus the
// package-only surface — create() (its typed reveal-input and the renderFile-
// capable ComposableRevealElement) and the element factory / record validator.
// Error mapping and options handling use the base (privacyDB) defaults.
import uuid from '@core/libs/uuid';
import { COMPOSABLE_REVEAL, FRAME_ELEMENT } from '@core/constants';
import CoreComposableRevealContainer from '@core/external/reveal/composable-reveal-container';
import ComposableRevealElement from './composable-reveal-element';
import ComposableRevealInternalElement from './composable-reveal-internal';
import { IRevealElementOptions } from './reveal-container';
import { RevealElementInput, RevealResponse } from '../../index-node';
import { validateInputFormatOptions, validateRevealElementRecords } from '../../utils/validators';
import { formatRevealElementOptions } from '../../utils/helpers';

class ComposableRevealContainer extends CoreComposableRevealContainer<void, RevealResponse> {
  create = (input: RevealElementInput, options?: IRevealElementOptions) => {
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
}
export default ComposableRevealContainer;
