/*
Copyright (c) 2022 Skyflow, Inc.
*/
import iframer, {
  setAttributes,
  getIframeSrc,
} from '../../../iframe-libs/iframer';
import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';
import { updateMetricObjectValue } from '../../../metrics/index';
import { METRIC_TYPES } from '../../constants';

export default class IFrame {
  name: string;

  metadata: any;

  iframe: HTMLIFrameElement;

  container?: Element;

  constructor(name, metadata, containerId, logLevel) {
    const clientDomain = metadata.clientDomain || '';
    this.name = `${name}:${containerId}:${logLevel}:${btoa(clientDomain)}`;
    this.metadata = metadata;
    this.iframe = iframer({
      name: this.name,
      referrer: clientDomain,
    });
  }

  mount = (domElement, elementId?: string) => {
    this.unmount();
    try {
      if (typeof domElement === 'string') {
        this.container = document.querySelector(domElement) || undefined;
        if (!this.container) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR,
            [], true);
        }
      } else if (domElement instanceof HTMLElement) {
        this.container = domElement;
      } else {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR,
          [], true);
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      if (elementId) { updateMetricObjectValue(elementId, METRIC_TYPES.ERROR, e.message); }
      // throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR, [], true);
    }

    setAttributes(this.iframe, { src: getIframeSrc() });

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
