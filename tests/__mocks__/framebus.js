/*
 * Manual mock for framebus v6.
 *
 * framebus v4 exported a singleton instance; v6 exports the Framebus class.
 * Tests were written against the v4 singleton pattern:
 *   import bus from 'framebus';
 *   jest.spyOn(bus, 'emit');
 *
 * This mock makes the default export look like a v4 singleton (an object with
 * emit/on/off/target as own methods) while also being constructable.
 * A Proxy is used so that new Framebus() instances delegate method lookups back
 * to the class object — meaning a jest.spyOn(bus, 'emit') spy installed on the
 * class is automatically seen by all instances created in source code.
 */

const Framebus = jest.fn();

Framebus.emit = jest.fn();
Framebus.on = jest.fn();
Framebus.off = jest.fn();
Framebus.teardown = jest.fn();
Framebus.target = jest.fn().mockImplementation(() => Framebus);

// Instance proxy: delegates every property access to the current value on Framebus.
// This means if a test installs jest.spyOn(bus, 'emit'), source-code instances
// automatically use that spy.
const instanceProxy = new Proxy(
  {},
  {
    get(_t, prop) {
      return Framebus[prop];
    },
    set(_t, prop, value) {
      Framebus[prop] = value;
      return true;
    },
  },
);

Framebus.mockImplementation(() => instanceProxy);

// Make module.exports the Framebus class itself so that:
//   const bus = require('framebus')  →  bus.emit works (CJS tests)
//   import bus from 'framebus'       →  bus === Framebus (ES module interop via __esModule)
Framebus.default = Framebus;
Framebus.__esModule = true;

module.exports = Framebus;
