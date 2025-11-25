/*
Copyright (c) 2022 Skyflow, Inc.
*/
const properties = {
  IFRAME_SECURE_SITE: 'http://js.skyflow.dev/', // Default monolithic
  IFRAME_SECURE_ORIGIN: 'http://js.skyflow.dev',
  // For split bundles in dev, the base path would be 'http://localhost:3040/'
  // and getIframeSrcByType will append the specific HTML file
};

export default properties;
