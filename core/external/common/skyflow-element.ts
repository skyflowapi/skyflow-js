/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { ISkyflowElement } from '@core/types';

// Implements the shared ISkyflowElement contract so the element registry
// threaded through every container can be typed (Record<string, ISkyflowElement>)
// instead of any[].
abstract class SkyflowElement implements ISkyflowElement {
  abstract mount(domElementSelector: HTMLElement | string): void;

  abstract unmount(): void;

  abstract setError(clientErrorText: string): void;

  abstract resetError(): void;

  abstract setErrorOverride(customErrorText: string): void;

  abstract iframeName(): string;

  abstract getID(): string;
}

export default SkyflowElement;
