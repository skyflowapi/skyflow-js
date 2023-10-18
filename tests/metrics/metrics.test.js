import {
  updateMetricObjectValue,
  pushEventToMixpanel,
  pushElementEventWithTimeout,
  initalizeMetricObject,
  getEventStatus,
  METRIC_OBJECT,
  setBearerToken
} from '../../src/metrics/index';

describe('metric object test', () => {
  describe('METRIC_OBJECT', () => {
    it('should be an object', () => {
      expect(METRIC_OBJECT).toBeInstanceOf(Object);
    });

    it('should have a "records" property of type array', () => {
      expect(METRIC_OBJECT.records).toBeInstanceOf(Array);
    });

    it('should have a "bearerToken" property that is optional', () => {
      expect(METRIC_OBJECT.bearerToken).toBeUndefined();
    });

    it('should have a "records" property of type MeticsObjectType array', () => {
      expect(METRIC_OBJECT.records).toBeInstanceOf(Array);
      METRIC_OBJECT.records.forEach((record) => {
        expect(record).toBeInstanceOf(Object);
        expect(record).toHaveProperty('element_id');
        expect(record).toHaveProperty('element_type');
        expect(record).toHaveProperty('div_id');
        expect(record).toHaveProperty('container_id');
        expect(record).toHaveProperty('session_id');
        expect(record).toHaveProperty('vault_id');
        expect(record).toHaveProperty('vault_url');
        expect(record).toHaveProperty('events');
        expect(record).toHaveProperty('created_at');
        expect(record).toHaveProperty('region');
        expect(record).toHaveProperty('status');
        expect(record).toHaveProperty('sdk_name_version');
        expect(record).toHaveProperty('sdk_client_device_model');
        expect(record).toHaveProperty('sdk_client_os_details');
        expect(record).toHaveProperty('sdk_runtime_details');
      });
    });
  });
  describe('setBearerToken', () => {
    const METRIC_OBJECT = {
      records: [],
      bearerToken: undefined,
    };
    it('should set the bearer token if available', () => {
      const authToken = 'MockToken';
      const getBearerTokenMock = jest.fn().mockResolvedValue(authToken);
      const metadata = {
        clientJSON: { config: { getBearerToken: getBearerTokenMock } }
      };
      setBearerToken(metadata);
      expect(getBearerTokenMock).toHaveBeenCalled();
    });

    it('should handle errors when getting the bearer token', () => {
      const metadata = {
        clientJSON: { config: { getBearerToken: jest.fn().mockRejectedValue('Error') } }
      };
      setBearerToken(metadata);
      expect(METRIC_OBJECT.bearerToken).toBeUndefined();
    });
  });

  describe('initalizeMetricObject', () => {
    it('should initialize the METRIC_OBJECT.records with the correct properties', () => {
      const metadata = {
        clientJSON: {
          config: {
            vaultID: 'VaultIDMock',
            vaultURL: 'VaultURLMock',
          },
        },
        uuid: 'UUIDMock',
        session_id: 'SessionIDMock',
      };
      const elementId = 'ElementIDMock';

      initalizeMetricObject(metadata, elementId);
      expect(METRIC_OBJECT.records.length).toBe(1);
    });
  });
  describe('updateMetricObjectValue', () => {
    it('should update a property of a specific record', () => {
      const elementId = 'ElementIDMock';
      METRIC_OBJECT.records.push({ element_id: elementId, events: [], mount_start_time: 0 });
      updateMetricObjectValue(elementId, 'events', 'Event1');

      expect(METRIC_OBJECT.records[0].events).toContain('Event1');
    });

    it('should update latency when updating mount_end_time', () => {
      const elementId = 'ElementIDMock';
      METRIC_OBJECT.records.push({ element_id: elementId, events: [], mount_start_time: 0 });
      updateMetricObjectValue(elementId, 'mount_start_time', 500);
      updateMetricObjectValue(elementId, 'mount_end_time', 1000);
      updateMetricObjectValue(elementId, 'latency', 1000);
      expect(METRIC_OBJECT.records[0].mount_end_time).toBe(1000);
      expect(METRIC_OBJECT.records[0].latency).toBe(1000);
    });
  });

  describe('getEventStatus', () => {
    it('should return "FAILED" if events array is empty', () => {
      const metricEvent = { events: [], error: 'ErrorMock' };
      const status = getEventStatus(metricEvent);

      expect(status).toBe('FAILED');
    });

    it('should return "SUCCESS" if "MOUNTED" event is present', () => {
      const metricEvent = { events: ['MOUNTED'], error: null };
      const status = getEventStatus(metricEvent);

      expect(status).toBe('SUCCESS');
    });

    it('should return "PARTIAL_RENDER" if events are present but no "MOUNTED" event', () => {
      const metricEvent = { events: ['RENDER'], error: null };
      const status = getEventStatus(metricEvent);

      expect(status).toBe('PARTIAL_RENDER');
    });
  });

  describe('pushEventToMixpanel', () => {


    // Mock the fetch function
    global.fetch = jest.fn(() => Promise.resolve({ data: 1 }));

    it('should push an event to Mixpanel if bearer token is available', async () => {
      METRIC_OBJECT.bearerToken = 'BearerTokenMock';
      METRIC_OBJECT.records.push({ element_id: 'ElementIDMock', vault_url: 'VaultURLMock', events: ["MOUNTED"] });

      const elementId = 'ElementIDMock';
      await pushEventToMixpanel(elementId);

      expect(fetch).toHaveBeenCalledWith('VaultURLMock/sdk/sdk-metrics', {
        method: 'POST',
        body: expect.any(String),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer BearerTokenMock',
        },
      });
    });

    it('should push an event to Mixpanel after a timeout', () => {
      const setTimeoutMock = jest.fn();

      global.setTimeout = setTimeoutMock;
      pushElementEventWithTimeout('ElementIDMock');

      expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 20000);
    });

    it('should call pushEventToMixpanel after the timeout', () => {
      const setTimeoutMock = jest.fn();

      global.setTimeout = setTimeoutMock;
      pushElementEventWithTimeout('ElementIDMock');

      jest.advanceTimersByTime(20000);
    });
  });
});