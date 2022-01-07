abstract class SkyflowElement {
  abstract mount(domElementSelector);

  abstract unmount();

  abstract setError(clientErrorText:string);

  abstract resetError();

  abstract iframeName();

  abstract getID();
}

export default SkyflowElement;
