import { safeMerge } from "@core/utils/safe-merge";

// Clean up any accidental prototype pollution so a failure here cannot leak
// into unrelated tests.
afterEach(() => {
  delete (Object.prototype as any).polluted;
});

describe("safeMerge — behaviour preservation (matches lodash/merge)", () => {
  test("deep-merges nested objects", () => {
    const target: any = { a: { x: 1 }, b: 2 };
    const result = safeMerge(target, { a: { y: 3 }, c: 4 });
    expect(result).toEqual({ a: { x: 1, y: 3 }, b: 2, c: 4 });
  });

  test("mutates and returns the same target reference (in-place)", () => {
    const target: any = { a: 1 };
    const result = safeMerge(target, { b: 2 });
    expect(result).toBe(target);
    expect(target).toEqual({ a: 1, b: 2 });
  });

  test("preserves arrays", () => {
    const target: any = { list: [1, 2] };
    const result = safeMerge(target, { list: [9] });
    // lodash merges arrays index-wise; safeMerge delegates to it unchanged.
    expect(result).toEqual({ list: [9, 2] });
  });

  test("handles null / undefined / primitive sources without throwing", () => {
    const target: any = { a: 1 };
    expect(safeMerge(target, null)).toEqual({ a: 1 });
    expect(safeMerge(target, undefined)).toEqual({ a: 1 });
  });

  test("supports multiple sources", () => {
    const target: any = {};
    const result = safeMerge(target, { a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });
});

describe("safeMerge — prototype-pollution guard", () => {
  test("does not pollute Object.prototype via an own __proto__ key", () => {
    // JSON.parse creates `__proto__` as an OWN enumerable key (the realistic
    // attacker vector); an object literal would set the prototype instead.
    const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}}');
    const target: any = {};
    safeMerge(target, malicious);

    expect(({} as any).polluted).toBeUndefined();
    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  test("does not pollute via constructor.prototype path", () => {
    const malicious = JSON.parse(
      '{"constructor": {"prototype": {"polluted": "yes"}}}'
    );
    const target: any = {};
    safeMerge(target, malicious);

    expect(({} as any).polluted).toBeUndefined();
  });

  test("does not pollute via a nested __proto__ key", () => {
    const malicious = JSON.parse('{"a": {"__proto__": {"polluted": "yes"}}}');
    const target: any = {};
    safeMerge(target, malicious);

    expect(({} as any).polluted).toBeUndefined();
  });

  test("still merges legitimate keys while dropping forbidden ones", () => {
    const malicious = JSON.parse(
      '{"safeCol": "value", "__proto__": {"polluted": "yes"}}'
    );
    const target: any = { existing: 1 };
    const result = safeMerge(target, malicious);

    expect(result).toEqual({ existing: 1, safeCol: "value" });
    expect(({} as any).polluted).toBeUndefined();
  });
});
