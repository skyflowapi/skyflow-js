/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Public Node barrel for skyflow-flowvault-js. Surfaces the flowDB public
// contract under the agreed names: flowDB-specific input/response/option types,
// the element container/element classes, the shared variant-neutral enums/types
// (re-exported from @core via ./utils/common and @core/constants), and the
// public error class SkyflowError (= SkyflowFlowDBError). flowvault is
// elements-only: no pure-JS request/response types, no 3DS, no file upload.
import Skyflow from './skyflow';

// --- flowDB collect / reveal input + option types ---
export {
  CollectElementInput,
  CollectElementOptions,
  CollectElementUpdateOptions,
  ICollectOptions as CollectOptions,
  IFlowDBUpsertOptions as UpsertOptions,
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
  RevealResponse,
  RevealRecord,
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
export { default as CollectElement } from '@core/external/collect/collect-element';
export { default as CollectContainer } from './external/collect/collect-container';
export { default as ComposableContainer } from './external/collect/compose-collect-container';
export { default as ComposableElement } from './external/collect/compose-collect-element';
export { default as RevealContainer } from './external/reveal/reveal-container';
export { default as RevealElement } from './external/reveal/reveal-element';
export { default as ComposableRevealContainer } from './external/reveal/composable-reveal-container';
export { default as ComposableRevealElement } from './external/reveal/composable-reveal-element';

// Public error surface: the flowDB error IS the package's `SkyflowError`.
export { default as SkyflowError } from './libs/skyflow-flowdb-error';

export default Skyflow;
