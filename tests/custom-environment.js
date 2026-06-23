const { TestEnvironment } = require('jest-environment-jsdom');

/**
 * jsdom 20+ marks `window` and `window.location` as non-configurable,
 * which breaks tests that use:
 *   jest.spyOn(global, 'window', 'get').mockReturnValue({...})
 *   Object.defineProperty(window, 'location', {...})
 *
 * This environment patches:
 * 1. Node.js-level Object.defineProperty during the jsdom constructor so that
 *    `window` itself is left configurable.
 * 2. The VM-context Object.defineProperty after setup, so that test calls to
 *    Object.defineProperty(window, 'location', {value:{href}}) use
 *    history.pushState instead (synchronous URL change, no navigation).
 */
class CustomEnvironment extends TestEnvironment {
  constructor(config, context) {
    // Intercept the Node.js Object.defineProperty during parent construction
    // so the jsdom global's 'window' self-reference stays configurable.
    const orig = Object.defineProperty.bind(Object);
    Object.defineProperty = function patchedDefineProperty(obj, prop, desc) {
      if (prop === 'window' && desc && desc.configurable === false) {
        return orig(obj, prop, { ...desc, configurable: true });
      }
      return orig(obj, prop, desc);
    };
    try {
      super(config, context);
    } finally {
      Object.defineProperty = orig;
    }
  }

  async setup() {
    await super.setup();

    // Patch the VM-context Object.defineProperty so tests can do:
    //   Object.defineProperty(window, 'location', { value: { href: '...' } })
    // without hitting "Cannot redefine property: location".
    // We intercept that call and use history.pushState to change the URL
    // synchronously (same-origin only, which covers all test URLs).
    const vmObject = this.global.Object;
    const origDefProp = vmObject.defineProperty;
    const globalWindow = this.global;

    vmObject.defineProperty = function patchedVMDefineProperty(obj, prop, desc) {
      if (prop === 'location' && obj === globalWindow && desc && desc.value) {
        const loc = desc.value;
        if (loc.href) {
          try {
            const url = new URL(loc.href);
            globalWindow.history.pushState({}, '', url.pathname + url.search + url.hash);
          } catch (_) {
            // If the URL change fails (cross-origin etc.) fall through to the
            // original call so the error surfaces normally.
          }
        }
        return obj;
      }
      return origDefProp(obj, prop, desc);
    };
  }
}

module.exports = CustomEnvironment;
