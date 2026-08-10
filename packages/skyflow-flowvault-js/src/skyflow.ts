/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault (flowDB) Skyflow surface. The full FlowVault Skyflow class lands in a
// later task; for now this re-exports the variant-neutral container/config types
// from @core so copied element/rendering files that import ContainerType (an enum
// value) and the ISkyflow/SkyflowConfigOptions types from '../../skyflow' keep
// resolving to a flowvault-local module.
import { ContainerType, ISkyflow, SkyflowConfigOptions } from '@core/types';

export { ContainerType, ISkyflow, SkyflowConfigOptions };
