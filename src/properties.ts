/*
Copyright (c) 2022 Skyflow, Inc.
*/
const properties = {
  IFRAME_SECURE_ORGIN: process.env.IFRAME_SECURE_ORGIN || '',
  IFRAME_SECURE_SITE: `${process.env.IFRAME_SECURE_ORGIN}/${process.env.IFRAME_SECURE_SITE}` || '',
};

export default properties;
