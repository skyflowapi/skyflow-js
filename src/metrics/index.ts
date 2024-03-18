import bus from 'framebus';
import { MeticsObjectType, SharedMeticsObjectType } from '../utils/common';
import sdkDetails from '../../package.json';
import { getMetaObject } from '../utils/helpers';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  EVENT_TYPES,
  METRIC_TYPES,
} from '../core/constants';

export const METRIC_OBJECT: SharedMeticsObjectType = { records: [] };

export function initalizeMetricObject(metadata: any, elementId: string) {
  const metaDataObject = getMetaObject(sdkDetails, metadata, navigator);
  const elementMetricObject = {
    element_id: elementId,
    element_type: [],
    div_id: '',
    container_name: '',
    container_id: metadata?.uuid || '',
    session_id: metadata?.session_id || '',
    vault_id: metadata?.clientJSON?.config?.vaultID || '',
    vault_url: metadata?.clientJSON?.config?.vaultURL || '',
    events: [],
    created_at: Date.now(),
    region: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || '',
    status: METRIC_TYPES.STATUS.INITIALIZED,
    sdk_name_version: metaDataObject.sdk_name_version,
    sdk_client_device_model: metaDataObject.sdk_client_device_model || '',
    sdk_client_os_details: metaDataObject.sdk_os_version || '',
    sdk_runtime_details: metaDataObject.sdk_runtime_details || '',
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

export function pushEventToMixpanel(elementId: string) {
  const filteredEvent = METRIC_OBJECT.records.filter((event) => event.element_id === elementId);
  if (filteredEvent && filteredEvent[0]) {
    const metricEvent = filteredEvent[0];
    metricEvent.status = getEventStatus(metricEvent);
    const event = {
      ...metricEvent,
      time: Math.floor(Date.now() / 1000),
    };
    if (metricEvent.vault_id !== '' && metricEvent.vault_url !== '') {
      bus
        .emit(ELEMENT_EVENTS_TO_IFRAME.PUSH_EVENT + metricEvent.container_id, {
          event,
        });
    }
  }
}

export function pushElementEventWithTimeout(elementID: string) {
  setTimeout(() => {
    pushEventToMixpanel(elementID);
  }, 20000);
}
