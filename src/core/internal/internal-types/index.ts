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

export interface ContainerProps {
  containerId: string;
  isMounted: boolean;
  type: string;
}

export interface RevealContainerProps {
  containerId: string;
  isMounted: boolean;
  eventEmitter: EventEmitter;
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
  getSkyflowBearerToken: () => Promise<string> | undefined;
  clientJSON: ClientToJSON;
  containerType: ContainerType;
  skyflowContainer: SkyflowContainer;
}
