/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT } from '@core/constants';
import properties from '@core/properties';

export function getAccessToken(clientId: string) {
  return new Promise((resolve, reject) => {
    // The bearer-token channel is namespaced per Skyflow instance by `clientId`
    // (the parent's uuid) so concurrent SDK instances on one page don't clash.
    // The listener lives on `GET_BEARER_TOKEN + uuid` (base-skyflow); there is no
    // un-namespaced listener, so only this suffixed emit is dispatched.
    bus
      // .target(properties.IFRAME_SECURE_ORIGIN)
      .emit(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN + clientId, {},
        (data:any) => {
          if (data?.error) {
            reject(data.error);
          }
          resolve(data.authToken);
        });
  });
}

export function updateElementState(frameName: string, value: any) {
  if (frameName.startsWith(`${FRAME_ELEMENT}:`)) {
    bus.target(properties.IFRAME_SECURE_ORIGIN).emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE
      + frameName, {
      name: frameName,
      options: {
        value,
      },
      isSingleElementAPI: true,
    });
  }
}
