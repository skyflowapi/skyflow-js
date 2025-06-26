import { CollectElementOptions, ICollectOptions } from '../../../utils/common';
import { ElementType } from '../../constants';

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

export interface InternalState {
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
