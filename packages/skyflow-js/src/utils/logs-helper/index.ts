/*
Copyright (c) 2022 Skyflow, Inc.
*/
// The variant-neutral logging helpers, including `printLog`, live in
// @core/utils/logs-helper (`printLog` reads this bundle's injected
// SDK_NAME/SDK_VERSION). Re-exported here so existing `../logs-helper`
// importers keep resolving them from a single package surface.
export {
  LogLevelOptions, EnvOptions, parameterizedString, getElementName, printLog,
} from '@core/utils/logs-helper';
