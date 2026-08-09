import {
  updateMetricObjectValue,
  pushEvent,
  pushElementEventWithTimeout,
  initalizeMetricObject,
  getEventStatus,
  METRIC_OBJECT,
} from '../../src/metrics/index';

describe('metric object test', () => {
  describe('METRIC_OBJECT', () => {
    it('should be an object', () => {
      expect(METRIC_OBJECT).toBeInstanceOf(Object);
    });

    it('should have a "records" property of type array', () => {
      expect(METRIC_OBJECT.records).toBeInstanceOf(Array);
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

  describe('pushEvent', () => {


    // Mock the fetch function
    global.fetch = jest.fn(() => Promise.resolve({ data: 1 }));

    it('should push an event to Mixpanel', async () => {
      METRIC_OBJECT.records.push({ element_id: 'ElementIDMock', vault_url: 'VaultURLMock', events: ["MOUNTED"] });

      const elementId = 'ElementIDMock';
      await pushEvent(elementId);
      expect(pushEvent).toBeTruthy();
    });

    it('should push the event to Mixpanel after a timeout', () => {
      jest.useFakeTimers();
      METRIC_OBJECT.records = [
        {
          element_id: 'element123',
          container_id: 'container456',
          vault_url: 'http://example.com',
          status: "Error",
          events: ["MOUNTED"]
        },
      ];
      global.fetch = jest.fn(() =>
        Promise.resolve({
          data: 1, 
        })
      );
      pushElementEventWithTimeout('element123');
      jest.runAllTimers()
      expect(METRIC_OBJECT).toBeTruthy();
    });
  });
});