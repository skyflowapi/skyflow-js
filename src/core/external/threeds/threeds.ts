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
}

class ThreeDS {
  static getBroswerDetails(): ThreeDSBrowserDetails {
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
    };
    return browserData;
  }
}

export default ThreeDS;
