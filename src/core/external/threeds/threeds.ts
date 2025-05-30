import SkyflowError from '../../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';

/*
Copyright (c) 2022 Skyflow, Inc.
*/
export interface ThreeDSBrowserDetails {
  browser_accept_header: string;
  browser_ip?: string;
  browser_language: string;
  browser_color_depth: string;
  browser_screen_height: number;
  browser_screen_width: number;
  browser_tz: number;
  browser_user_agent: string;
  challenge_window_size?: string;
  browser_java_enabled?: boolean;
  browser_javascript_enabled?: boolean;
  accept_language: string[]
}

class ThreeDS {
  static getBrowserDetails(): ThreeDSBrowserDetails {
    const browserData: ThreeDSBrowserDetails = {
      browser_accept_header: 'application/json',
      browser_color_depth: String(window.screen.colorDepth),
      browser_screen_height: window.screen.height,
      browser_screen_width: window.screen.width,
      browser_user_agent: window.navigator.userAgent,
      browser_java_enabled: window.navigator.javaEnabled(),
      browser_language: window.navigator.language,
      browser_tz: new Date().getTimezoneOffset(),
      browser_javascript_enabled: true,
      accept_language: [...navigator.languages],
    };
    return browserData;
  }

  static showChallenge = (
    acsUrl: string,
    cReq: string,
    challengeWindowSize: string = '05',
    container?: HTMLElement,
  ): HTMLIFrameElement => {
    if (!acsUrl) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FIELD_SHOW_3DS_CHALLEGNGE, ['acsUrl'], true);
    }
    if (!cReq) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FIELD_SHOW_3DS_CHALLEGNGE, ['cReq'], true);
    }
    if (container && !(container instanceof HTMLElement)) {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FIELD_SHOW_3DS_CHALLEGNGE, ['container'], true);
    }
    const windowSize = ThreeDS.#getWindowSize(challengeWindowSize);
    const iFrame = ThreeDS.#createIFrame(
      container || document.body,
      'threeDSCReqIFrame',
      'threeDSCReqIframe',
      windowSize[0],
      windowSize[1],
    );
    iFrame.sandbox.add('allow-pointer-lock');
    ThreeDS.#init3DSChallengeRequest(acsUrl, cReq, iFrame);
    return iFrame;
  };

  static #getWindowSize = (challengeWindowSize = '05') => {
    switch (challengeWindowSize) {
      case '01':
        return ['250px', '400px'];
      case '02':
        return ['390px', '400px'];
      case '03':
        return ['500px', '600px'];
      case '04':
        return ['600px', '400px'];
      case '05':
        return ['100%', '100%'];
      default:
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FIELD_SHOW_3DS_CHALLEGNGE, ['challengeWindowSize'], true);
    }
  };

  static #createIFrame = (
    container: HTMLElement,
    name: string,
    id: string,
    width: string = '0',
    height: string = '0',
  ) => {
    const iframe = document.createElement('iframe');
    iframe.width = width;
    iframe.height = height;
    iframe.name = name;
    iframe.setAttribute('id', id);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('border', '0');
    iframe.setAttribute('style', 'overflow:hidden; position:absolute');
    iframe.setAttribute('allowfullscreen', 'false');
    iframe.setAttribute('allowpaymentrequest', 'false');
    iframe.setAttribute('allow', 'payment; publickey-credentials-get');
    iframe.sandbox.add('allow-forms', 'allow-scripts', 'allow-same-origin');

    container.appendChild(iframe);

    return iframe;
  };

  static #init3DSChallengeRequest = (
    acsUrl: string,
    creqData: string,
    container: HTMLIFrameElement,
  ) => {
    const html = document.createElement('html');
    const body = document.createElement('body');
    const form = ThreeDS.#createForm(
      'challengeRequestForm',
      acsUrl,
      container.name,
      'creq',
      encodeURIComponent(creqData),
    );

    body.appendChild(form);
    html.appendChild(body);
    container.appendChild(html);

    form.submit();

    return container;
  };

  static #createForm = (
    formName: string,
    formAction: string,
    formTarget: string,
    inputName: string,
    inputValue: string,
  ) => {
    const form = document.createElement('form');
    form.name = formName;
    form.action = formAction;
    form.method = 'POST';
    form.target = formTarget;
    form.enctype = 'application/x-www-form-urlencoded';

    const input = document.createElement('input');
    input.name = inputName;
    input.value = inputValue;
    form.appendChild(input);
    form.style.display = 'none';
    return form;
  };
}

export default ThreeDS;
