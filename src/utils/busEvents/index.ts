import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME } from '../../container/constants';
import { formatFrameNameToId } from '../helpers';
import logs from '../logs';

export function getCollectElementValue(key, elementIframename) {
  return new Promise((resolve, reject) => {
    bus
      .emit(ELEMENT_EVENTS_TO_IFRAME.GET_COLLECT_ELEMENT,
        { name: formatFrameNameToId(elementIframename) },
        (state:any) => {
          if (!state.isValid) {
            reject(logs.errorLogs.INVALID_FIELD);
          }
          resolve({
            key,
            value: state.value,
          });
        });
  });
}

export function getRevealElementValue(key, revealFrameName) {
  return new Promise((resolve) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_REVEAL_ELEMENT,
      { name: revealFrameName },
      (revealElementValue) => {
        resolve({ key, value: revealElementValue });
      });
  });
}

export function getAccessToken() {
  return new Promise((resolve, reject) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN, {},
      (data:any) => {
        if (data?.error) {
          reject(data.error);
        }
        resolve(data.authToken);
      });
  });
}
