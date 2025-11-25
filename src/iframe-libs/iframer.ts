/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  IFRAME_DEFAULT_STYLES,
  FRAME_ELEMENT,
  FRAME_REVEAL,
  COMPOSABLE_REVEAL,
  SKYFLOW_FRAME_CONTROLLER,
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
 * Get iframe source URL based on frame type
 * @param frameType - Type of frame (FRAME_ELEMENT, FRAME_REVEAL, etc.)
 * @returns URL to the appropriate iframe HTML file
 */
export const getIframeSrcByType = (frameType: string): string => {
  const secureSite = properties.IFRAME_SECURE_SITE;

  console.log('secureSite frameType', secureSite);

  // If IFRAME_SECURE_SITE ends with .html, use monolithic bundle (backwards compatible)
  // This happens in dev mode with npm run dev (not npm run dev:split)
  if (secureSite.endsWith('.html')) {
    return secureSite; // Use monolithic iframe.html
  }

  // Otherwise, use split bundles (production or npm run dev:split)
  const baseUrl = secureSite.replace(/\/$/, ''); // Remove trailing slash if present

  switch (frameType) {
    case FRAME_ELEMENT:
      return `${baseUrl}/collect.html`;
    case FRAME_REVEAL:
      return `${baseUrl}/reveal.html`;
    case COMPOSABLE_REVEAL:
      return `${baseUrl}/composable-reveal.html`;
    case SKYFLOW_FRAME_CONTROLLER:
      return `${baseUrl}/controller.html`;
    default:
      return secureSite; // Fallback to default
  }
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
