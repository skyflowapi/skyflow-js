/*
Copyright (c) 2022 Skyflow, Inc.
*/
import iframer, {
  setAttributes,
  getIframeSrc,
} from '@core/iframe-libs/iframer';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { METRIC_TYPES } from '@core/constants';
import SkyflowError from '@core/errors';
import { LogLevel } from '@core/types';
import { updateMetricObjectValue } from '../../../metrics/index';
import { Metadata } from '../../internal/internal-types';

export default class IFrame {
  name: string;

  metadata: Metadata;

  iframe: HTMLIFrameElement;

  container?: Element;

  constructor(name: string, metadata: Metadata, containerId: string, logLevel: LogLevel) {
    const clientDomain = metadata.clientDomain || '';
    this.name = `${name}:${containerId}:${logLevel}:${btoa(clientDomain)}`;
    this.metadata = metadata;
    this.iframe = iframer({
      name: this.name,
      referrer: clientDomain,
      title: name.match(/^element:([^:]+):/)?.[1] ?? name,
    });
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

    setAttributes(this.iframe, { src: `${getIframeSrc()}${data ? `?${btoa(data?.record)}` : ''}` });

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
