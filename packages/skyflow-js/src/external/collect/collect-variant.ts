/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB collect-side key normalization, bound onto the shared @core collect
// containers' `collectVariant` protected field. privacyDB consumes the internal
// `skyflowID`/`table` keys directly, so `normalizeUpdateOptions` is a no-op.
import { VariantCollectAdapter } from '@core/types';

const collectVariant: VariantCollectAdapter = {
  normalizeUpdateOptions: () => {},
  skyflowIdKey: 'skyflowID',
};

export default collectVariant;
