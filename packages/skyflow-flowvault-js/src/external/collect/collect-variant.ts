/*
Copyright (c) 2023 Skyflow, Inc.
*/
// flowDB collect-side key normalization, bound onto the shared @core collect
// containers' `collectVariant` protected field. flowDB accepts the client-facing
// `skyflowId`/`tableName` and remaps them onto the internal `skyflowID`/`table`
// the SET_VALUE handler consumes; it carries the id as `skyflowId`.
import { VariantCollectAdapter } from '@core/types';

const collectVariant: VariantCollectAdapter = {
  normalizeUpdateOptions: (options) => {
    if (Object.prototype.hasOwnProperty.call(options, 'skyflowId')) {
      options.skyflowID = options.skyflowId;
      delete options.skyflowId;
    }
    if (Object.prototype.hasOwnProperty.call(options, 'tableName')) {
      options.table = options.tableName;
      delete options.tableName;
    }
  },
  skyflowIdKey: 'skyflowId',
};

export default collectVariant;
