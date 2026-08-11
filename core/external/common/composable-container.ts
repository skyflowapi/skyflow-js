/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Copyright (c) 2023 Skyflow, Inc.
*/
// Shared base for the composable (single controller-frame) containers. Owns the
// controller-iframe bootstrap, the flex-grid mount() (layout → rows → styles →
// createMultipleElement → shadowRoot/height wiring), hasElementName, unmount and
// the shadowRoot-vs-document postMessage emitEvent. The genuinely divergent
// pieces are injected as hooks so no product-specific symbol is imported into
// @core (the core ⇏ packages boundary):
//   - className (getter)          — log identity, needed during super() so it is
//                                   a getter, not a field.
//   - registerReadyListener()     — collect: bus COMPOSABLE_CONTAINER handshake;
//                                   reveal: window `message` MOUNTED flag. Called
//                                   from the constructor, so a prototype method.
//   - createMultipleElement       — instantiates the product's element class.
//   - registerElementListeners()  — collect-only per-element file-upload wiring
//                                   (empty default keeps it out of reveal).
//   - decorateEmitOptions()       — reveal spreads errorMessages into the frame
//                                   payload; collect does not.
//   - mountLabel                  — the element name in the empty-mount error.
// The public create()/collect()/reveal()/uploadFiles()/on() bodies stay in the
// subclasses.
import sum from 'lodash/sum';
import EventEmitter from '@core/event-emitter';
import uuid from '@core/libs/uuid';
import iframer, { setAttributes, getIframeSrc, setStyles } from '@core/iframe-libs/iframer';
import properties from '@core/properties';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import {
  COLLECT_FRAME_CONTROLLER,
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_CLIENT,
} from '@core/constants';
import Container from '@core/external/common/container';
import SkyflowError from '@core/errors';
import {
  Context, MessageType, ContainerOptions, ErrorType, ICoreMetadata,
} from '@core/types';
import { printLog, parameterizedString } from '@core/utils/logs-helper';

abstract class ComposableContainerBase extends Container {
  protected containerId: string = '';

  protected elements: Record<string, any> = {};

  protected metaData: ICoreMetadata;

  protected elementGroup: any = { rows: [] };

  protected elementsList: any = [];

  protected context: Context;

  protected skyflowElements: any[];

  protected eventEmitter: EventEmitter;

  protected isMounted: boolean = false;

  protected options: any;

  protected containerElement: any;

  protected containerMounted: boolean = false;

  protected tempElements: any = {};

  protected clientDomain: string = '';

  protected isComposableFrameReady: boolean = false;

  protected shadowRoot: ShadowRoot | null = null;

  protected iframeID: string = '';

  protected getSkyflowBearerToken: () => Promise<string> | undefined;

  protected customErrorMessages: Partial<Record<ErrorType, string>> = {};

  // Element name in the empty-mount error ('CollectElement' / 'RevealElement').
  protected mountLabel: string = 'CollectElement';

  // Log identity; overridden per subclass. A concrete overridable method (not an
  // abstract getter) so it can be invoked from the constructor without TS2715 —
  // virtual dispatch still resolves to the subclass override during super().
  // eslint-disable-next-line class-methods-use-this
  protected getClassName(): string {
    return 'CollectContainer';
  }

  // Instantiates the product's element class; created per subclass because the
  // element class + constructor signature diverge (and would cross the boundary).
  protected abstract createMultipleElement: (
    multipleElements: any,
    isSingleElementAPI?: boolean,
  ) => any;

  constructor(
    metaData: ICoreMetadata,
    skyflowElements: any[],
    context: Context,
    options?: ContainerOptions,
  ) {
    super();
    this.containerId = uuid();
    this.metaData = {
      ...metaData,
      clientJSON: {
        ...metaData?.clientJSON,
        config: {
          ...metaData?.clientJSON?.config,
          options: {
            ...metaData?.clientJSON?.config?.options,
            ...options,
          },
        },
      },
    };
    this.getSkyflowBearerToken = metaData?.getSkyflowBearerToken;
    this.skyflowElements = skyflowElements;
    this.context = context;
    this.options = options;
    this.eventEmitter = new EventEmitter();

    this.clientDomain = this.metaData.clientDomain || '';
    const iframe = iframer({
      name: `${COLLECT_FRAME_CONTROLLER}:${this.containerId}:${this.context.logLevel}:${btoa(this.clientDomain)}`,
      referrer: this.clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    printLog(parameterizedString(logs.infoLogs.CREATE_COLLECT_CONTAINER, this.getClassName()),
      MessageType.LOG,
      this.context.logLevel);
    this.containerMounted = true;
    this.registerReadyListener();
  }

  setError(errors: Partial<Record<ErrorType, string>>) {
    this.customErrorMessages = errors;
  }

  protected hasElementName = (name: string) => {
    const tempElements = Object.keys(this.elements);
    for (let i = 0; i < tempElements.length; i += 1) {
      if (atob(tempElements[i].split(':')[2]) === name) {
        return true;
      }
    }
    return false;
  };

  mount = (domElement: HTMLElement | string) => {
    if (!domElement) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT,
        [this.mountLabel], true);
    }

    const { layout } = this.options;
    if (sum(layout) !== this.elementsList.length) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.MISMATCH_ELEMENT_COUNT_LAYOUT_SUM, [], true);
    }
    let count = 0;
    layout.forEach((rowCount, index) => {
      this.elementGroup.rows = [
        ...this.elementGroup.rows,
        { elements: [] },
      ];
      for (let i = 0; i < rowCount; i++) {
        this.elementGroup.rows[index].elements.push(
          this.elementsList[count],
        );
        count++;
      }
    });
    if (this.options.styles) {
      this.elementGroup.styles = {
        ...this.options.styles,
      };
    }
    if (this.options.errorTextStyles) {
      this.elementGroup.errorTextStyles = {
        ...this.options.errorTextStyles,
      };
    }

    if (this.containerMounted) {
      this.containerElement = this.createMultipleElement(this.elementGroup, false);
      this.containerElement.mount(domElement);
      this.isMounted = true;
    }
    this.registerElementListeners();
    if (domElement instanceof HTMLElement
      && (domElement as HTMLElement).getRootNode() instanceof ShadowRoot) {
      this.shadowRoot = domElement.getRootNode() as ShadowRoot;
    } else if (typeof domElement === 'string') {
      const element = document.getElementById(domElement);
      if (element && element.getRootNode() instanceof ShadowRoot) {
        this.shadowRoot = element.getRootNode() as ShadowRoot;
      }
    }
    if (this.shadowRoot !== null) {
      this.eventEmitter.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT, (data) => {
        this.emitEvent(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + data.iframeName, {});
      });
      this.emitEvent(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.iframeID, {});
    }
  };

  unmount = () => {
    this.containerElement.unmount();
  };

  protected emitEvent = (eventName: string, options?: Record<string, any>, callback?: any) => {
    const option = this.decorateEmitOptions(options);
    if (this.shadowRoot) {
      const iframe = this.shadowRoot.getElementById(this.iframeID) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          name: eventName,
          ...option,
        }, properties.IFRAME_SECURE_ORIGIN);
      }
    } else {
      const iframe = document.getElementById(this.iframeID) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          name: eventName,
          ...option,
        }, properties.IFRAME_SECURE_ORIGIN);
      }
    }
  };

  // ---- Injected divergence (see class doc) --------------------------------

  // collect: the bus COMPOSABLE_CONTAINER handshake (+ updateListeners);
  // reveal: the window `message` MOUNTED readiness flag. Invoked from the
  // constructor, so subclasses implement it as a prototype method.
  protected abstract registerReadyListener(): void;

  // collect-only per-element file-upload wiring; empty by default so the
  // reveal bundle never reaches it.
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  protected registerElementListeners(): void {}

  // reveal spreads its custom error messages into every frame payload; collect
  // sends the options through unchanged.
  // eslint-disable-next-line class-methods-use-this
  protected decorateEmitOptions(options?: Record<string, any>): Record<string, any> {
    return {
      ...options,
    };
  }
}
export default ComposableContainerBase;
