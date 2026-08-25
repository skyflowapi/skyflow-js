/*
Copyright (c) 2024 Skyflow, Inc.
*/
// Prototype-pollution-safe wrapper around lodash/merge. The collect/update
// request assembly deep-merges caller-influenced objects (additionalFields) with
// collected element data; a `__proto__` / `constructor` / `prototype` key in a
// source could otherwise reach Object.prototype during the recursive merge.
// We strip those keys from every source, then delegate to lodash/merge so the
// merge semantics (deep merge, in-place mutation of `target`, array handling)
// stay identical to the previous direct `merge(target, source)` calls for all
// legitimate inputs. `target` is mutated and returned exactly as lodash does.
import merge from 'lodash/merge';

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

// Returns a copy of `value` with dangerous keys removed at every depth. Arrays,
// nested objects and primitive values are otherwise preserved as-is so the
// downstream merge produces the same result it did before.
const sanitize = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    Object.keys(value).forEach((key) => {
      if (FORBIDDEN_KEYS.has(key)) return;
      result[key] = sanitize(value[key]);
    });
    return result;
  }
  return value;
};

export const safeMerge = <T>(target: T, ...sources: any[]): T => merge(
  target,
  ...sources.map((source) => sanitize(source)),
);

export default safeMerge;
