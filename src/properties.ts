export const properties = {
  IFRAME_SECURE_SITE:
    process.env.IFRAME_SECURE_SITE ||
    "https://skyflow-js.s3-us-west-2.amazonaws.com/iframe.html",
  VERSION: process.env.npm_package_version || "0.1.1",
};
