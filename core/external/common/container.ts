/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Shared root of every container (collect / reveal / composable). Not an empty
// marker: it carries the contract all containers implement identically — the
// `type` discriminator and `setError`. State fields (containerId/metaData/context)
// are intentionally left to the subclasses, which diverge in visibility
// (RevealContainer keeps them #private; the others are protected).
import { ErrorType } from '@core/types';

abstract class Container {
  abstract type: string;

  abstract setError(errors: Partial<Record<ErrorType, string>>): void;
}

export default Container;
