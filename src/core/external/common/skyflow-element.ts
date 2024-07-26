/*
Copyright (c) 2022 Skyflow, Inc.
*/
abstract class SkyflowElement {
  abstract mount(domElementSelector);

  abstract unmount();

  abstract setError(clientErrorText:string);

  abstract resetError();

  abstract setErrorOverride(customErrorText:string);

  abstract iframeName();

  abstract getID();
}

export default SkyflowElement;
