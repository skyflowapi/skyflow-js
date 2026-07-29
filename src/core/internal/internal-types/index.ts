import { ClientToJSON } from '../../../client';
import EventEmitter from '../../../event-emitter';
import { CollectContainer, ComposableContainer, RevealContainer } from '../../../index-node';
import { ContainerType } from '../../../skyflow';
import {
  CollectElementOptions, ICollectOptions, RedactionType, UpdateType,
} from '../../../utils/common';
import { ElementType } from '../../constants';
import SkyflowContainer from '../../external/skyflow-container';

export interface ElementInfo {
  frameId: string;
  elementId: string;
}

export interface TokenizeDataInput extends ICollectOptions{
  type: string;
  elementIds: Array<ElementInfo>;
  containerId: string;
}

export interface UploadFileDataInput extends ICollectOptions {
  type: string;
  elementIds: Array<string>;
  containerId: string;
}

export interface BatchInsertRequestBody {
  method: string;
  quorum?: boolean;
  tableName: string;
  fields?: Record<string, any>;
  upsert?: string;
  ID?: string;
  tokenization?: boolean;
  [key: string]: any;
}

export interface FlowDBUpsert {
  updateType?: UpdateType;
  uniqueColumns: string[];
}

export interface FlowDBInsertRecordData {
  data: Record<string, any>;
  tokens?: Record<string, any>;
  tableName?: string;
  upsert?: FlowDBUpsert;
}

export interface FlowDBInsertRequestBody {
  vaultID: string | undefined;
  tableName?: string;
  records: FlowDBInsertRecordData[];
  upsert?: FlowDBUpsert;
}

export interface FlowDBUpdateRecordData {
  skyflowID: string;
  data: Record<string, any>;
  tokens?: Record<string, any>;
  tableName?: string;
  updateType?: 'UPDATE' | 'REPLACE';
}

export interface FlowDBUpdateRequestBody {
  vaultID: string | undefined;
  tableName?: string;
  records: FlowDBUpdateRecordData[];
  updateType?: 'UPDATE' | 'REPLACE';
}

export interface FlowDBRecordResponse {
  skyflowID: string | null;
  tokens?: Record<string, any>;
  data?: Record<string, any>;
  hashedData?: Record<string, any>;
  error?: string | null;
  httpCode?: number;
  tableName: string;
}

export interface FlowDBInsertResponseBody {
  records: FlowDBRecordResponse[];
}

export interface FlowDBError {
  code?: number | string;
  description?: string;
}

export interface CollectRecord {
  tableName?: string;
  skyflowId?: string;
  tokens?: Record<string, any>;
  hashedData?: Record<string, any>;
  httpCode: number;
  error?: string;
}

export interface CollectResponse {
  records: Array<CollectRecord>;
}

export interface FlowDBFullError {
  grpcCode?: number;
  httpCode?: number | string;
  message?: string;
  httpStatus?: string;
  details?: any[];
}

export interface CollectError {
  error: FlowDBFullError;
}

export interface FlowDBTokenGroupRedaction {
  tokenGroupName: string;
  redaction: RedactionType | string;
}

export interface FlowDBDetokenizeRequestBody {
  vaultID: string | undefined;
  tokens: string[];
  tokenGroupRedactions?: FlowDBTokenGroupRedaction[];
}

export interface FlowDBDetokenizeResponseObject {
  token: string;
  value?: any;
  tokenGroupName?: string | null;
  error?: string | null;
  httpCode?: number;
  metadata?: Record<string, any>;
}

export interface FlowDBDetokenizeResponseBody {
  response: FlowDBDetokenizeResponseObject[];
}

export interface FlowDBDetokenizeResponseRecord {
  token: string;
  value?: any;
  tokenGroupName?: string | null;
  metadata?: Record<string, any>;
  httpCode?: number;
}

export interface FlowDBDetokenizeResponseRecordError {
  token: string;
  error: FlowDBError;
}

export interface FlowDBDetokenizeResponse {
  records: FlowDBDetokenizeResponseRecord[];
  errors: FlowDBDetokenizeResponseRecordError[];
}

export interface FlowDBDetokenizeRequestError {
  errors: FlowDBDetokenizeResponseRecordError[];
  // Raw full-failure body passed through for the element/composable reveal contract.
  error?: FlowDBFullError;
}

export interface RevealRecord {
  token: string;
  tokenGroupName?: string;
  metadata?: Record<string, any>;
  httpCode: number;
  error?: string;
}

export interface RevealResponse {
  records: Array<RevealRecord>;
}

export interface RevealError {
  error: FlowDBFullError;
}

export interface ContainerProps {
  containerId: string;
  isMounted: boolean;
  type: string;
}

export interface RevealContainerProps {
  containerId: string;
  isMounted: boolean;
  eventEmitter: EventEmitter;
  type: string;
}

export interface InternalState {
  metaData: any;
  isEmpty: boolean,
  isValid: boolean,
  isFocused: boolean,
  isRequired: boolean,
  name: string;
  elementType: ElementType;
  isComplete: boolean;
  value: string | Blob | undefined;
  selectedCardScheme: string;
}

export interface FormattedCollectElementOptions extends CollectElementOptions {
  [key: string]: any;
}

export interface SkyflowElementProps {
  id: string;
  type: ElementType;
  element: HTMLElement;
  container: CollectContainer | RevealContainer | ComposableContainer;
}

export interface ClientMetadata {
  uuid: string,
  clientDomain: string,
  sdkVersion?: string;
  sessionId?: string;
}

export interface Metadata extends ClientMetadata {
  clientJSON: ClientToJSON;
  containerType: ContainerType;
  skyflowContainer: SkyflowContainer;
  getSkyflowBearerToken: () => Promise<string>;
}
