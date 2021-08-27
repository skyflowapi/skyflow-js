import iframer, {
  setAttributes,
  getIframeSrc,
} from "../../../iframe-libs/iframer";

export default class IFrame {
  name: string;
  metadata: any;
  iframe: HTMLIFrameElement;
  container?: Element;
  constructor(name, metadata, containerId) {
    this.name = name + ":" + containerId;
    this.metadata = metadata;
    this.iframe = iframer({ name: this.name });
  }

  mount = (domElement) => {
    this.unmount();
    try {
      if (typeof domElement === "string")
        this.container = document.querySelector(domElement) || undefined;
      else this.container = domElement;
    } catch (e) {
      throw new Error("Provided element selector is not valid or not found");
    }

    setAttributes(this.iframe, { src: getIframeSrc(this.metadata.uuid) });
    this.container?.appendChild(this.iframe);
  };

  unmount = () => {
    this.iframe.remove();
  };
}
