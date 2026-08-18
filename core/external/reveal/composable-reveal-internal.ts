/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import uuid from '@core/libs/uuid';
import EventEmitter from '@core/event-emitter';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CONTAINER,
  REVEAL_ELEMENT_OPTIONS_TYPES,
  METRIC_TYPES,
  ELEMENT_EVENTS_TO_CLIENT,
  EVENT_TYPES,
  COMPOSABLE_REVEAL,
  CUSTOM_ERROR_MESSAGES,
} from '@core/constants';
import properties from '@core/properties';
import SkyflowElement from '@core/external/common/skyflow-element';
import SkyflowError from '@core/errors';
import {
  pushElementEventWithTimeout,
  updateMetricObjectValue,
} from '@core/metrics';
import IFrame from '@core/external/common/iframe';
import {
  Context, ErrorType, IRevealElementOptions, ICoreMetadata, RevealContainerProps,
} from '@core/types';
import { formatRevealElementOptions } from '@core/helpers';

// Shared composable reveal-internal element base. Holds the iframe/mount/update/
// altText DOM+bus machinery common to both SDKs. Generic over the reveal-input
// shape (`TInput`). The privacyDB file-render feature (`renderFile` +
// `#getSkyflowBearerToken`, which pull in package-only render transport) lives in
// the skyflow-js subclass and is wired via the `registerRenderFileRequestListener`
// hook; token-only flowDB leaves that hook empty and adds nothing.
class ComposableRevealInternalElement<TInput> extends SkyflowElement {
  #iframe: IFrame;

  protected metaData: ICoreMetadata;

  #recordData: any;

  protected containerId: string;

  #isMounted:boolean = false;

  #isClientSetError:boolean = false;

  protected context: Context;

  #elementId: string;

  resizeObserver: ResizeObserver | null;

  #readyToMount: boolean = false;

  protected eventEmitter: EventEmitter;

  #shadowRoot: ShadowRoot | null = null;

  protected isComposableFrameReady: boolean = false;

  #customerErrorMessages: Partial<Record<ErrorType, string>> = {};

  constructor(elementId: string,
    recordGroup,
    metaData: ICoreMetadata,
    container: RevealContainerProps,
    context: Context) {
    super();
    this.#elementId = elementId;
    this.metaData = metaData;
    this.resizeObserver = null;
    this.#recordData = recordGroup;
    this.containerId = container?.containerId;
    this.#readyToMount = container?.isMounted ?? true;
    this.eventEmitter = container?.eventEmitter;
    this.context = context;

    this.#iframe = new IFrame(
      `${COMPOSABLE_REVEAL}:${btoa(uuid())}`,
      metaData,
      this.containerId,
      this.context?.logLevel,
    );

    this.#readyToMount = true;

    bus?.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe?.name, (data) => {
      this.#iframe?.setIframeHeight(data?.height);
    });

    window?.addEventListener('message', (event) => {
      if (event?.data?.type === ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + this.#iframe?.name) {
        this.#iframe?.setIframeHeight(event?.data?.data?.height);
      }
    });
    this.eventEmitter.on(`${CUSTOM_ERROR_MESSAGES}:${this.containerId}`, (data) => {
      if (data?.errorMessages) {
        this.#customerErrorMessages = data.errorMessages as Record<ErrorType, string>;
      }
    });

    // eslint-disable-next-line max-len
    if (this.#recordData?.rows) {
      this.setupRenderFileEventListener(this.getRecordData()?.rows);
    }
  }

  private setupRenderFileEventListener(rows: any[]): void {
    if (!rows?.length) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REVEAL_COMPOSABLE_INPUT, ['COMPOSABLE_REVEAL'], true);
    }

    try {
      rows?.forEach((row, rowIndex) => {
        row?.elements?.forEach((element: any, elementIndex: number) => {
          if (!element?.name) return;
          window?.addEventListener('message', (event) => {
            if (event?.data?.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                        + element?.name) {
              this.isComposableFrameReady = true;
            }
          });
          this.registerRenderFileRequestListener(element);
          this.eventEmitter?.on(
            `${ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS}:${element?.name}`,
            (data) => {
              if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS) {
              // make this change in original elememt that is inside rows
                const updatedElement = {
                  ...element,
                  ...data.options,
                  ...formatRevealElementOptions(data.options as IRevealElementOptions),
                };

                // Update element in this.#recordData.rows structure
                if (this.#recordData?.rows?.[rowIndex]?.elements?.[elementIndex]) {
                  this.#recordData.rows[rowIndex].elements[elementIndex] = updatedElement;
                }

                // Update local element reference
                element = updatedElement;

                // Call update method
                this.update(data.options, element);
              }
            },
          );
        });
      });
    } catch (error) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REVEAL_COMPOSABLE_INPUT, ['COMPOSABLE_REVEAL'], true);
    }
  }

  getID() {
    return this.#elementId;
  }

  mount(domElementSelector: HTMLElement | string) {
    if (!domElementSelector) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_IN_MOUNT, ['RevealElement'], true);
    }

    if (domElementSelector instanceof HTMLElement) {
      this.resizeObserver = new ResizeObserver(() => {
        const iframeElements = domElementSelector.getElementsByTagName('iframe');
        if (iframeElements && iframeElements.length > 0) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < iframeElements.length; i++) {
            const iframeElement = iframeElements[i];
            if (
              iframeElement.name === this.#iframe.name
              && iframeElement.contentWindow
            ) {
              iframeElement?.contentWindow?.postMessage(
                {
                  name: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
                },
                properties.IFRAME_SECURE_ORIGIN,
              );
            }
          }
        }
      });
    }

    updateMetricObjectValue(this.#elementId, METRIC_TYPES.DIV_ID, domElementSelector);
    if (
      this.metaData?.clientJSON?.config?.options?.trackMetrics
      && this.metaData.clientJSON.config?.options?.trackingKey
    ) {
      pushElementEventWithTimeout(this.#elementId);
    }

    if (typeof domElementSelector === 'string') {
      const targetElement = document.querySelector(domElementSelector);
      if (targetElement) {
        this.resizeObserver?.observe(targetElement);
      }
    } else if (domElementSelector instanceof HTMLElement) {
      this.resizeObserver?.observe(domElementSelector);
    }

    this.#readyToMount = true;
    this.metaData = {
      ...this.metaData,
      skyflowContainer: {
        isControllerFrameReady: this.metaData.skyflowContainer?.isControllerFrameReady,
      },
    };
    if (this.#readyToMount) {
      this.#iframe.mount(domElementSelector, undefined, {
        record: JSON.stringify({
          ...this.metaData,
          record: this.#recordData,
          context: this.context,
          containerId: this.containerId,
        }),
      });
      bus
        .target(properties.IFRAME_SECURE_ORIGIN)
        .on(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#iframe.name, () => {
          this.#isMounted = true;
          if (this.#recordData.skyflowID) {
            bus
            // .target(location.origin)
              .emit(
                ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.containerId,
                {
                  skyflowID: this.#recordData.skyflowID,
                  containerId: this.containerId,
                },
              );
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
          } else {
            bus
            // .target(location.origin)
              .emit(
                ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.containerId,
                {
                  id: this.#recordData.token,
                  containerId: this.containerId,
                },
              );
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_END_TIME, Date.now());
            updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.MOUNTED);
          }
          if (Object.prototype.hasOwnProperty.call(this.#recordData, 'skyflowID')) {
            bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#iframe.name,
              {}, (payload:any) => {
                this.#iframe.setIframeHeight(payload.height);
              });
          }
        });
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.EVENTS_KEY, EVENT_TYPES.READY);
      updateMetricObjectValue(this.#elementId, METRIC_TYPES.MOUNT_START_TIME, Date.now());
    }
    if (domElementSelector instanceof HTMLElement
      && (domElementSelector as HTMLElement).getRootNode() instanceof ShadowRoot) {
      this.#shadowRoot = domElementSelector.getRootNode() as ShadowRoot;
    } else if (typeof domElementSelector === 'string') {
      const element = document.getElementById(domElementSelector);
      if (element && element.getRootNode() instanceof ShadowRoot) {
        this.#shadowRoot = element.getRootNode() as ShadowRoot;
      }
    }
  }

  protected emitEvent = (eventName: string, options?: Record<string, any>) => {
    const option = {
      ...options,
      errorMessages: this.#customerErrorMessages,
    };
    if (this.#shadowRoot) {
      const iframe = this.#shadowRoot?.getElementById(this.#iframe?.name) as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage({
        name: eventName,
        ...option,
      }, properties?.IFRAME_SECURE_ORIGIN);
    } else {
      const iframe = document?.getElementById(this.#iframe?.name) as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage({
        name: eventName,
        ...option,
      }, properties?.IFRAME_SECURE_ORIGIN);
    }
  };

  // Hook: privacyDB registers a RENDER_FILE_REQUEST listener (which invokes
  // renderFile) for the given composable element here. Token-only flowDB leaves
  // it empty, so the file-render path never wires up.
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected registerRenderFileRequestListener(element: any): void {}

  // Lets the file-render subclass flip the shared mounted flag when the
  // composable frame reports RENDER_MOUNTED (the `#isMounted` field is private
  // and its name is taken by the public isMounted() method).
  protected markMounted(): void {
    this.#isMounted = true;
  }

  iframeName(): string {
    return this.#iframe.name;
  }

  isMounted():boolean {
    return this.#isMounted;
  }

  isClientSetError():boolean {
    return this.#isClientSetError;
  }

  getRecordData() {
    return this.#recordData;
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  setErrorOverride(clientErrorText: string) {
    // to be implemented
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  setError(clientErrorText:string) {
    // to be implemented
  }

  // eslint-disable-next-line class-methods-use-this
  resetError() {
    // to be implemented
  }

  setAltText(altText:string, record) {
    if (this.isComposableFrameReady) {
      this.emitEvent(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record?.name,
        {
          name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record?.name,
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
          updatedValue: altText,
        },
      );
    } else {
      window.addEventListener('message', (event) => {
        if (event.data.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                  + record?.name) {
          this.emitEvent(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record?.name,
            {
              name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record?.name,
              updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT,
              updatedValue: altText,
            },
          );
        }
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  clearAltText() {
    // to be implemented
  }

  unmount() {
    if (this.#recordData.skyflowID) {
      this.#isMounted = false;
      this.#iframe.container?.remove();
    }
    this.#isMounted = false;
    this.#iframe.unmount();
  }

  update(options: TInput | IRevealElementOptions, record) {
    if (this.isComposableFrameReady) {
      this.emitEvent(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
        {
          name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
          updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
          updatedValue: options,
        },
      );
    } else {
      window.addEventListener('message', (event) => {
        if (event.data.type === ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED
                  + record?.name) {
          this.emitEvent(
            ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
            {
              name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + record.name,
              updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS,
              updatedValue: options,
            },
          );
        }
      });
    }
  }
}

export default ComposableRevealInternalElement;
