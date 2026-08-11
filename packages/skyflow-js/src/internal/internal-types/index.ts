import { ContainerType, ElementInfo, ClientMetadata } from '@core/types';
import { ElementType } from '@core/constants';
import { ClientToJSON } from '@core/client';
import CollectContainer from '../../external/collect/collect-container';
import ComposableContainer from '../../external/collect/compose-collect-container';
import RevealContainer from '../../external/reveal/reveal-container';
import { ICollectOptions } from '../../utils/common';
import SkyflowContainer from '../../external/skyflow-container';

// The variant-neutral internal types now live in `@core/types`; re-exported here
// so the existing `internal-types` importers keep resolving them. The types
// below stay in the package because they reference privacyDB container classes,
// the client, or the privacyDB `ICollectOptions`.
export {
  ElementInfo,
  ContainerProps,
  RevealContainerProps,
  InternalState,
  BatchInsertRequestBody,
  FormattedCollectElementOptions,
  ClientMetadata,
} from '@core/types';

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

export interface SkyflowElementProps {
  id: string;
  type: ElementType;
  element: HTMLElement;
  container: CollectContainer | RevealContainer | ComposableContainer;
}

export interface Metadata extends ClientMetadata {
  clientJSON: ClientToJSON;
  containerType: ContainerType;
  skyflowContainer: SkyflowContainer;
  getSkyflowBearerToken: () => Promise<string>;
}
