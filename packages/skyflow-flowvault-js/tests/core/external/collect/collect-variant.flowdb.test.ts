/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB collectVariant adapter: remaps the client-facing skyflowId/tableName
// onto the internal skyflowID/table that the SET_VALUE handler consumes, and
// declares the id key it carries.
import collectVariant from '../../../../src/external/collect/collect-variant';

describe('flowDB collectVariant', () => {
  test('exposes skyflowIdKey as "skyflowId"', () => {
    expect(collectVariant.skyflowIdKey).toBe('skyflowId');
  });

  describe('normalizeUpdateOptions', () => {
    test('remaps both skyflowId -> skyflowID and tableName -> table', () => {
      const options: any = { skyflowId: 'id1', tableName: 'cards', foo: 'bar' };
      collectVariant.normalizeUpdateOptions(options);
      expect(options).toEqual({ skyflowID: 'id1', table: 'cards', foo: 'bar' });
      expect(options).not.toHaveProperty('skyflowId');
      expect(options).not.toHaveProperty('tableName');
    });

    test('remaps only skyflowId when tableName is absent', () => {
      const options: any = { skyflowId: 'id1' };
      collectVariant.normalizeUpdateOptions(options);
      expect(options).toEqual({ skyflowID: 'id1' });
    });

    test('remaps only tableName when skyflowId is absent', () => {
      const options: any = { tableName: 'cards' };
      collectVariant.normalizeUpdateOptions(options);
      expect(options).toEqual({ table: 'cards' });
    });

    test('is a no-op when neither key is present', () => {
      const options: any = { returnMockValue: true };
      collectVariant.normalizeUpdateOptions(options);
      expect(options).toEqual({ returnMockValue: true });
    });

    test('ignores inherited (non-own) skyflowId/tableName properties', () => {
      const options: any = Object.create({ skyflowId: 'inherited', tableName: 'inherited' });
      collectVariant.normalizeUpdateOptions(options);
      expect(options).not.toHaveProperty('skyflowID');
      expect(options).not.toHaveProperty('table');
    });
  });
});
