export default (options = {}) => {
  const iframe = document.createElement("iframe");
  var config: any = { ...iframeDefaultAttributes, ...options };

  if (config.style && typeof config.style !== "string") {
    Object.assign(iframe.style, config.style);
    delete config.style;
  }

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
