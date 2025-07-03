/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT } from '../../core/constants';
import properties from '../../properties';

export function getAccessToken(clientId) {
  return new Promise((resolve, reject) => {
    window.parent.postMessage({
      type: ELEMENT_EVENTS_TO_IFRAME.GET_ACCESS_TOKEN,
      data: {
      },
    }, '*');
    window.addEventListener('message', (event) => {
      if (event.data && event.data.data
         && event.data.type === ELEMENT_EVENTS_TO_IFRAME.GET_ACCESS_TOKEN_BACK) {
        if (event.data.data.error) {
          reject(event.data.data.error);
        } else if (event.data.data.authToken) {
          resolve(event.data.data.authToken);
        } else {
          reject(new Error('No auth token received'));
        }
      }
    });
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN + clientId, {},
      (data:any) => {
        if (data?.error) {
          reject(data.error);
        }
        resolve(data.authToken);
      });

    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN, {},
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
