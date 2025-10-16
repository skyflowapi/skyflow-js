/*
Copyright (c) 2022 Skyflow, Inc.
*/
abstract class SkyflowElement {
  abstract mount(domElementSelector: HTMLElement | string): void;

  abstract unmount(): void;

  abstract setError(clientErrorText: string): void;

  abstract resetError(): void;

  abstract setErrorOverride(customErrorText: string): void;

  abstract iframeName(): string;

  abstract getID(): string;
}

export default SkyflowElement;
