// Block Cloudflare Challenge Scripts if injected
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import Skyflow from './skyflow';

(function () {
  const originalCreateElement = document.createElement;

  // Override createElement to detect injected scripts
  document.createElement = function (tagName: any, ...args: any) {
    const el = originalCreateElement.call(document, tagName, ...args);

    if (tagName.toLowerCase() === 'script') {
      // When the injected script URL contains Cloudflare pattern
      Object.defineProperty(el, 'src', {
        set(value) {
          if (value && value.includes('/cdn-cgi/challenge-platform')) {
            console.warn(
              '[Skyflow SDK] Blocked Cloudflare injected script:',
              value,
            );
            return; // Do not set src (block execution)
          }
          el.setAttribute('src', value);
        },
        get() {
          return el.getAttribute('src');
        },
      });
    }

    return el;
  };
}());

(function intit(root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
}(window));
