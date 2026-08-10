/*
Copyright (c) 2022 Skyflow, Inc.
*/

// privacyDB implementation of the shared `VariantAdapter` contract (Task 4.5).
// Thin wrapper over this package's `core-utils` + `utils/helpers`; the shared
// `@core` element/frame layer consumes it in Tasks 4.6/4.7.

import { VariantAdapter } from '@core/adapters';
import {
  fetchRecordsByTokenIdComposable,
  formatRecordsForClientComposable,
} from './core-utils/reveal';
import { getMetaObject, SDK_DETAILS } from './utils/helpers';
import { printLog } from './utils/logs-helper';

const skyflowVariantAdapter: VariantAdapter = {
  sdkDetails: SDK_DETAILS,
  getMetaObject: (metaData, navigator) => getMetaObject(SDK_DETAILS, metaData, navigator),
  printLog,
  reveal: {
    fetchRecordsByTokenIdComposable,
    formatRecordsForClientComposable,
  },
  collect: {
    // privacyDB consumes the internal `skyflowID`/`table` keys directly.
    normalizeUpdateOptions: () => {},
    skyflowIdKey: 'skyflowID',
  },
};

export default skyflowVariantAdapter;
