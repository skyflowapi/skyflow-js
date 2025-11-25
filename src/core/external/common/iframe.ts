/*
Copyright (c) 2022 Skyflow, Inc.
*/
import iframer, {
  setAttributes,
  getIframeSrcByType,
} from '../../../iframe-libs/iframer';
import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import { updateMetricObjectValue } from '../../../metrics/index';
import {
  METRIC_TYPES, FRAME_ELEMENT, FRAME_REVEAL, COMPOSABLE_REVEAL,
} from '../../constants';
import { LogLevel } from '../../../index-node';
import { Metadata } from '../../internal/internal-types';

export default class IFrame {
  name: string;

  metadata: Metadata;

  iframe: HTMLIFrameElement;

  container?: Element;

  #frameType: string;

  constructor(name: string, metadata: Metadata, containerId: string, logLevel: LogLevel) {
    const clientDomain = metadata.clientDomain || '';
    this.name = `${name}:${containerId}:${logLevel}:${btoa(clientDomain)}`;
    this.metadata = metadata;

    // Determine frame type from name
    const namePrefix = name.split(':')[0];
    console.log('namePrefix', namePrefix);
    if (namePrefix === FRAME_ELEMENT || namePrefix === 'element') {
      this.#frameType = FRAME_ELEMENT;
    } else if (namePrefix === FRAME_REVEAL || namePrefix === 'reveal') {
      this.#frameType = FRAME_REVEAL;
    } else if (namePrefix === COMPOSABLE_REVEAL || namePrefix === 'reveal-composable') {
      this.#frameType = COMPOSABLE_REVEAL;
    } else {
      this.#frameType = FRAME_ELEMENT; // Default fallback
    }
    this.iframe = iframer({
      name: this.name,
      referrer: clientDomain,
      title: name.match(/^element:([^:]+):/)?.[1] ?? name,
    });
    console.log('src', this.iframe.src);
  }

  mount = (domElement, elementId?: string, data?: any) => {
    // this.unmount();
    try {
      if (typeof domElement === 'string') {
        this.container = document.querySelector(domElement) || undefined;
        if (!this.container) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR, [], true);
        }
      } else if (domElement instanceof HTMLElement) {
        this.container = domElement;
      } else {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR, [], true);
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      if (elementId) { updateMetricObjectValue(elementId, METRIC_TYPES.ERROR, e.message); }
      // throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR, [], true);
    }

    setAttributes(this.iframe, { src: `${getIframeSrcByType(this.#frameType)}${data ? `?${btoa(data?.record)}` : ''}` });
    console.log('iframe src before set', getIframeSrcByType(this.#frameType));

    this.container?.appendChild(this.iframe);
  };

  setIframeHeight = (height) => {
    if (this.iframe.getAttribute('height') !== height) {
      this.iframe.setAttribute('height', `${height}px`);
    }
  };

  unmount = () => {
    this.iframe.remove();
  };
}
