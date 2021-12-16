abstract class SkyflowElement {
  abstract mount(domElementSelector);

  abstract unmount();

  abstract setError(clientErrorText:string);

  abstract resetError();
}

export default SkyflowElement;
