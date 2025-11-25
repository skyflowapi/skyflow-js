/*
Copyright (c) 2022 Skyflow, Inc.
*/
const properties = {
  IFRAME_SECURE_SITE: process.env.IFRAME_SECURE_ORIGIN,
  IFRAME_SECURE_ORIGIN: process.env.IFRAME_SECURE_ORIGIN || '',
};

export default properties;
