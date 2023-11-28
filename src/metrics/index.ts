import bus from 'framebus';
import { MeticsObjectType, SharedMeticsObjectType } from '../utils/common';
import sdkDetails from '../../package.json';
import { getMetaObject } from '../utils/helpers';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_TYPES,
  EVENT_TYPES,
  METRIC_TYPES,
} from '../core/constants';

export const METRIC_OBJECT: SharedMeticsObjectType = { records: [] };

export function initalizeMetricObject(names: any) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const element_id = `${names[1]}-${names[3]}`;
  const element = names[1] === 'GROUP' ? ELEMENT_TYPES.COMPOSABLE : ELEMENT_TYPES.COLLECT;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const elementMetricObject = {
    element_id,
    element,
    element_type: [],
    div_id: '',
    container_id: names[3] || '',
    session_id: '',
    vault_id: '',
    vault_url: '',
    events: [],
    created_at: Date.now(),
    region: Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: METRIC_TYPES.STATUS.INITIALIZED,
    sdk_name_version: '',
    sdk_client_device_model: '',
    sdk_client_os_details: '',
    sdk_runtime_details: '',
  };
  METRIC_OBJECT.records.push(
    elementMetricObject,
  );
}

export function updateMetricObjectValue(id: string, key: string, value: any) {
  METRIC_OBJECT.records.forEach((event) => {
    if (event.element_id === id) {
      if (key === METRIC_TYPES.EVENTS_KEY || key === METRIC_TYPES.ELEMENT_TYPE_KEY) {
        event[key].push(value);
      } else if (key === METRIC_TYPES.MOUNT_END_TIME && event.mount_start_time) {
        event[key] = value;
        event.latency = value - event.mount_start_time;
      } else if (key === METRIC_TYPES.SDK_METRICS) {
        const metaObject = getMetaObject(sdkDetails, value, navigator);
        event.sdk_name_version = metaObject.sdk_name_version;
        event.sdk_client_device_model = metaObject.sdk_client_device_model;
        event.sdk_client_os_details = metaObject.sdk_os_version;
        event.sdk_runtime_details = metaObject.sdk_runtime_details;
        event.session_id = value.uuid;
      } else {
        event[key] = value;
      }
    }
  });
}

export function getEventStatus(metricEvent: MeticsObjectType): string {
  let status = metricEvent.status;
  if (metricEvent.events.length === 0 || metricEvent.error) {
    status = METRIC_TYPES.STATUS.FAILED;
  } else if (metricEvent.events.filter((event) => event.includes(EVENT_TYPES.MOUNTED)).length > 0) {
    status = METRIC_TYPES.STATUS.SUCCESS;
  } else if (metricEvent.events.length > 0) {
    status = METRIC_TYPES.STATUS.PARTIAL_RENDER;
  }
  return status;
}

export function pushEvent(elementId: string) {
  const metricEvent = METRIC_OBJECT.records.filter((event) => event.element_id === elementId)[0];
  metricEvent.status = getEventStatus(metricEvent);
  const event = {
    ...metricEvent,
    time: Math.floor(Date.now() / 1000),
  };
  bus
    .emit(ELEMENT_EVENTS_TO_IFRAME.PUSH_EVENT, {
      event,
    });
}

export function pushEventWithTimeout(elementID: string) {
  setTimeout(() => {
    pushEvent(elementID);
  }, 20000);
}
