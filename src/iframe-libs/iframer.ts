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
  style: 'width: 100%;',
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

/**
 * Get iframe source URL - now returns single iframe.html for all types
 * The iframe.html will dynamically load the appropriate bundle based on frame name
 * @param frameType - Type of frame (not used anymore, kept for backwards compatibility)
 * @returns URL to iframe.html (single entry point for all frame types)
 */
export const getIframeSrcByType = (_frameType: string): string => {
  const secureSite = properties.IFRAME_SECURE_SITE;
  // keep param for backwards compatibility
  if (_frameType) { /* intentionally unused */ }

  // debug: secureSite and frameType

  // If IFRAME_SECURE_SITE ends with .html, return as-is (monolithic or dynamic loader)
  if (secureSite.endsWith('.html')) {
    return secureSite;
  }

  // Append iframe.html to base URL
  const baseUrl = secureSite.replace(/\/$/, ''); // Remove trailing slash
  return `${baseUrl}/iframe.html`;

  // Note: iframe.html will read window.name to determine which bundle to load
  // This enables 1-to-many mapping: single HTML → multiple bundles
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
