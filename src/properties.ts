export const properties = {
  IFRAME_SECURE_SITE:
    process.env.IFRAME_SECURE_SITE || "https://skyflow-js.s3-us-west-2.amazonaws.com/iframe.html",
  VERSION: process.env.npm_package_version || "0.1.1",
  // APP_ID: process.env.APP_ID || "bfa831cab06e11ea81abc6d2cc16794f",
  WORKFLOW_URL: process.env.WORKFLOW_URL || "https://api-js.skyflow.dev",
  // ORG_APP_ID: process.env.ORG_APP_ID || "c0e915a9904011ea95ba2e321592fd49",
  // ORG_APP_SECRET: process.env.ORG_APP_SECRET || "MpdB0NTs8KT3oBG7rhSTwB5kJ1c=",
};
