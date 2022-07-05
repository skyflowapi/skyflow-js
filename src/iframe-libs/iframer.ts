/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  IFRAME_DEFAULT_STYLES,
} from '../core/constants';
import properties from '../properties';

export const iframeDefaultAttributes = {
  src: 'about:blank',
  frameBorder: 0,
  allowtransparency: true,
  scrolling: 'no',
  style: 'width: 100%; height: 100%',
  allow: 'clipboard-read; clipboard-write',
};

export const setAttributes = (element, attributes) => {
  Object.keys(attributes).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      const value = attributes[key];

      if (value === null || value === undefined) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value);
      }
    }
  });
};

export default (options = {}) => {
  const iframe = document.createElement('iframe');
  const config: any = { ...iframeDefaultAttributes, ...options };

  Object.assign(iframe.style, IFRAME_DEFAULT_STYLES);

  setAttributes(iframe, config);

  if (!iframe.getAttribute('id')) {
    iframe.id = iframe.name;
  }

  return iframe;
};

export const getIframeSrc = () => properties.IFRAME_SECURE_SITE;

export const setStyles = (element: HTMLElement, styles) => {
  // todo: allow limited styles
  Object.keys(styles).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      element.style[key] = styles[key];
    }
  });
};
