import METRIC_OBJECT from '../../../metrics';
import { getMetaObject, pushEventToMixpanel } from '../../../utils/helpers';
import sdkDetails from '../../../../package.json';
/*
Copyright (c) 2022 Skyflow, Inc.
*/
abstract class SkyflowElement {
  abstract mount(domElementSelector);

  abstract unmount();

  abstract setError(clientErrorText:string);

  abstract resetError();

  abstract iframeName();

  abstract getID();

  setBearerToken(metadata: any) {
    metadata.clientJSON.config
      .getBearerToken().then((authToken: string) => {
        METRIC_OBJECT.bearerToken = authToken;
      }).catch((err: any) => {
      });
  }

  initalizeMetricObject(metadata: any, elementId: string) {
    this.setBearerToken(metadata);
    const metaDataObject = getMetaObject(sdkDetails, metadata, navigator);
    const elementMetricObject = {
      element_id: elementId,
      element_type: [],
      div_id: '',
      container_id: metadata.uuid,
      session_id: metadata.session_id,
      vault_id: metadata.clientJSON.config.vaultID,
      vault_url: metadata.clientJSON.config.vaultURL,
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

  updateMetricObjectValue(id: string, key: string, value: any) {
    METRIC_OBJECT.records.forEach(event => {
      if (event.element_id === id) {
        if (key === 'events' || key === 'element_type') {
          event[key].push(value);
        } else if (key === 'mount_end_time' && event.mount_start_time) {
          event[key] = value;
          event['latency'] = value - event.mount_start_time;
        } else {
          event[key] = value;
        }
      }
    });
  }

  pushElementEventWithTimeout(elementID: string) {
    setTimeout(() => {
      pushEventToMixpanel(elementID)
    }, 20000);
  }
}

export default SkyflowElement;
