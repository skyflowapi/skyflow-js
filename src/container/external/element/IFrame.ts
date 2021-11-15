import iframer, {
  setAttributes,
  getIframeSrc,
} from '../../../iframe-libs/iframer';
import SkyflowError from '../../../libs/SkyflowError';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';

export default class IFrame {
  name: string;

  metadata: any;

  iframe: HTMLIFrameElement;

  container?: Element;

  constructor(name, metadata, containerId, logLevel) {
    this.name = `${name}:${containerId}:${logLevel}`;
    this.metadata = metadata;
    this.iframe = iframer({ name: this.name });
  }

  mount = (domElement) => {
    this.unmount();
    try {
      if (typeof domElement === 'string') {
        this.container = document.querySelector(domElement) || undefined;
        if (!this.container) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR, [], true);
        }
      } else this.container = domElement;
    } catch (e) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ELEMENT_SELECTOR, [], true);
    }

    setAttributes(this.iframe, { src: getIframeSrc() });
    this.container?.appendChild(this.iframe);
  };

  unmount = () => {
    this.iframe.remove();
  };
}
