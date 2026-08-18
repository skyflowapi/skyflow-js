/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Public Node barrel for skyflow-flowvault-js. Surfaces the flowDB public
// contract under the agreed names: flowDB-specific input/response/option types,
// the element container/element classes, the shared variant-neutral enums/types
// (re-exported from @core via ./utils/common and @core/constants), and the
// public error class SkyflowError (= SkyflowFlowDBError). flowvault is
// elements-only: no pure-JS request/response types, no 3DS, no file upload.
import CoreCollectElement from '@core/external/collect/collect-element';
import CoreComposableElement from './external/collect/compose-collect-element';
import type { CollectElementUpdateOptions } from './utils/common';
import Skyflow from './skyflow';

// --- flowDB collect / reveal input + option types ---
export {
  CollectElementInput,
  CollectElementOptions,
  CollectElementUpdateOptions,
  ICollectOptions as CollectOptions,
  IFlowDBUpsertOptions as UpsertOptions,
  AdditionalFields,
  AdditionalFieldsRecord,
  IFlowDBRevealElementInput as RevealElementInput,
  IRevealElementOptions as RevealElementOptions,
  IRevealOptions as RevealOptions,
  TokenGroupRedaction,
  UpdateType,
  ContainerOptions,
  // Shared variant-neutral enums / types (re-exported from @core by ./utils/common)
  RedactionType,
  RequestMethod,
  ValidationRuleType,
  IValidationRule as ValidationRule,
  EventName,
  LogLevel,
  Env,
  ElementState,
  ErrorType,
  ErrorMessages,
  InputStyles,
  LabelStyles,
  ErrorTextStyles,
  CardMetadata,
} from './utils/common';

// --- flowDB public response types ---
export {
  CollectResponse,
  CollectRecord,
  CollectRecordToken,
  CollectRecordHashedData,
  RevealResponse,
  RevealRecord,
  RevealRecordMetadata,
} from './internal/internal-types';

export {
  CardType,
  ElementType,
} from '@core/constants';

export {
  ContainerType,
  ISkyflow as SkyflowConfig,
} from './skyflow';

// --- element container / element classes ---
// The @core element classes are generic over their update-options type,
// defaulting to the identity-neutral base (no `tableName`/`skyflowId`). Bind them
// to flowDB's CollectElementUpdateOptions so the published `update()` accepts
// `{ tableName, skyflowId }`. The runtime value stays the real @core class (so
// `instanceof` is preserved); only the exported TYPE is parameterized. The
// value/type pair shares one name across namespaces (legal in TS; no-redeclare
// can't tell).
export const CollectElement = CoreCollectElement;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type CollectElement = CoreCollectElement<CollectElementUpdateOptions>;
export const ComposableElement = CoreComposableElement;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ComposableElement = CoreComposableElement<CollectElementUpdateOptions>;

export { default as CollectContainer } from './external/collect/collect-container';
export { default as ComposableContainer } from './external/collect/compose-collect-container';
export { default as RevealContainer } from './external/reveal/reveal-container';
export { default as RevealElement } from './external/reveal/reveal-element';
export { default as ComposableRevealContainer } from './external/reveal/composable-reveal-container';
export { default as ComposableRevealElement } from './external/reveal/composable-reveal-element';

// Public error surface: the flowDB error IS the package's `SkyflowError`.
export { default as SkyflowError } from './libs/skyflow-flowdb-error';

export default Skyflow;
