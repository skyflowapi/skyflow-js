import { ClientToJSON } from '../../../client';
import EventEmitter from '../../../event-emitter';
import { CollectContainer, ComposableContainer, RevealContainer } from '../../../index-node';
import { ContainerType } from '../../../skyflow';
import { CollectElementOptions, ICollectOptions } from '../../../utils/common';
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
  updateType?: 'UPDATE' | 'REPLACE';
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
  skyflowID: string;
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

export interface FlowDBInsertResponseRecord {
  table: string;
  fields: Record<string, any>;
  hashedData?: Record<string, any>;
}

export interface FlowDBInsertResponseRecordError {
  table?: string;
  error: FlowDBError;
}

export interface FlowDBInsertResponse {
  records: FlowDBInsertResponseRecord[];
  errors: FlowDBInsertResponseRecordError[];
}

export interface FlowDBInsertRequestError {
  errors: FlowDBInsertResponseRecordError[];
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
