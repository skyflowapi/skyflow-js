import { MeticsObjectType, SharedMeticsObjectType } from '../utils/common';
import sdkDetails from '../../package.json';
import { getMetaObject } from '../utils/helpers';

export const METRIC_OBJECT: SharedMeticsObjectType = { records: [] };

export function setBearerToken(metadata: any) {
    metadata?.clientJSON?.config?.getBearerToken?.().then((authToken: string) => {
      METRIC_OBJECT.bearerToken = authToken;
    }).catch((err: any) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  }
  
  export function initalizeMetricObject(metadata: any, elementId: string) {
    setBearerToken(metadata);
    const metaDataObject = getMetaObject(sdkDetails, metadata, navigator);
    const elementMetricObject = {
      element_id: elementId,
      element_type: [],
      div_id: '',
      container_id: metadata?.uuid || '',
      session_id: metadata?.session_id || '',
      vault_id: metadata?.clientJSON?.config?.vaultID || '',
      vault_url: metadata?.clientJSON?.config?.vaultURL || '',
      events: [],
      created_at: Date.now(),
      region: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: 'INITIALIZED',
      sdk_name_version: metaDataObject.sdk_name_version,
      sdk_client_device_model: metaDataObject.sdk_client_device_model,
      sdk_client_os_details: metaDataObject.sdk_os_version,
      sdk_runtime_details: metaDataObject.sdk_runtime_details,
    };
    METRIC_OBJECT.records.push(
      elementMetricObject,
    );
  }
  
  export function updateMetricObjectValue(id: string, key: string, value: any) {
    METRIC_OBJECT.records.forEach((event) => {
      if (event.element_id === id) {
        if (key === 'events' || key === 'element_type') {
          event[key].push(value);
        } else if (key === 'mount_end_time' && event.mount_start_time) {
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
      status = 'FAILED';
    } else if (metricEvent.events.filter((element) => element.includes('MOUNTED')).length > 0) {
      status = 'SUCCESS';
    } else if (metricEvent.events.length > 0) {
      status = 'PARTIAL_RENDER';
    }
    return status;
  }
  
  export function pushEventToMixpanel(elementId: string) {
    const metricEvent = METRIC_OBJECT.records.filter((event) => event.element_id === elementId)[0];
    metricEvent.status = getEventStatus(metricEvent);
    const vaultURL = metricEvent.vault_url;
    let eventPushed = false;
    const event = {
      event: metricEvent.container_id,
      properties: {
        ...metricEvent,
        time: Math.floor(Date.now() / 1000),
        distinct_id: metricEvent.container_id,
      },
    };
  
    if (METRIC_OBJECT.bearerToken) {
      fetch(`${vaultURL}/sdk/sdk-metrics`, {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${METRIC_OBJECT.bearerToken}`,
        },
      })
        .then((response: any) => {
          eventPushed = response.data && (response.data >= 1);
        })
        .catch((error) => {
          eventPushed = error || eventPushed;
        });
    }
  }
  
  export function pushElementEventWithTimeout(elementID: string) {
    setTimeout(() => {
      pushEventToMixpanel(elementID);
    }, 20000);
  }
