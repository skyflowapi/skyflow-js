import { IFRAME_DEFAULT_STYLES } from "../container/constants";
import { properties } from "../properties";

export default (options = {}) => {
  const iframe = document.createElement("iframe");
  var config: any = { ...iframeDefaultAttributes, ...options };

  Object.assign(iframe.style, IFRAME_DEFAULT_STYLES);

  setAttributes(iframe, config);

  if (!iframe.getAttribute("id")) {
    iframe.id = iframe.name;
  }

  return iframe;
};

export const iframeDefaultAttributes = {
  src: "about:blank",
  frameBorder: 0,
  allowtransparency: true,
  scrolling: "no",
  style: "width: 100%; height: 100%",
};

export const getIframeSrc = (uuid) => {
  return properties.IFRAME_SECURE_SITE; //+ "/#" + uuid;
};

export const setAttributes = (element, attributes) => {
  for (let key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      const value = attributes[key];

      if (value === null || value === undefined) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value);
      }
    }
  }
};

export const setStyles = (element: HTMLElement, styles) => {
  //todo: allow limited styles
  for (let key in styles) {
    if (styles.hasOwnProperty(key)) {
      element.style[key] = styles[key];
    }
  }
};
