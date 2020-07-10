export const properties = {
  IFRAME_SECURE_SITE:
    process.env.IFRAME_SECURE_SITE || "http://localhost:3040/iframe.html",
  VERSION: process.env.npm_package_version || "0.1.1",
  CLIENT_URL:
    process.env.CLIENT_URL || "https://flogo.studio.skyflow.dev/getcreditscore",
  // APP_ID: process.env.APP_ID || "bfa831cab06e11ea81abc6d2cc16794f",
  WORKFLOW_URL: process.env.WORKFLOW_URL || "http://localhost:9999",
  // ORG_APP_ID: process.env.ORG_APP_ID || "c0e915a9904011ea95ba2e321592fd49",
  // ORG_APP_SECRET: process.env.ORG_APP_SECRET || "MpdB0NTs8KT3oBG7rhSTwB5kJ1c=",
};
