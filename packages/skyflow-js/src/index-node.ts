/*
Copyright (c) 2025 Skyflow, Inc.
*/
import CoreCollectElement from '@core/external/collect/collect-element';
import CoreComposableElement from './external/collect/compose-collect-element';
import type { CollectElementUpdateOptions } from './utils/common';
import Skyflow from './skyflow';

export {
  RedactionType,
  ValidationRuleType,
  EventName,
  LogLevel,
  Env,
  ErrorType,
} from './utils/common';

export type {
  IInsertRecordInput as InsertRequest,
  IInsertRecord as InsertRecord,
  IInsertOptions as InsertOptions,
  IUpdateRequest as UpdateRequest,
  IUpdateOptions as UpdateOptions,
  UpdateResponse,
  InsertResponse,
  IDetokenizeInput as DetokenizeRequest,
  DetokenizeRecord,
  DetokenizeResponse,
  IDeleteRecordInput as DeleteRequest,
  IDeleteRecord as DeleteRecord,
  IDeleteOptions as DeleteOptions,
  DeleteResponse,
  IGetInput as GetRequest,
  IGetRecord as GetRecord,
  IGetOptions as GetOptions,
  GetResponse,
  IGetByIdInput as GetByIdRequest,
  GetByIdResponse,
  ContainerOptions,
  CollectElementInput,
  CollectElementUpdateOptions,
  CollectElementOptions,
  ICollectOptions as CollectOptions,
  CollectResponse,
  UploadFilesResponse,
  CardMetadata,
  InputStyles,
  LabelStyles,
  ErrorTextStyles,
  IRevealRecord as RevealRecord,
  RevealResponse,
  RenderFileResponse,
  IValidationRule as ValidationRule,
  ElementState,
  ErrorMessages,
} from './utils/common';

export type {
  IRevealElementInput as RevealElementInput,
  IRevealElementOptions as RevealElementOptions,
} from './external/reveal/reveal-container';

export type { ThreeDSBrowserDetails } from './external/threeds/threeds';

export {
  CardType,
  ElementType,
} from '@core/constants';

export {
  ContainerType,
} from './skyflow';

export type {
  ISkyflow as SkyflowConfig,
} from './skyflow';

// The @core element classes are generic over their update-options type,
// defaulting to the identity-neutral base (no `table`/`skyflowID`). Bind them to
// privacyDB's CollectElementUpdateOptions so the published `update()` accepts
// `{ table, skyflowID }` — matching the pre-split (2.7.9) surface. The runtime
// value stays the real @core class (so `instanceof` is preserved); only the
// exported TYPE is parameterized. The value/type pair below shares one name
// across the value and type namespaces (legal in TS; no-redeclare can't tell).
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
export { default as ThreeDS } from './external/threeds/threeds';
export { default as ComposableRevealContainer } from './external/reveal/composable-reveal-container';
export { default as ComposableRevealElement } from './external/reveal/composable-reveal-element';
export default Skyflow;
