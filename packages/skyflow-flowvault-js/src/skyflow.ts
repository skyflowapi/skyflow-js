/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault (flowDB) public Skyflow shell. The constructor, `static init()`, the
// bearer-token plumbing, the `container()` overloads/switch and the shared static
// enum getters all live in `@core/external/base-skyflow`; this subclass supplies
// only what is genuinely flowDB-specific:
//   - the five container factory hooks (which concrete class to `new`)
//   - `static get Error()` (SkyflowFlowDBError — the flowDB public error surface)
//     and `static get UpdateType()`
//
// flowvault is elements-only: it exposes ONLY the inherited element `container()`
// factory (COLLECT / REVEAL / COMPOSABLE collect / COMPOSE_REVEAL) — no pure-JS
// insert/detokenize/get/delete/update, no 3DS (per package-split §9 decisions).
// COMPOSABLE collect has no file upload (flowDB has none). Its controller-frame
// container is the shared `@core` base as-is, re-exported by
// ./external/skyflow-container.
import Client from '@core/client';
import BaseSkyflow from '@core/external/base-skyflow';
import {
  ContainerOptions,
  ContainerType,
  Context,
  ICoreMetadata,
  ISkyflow,
  ISkyflowElement,
  SkyflowConfigOptions,
} from '@core/types';
import RevealContainer from './external/reveal/reveal-container';
import CollectContainer from './external/collect/collect-container';
import ComposableContainer from './external/collect/compose-collect-container';
import ComposableRevealContainer from './external/reveal/composable-reveal-container';
import SkyflowContainer from './external/skyflow-container';
import SkyflowFlowDBError from './libs/skyflow-flowdb-error';
import { UpdateType } from './utils/common';

// Relocated to @core/types (variant-neutral); re-exported here under the same
// names so `./skyflow` importers and the public surface are unchanged.
export { ContainerType };
export type { ISkyflow, SkyflowConfigOptions };

class Skyflow extends BaseSkyflow<
SkyflowContainer,
CollectContainer,
RevealContainer,
ComposableContainer,
ComposableRevealContainer
> {
  // ---- Injected divergence: which concrete class to `new` --------------------
  // Prototype methods, not arrow-function fields — `instantiateSkyflowContainer`
  // is called from the base constructor, before subclass fields initialize.

  // eslint-disable-next-line class-methods-use-this
  protected instantiateSkyflowContainer(client: Client, context: Context): SkyflowContainer {
    return new SkyflowContainer(client, context);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createCollectContainer(
    metaData: ICoreMetadata,
    skyflowElements: Record<string, ISkyflowElement>,
    context: Context,
    options?: ContainerOptions,
  ): CollectContainer {
    return new CollectContainer(metaData, skyflowElements, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createRevealContainer(
    metaData: ICoreMetadata,
    skyflowElements: Record<string, ISkyflowElement>,
    context: Context,
    options?: ContainerOptions,
  ): RevealContainer {
    return new RevealContainer(metaData, skyflowElements, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createComposableContainer(
    metaData: ICoreMetadata,
    skyflowElements: Record<string, ISkyflowElement>,
    context: Context,
    options: ContainerOptions,
  ): ComposableContainer {
    return new ComposableContainer(metaData, skyflowElements, context, options);
  }

  // eslint-disable-next-line class-methods-use-this
  protected createComposeRevealContainer(
    metaData: ICoreMetadata,
    skyflowElements: Record<string, ISkyflowElement>,
    context: Context,
    options?: ContainerOptions,
  ): ComposableRevealContainer {
    return new ComposableRevealContainer(metaData, skyflowElements, context, options);
  }

  // ---- Package-specific statics (the rest are inherited from BaseSkyflow) ----

  static get UpdateType() {
    return UpdateType;
  }

  static get Error() {
    return SkyflowFlowDBError;
  }
}
export default Skyflow;
