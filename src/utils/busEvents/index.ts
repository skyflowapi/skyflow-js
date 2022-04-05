import bus from 'framebus';
import { applyFormatRegex, fetchRecordsByTokenId, formatRecordsForIframe } from '../../core-utils/reveal';
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_ELEMENT } from '../../core/constants';
import properties from '../../properties';
import { formatFrameNameToId } from '../helpers';
import logs from '../logs';
import { validateInitConfigInConnections } from '../validators';

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

export function getRevealElementValue(key, revealFrameName, client) {
  return new Promise((resolve, reject) => {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_REVEAL_ELEMENT,
      { name: revealFrameName },
      (revealElement: any) => {
        if (revealElement.value) {
          resolve({ key, value: revealElement.value });
        } else {
          try {
            validateInitConfigInConnections(client.config);
            const detokenizeRecords = fetchRecordsByTokenId([{ token: revealElement.token }],
              client);
            detokenizeRecords.then(
              (resolvedResult) => {
                let formattedResult = formatRecordsForIframe(resolvedResult);
                formattedResult = applyFormatRegex(formattedResult, [{ ...revealElement }]);
                resolve({ key, value: formattedResult[revealElement.token] });
              },
              (rejectedResult) => {
                reject({
                  code: 500,
                  description: 'Detokenization failed',
                  errors: rejectedResult.errors,
                });
              },
            );
          } catch (err) {
            reject(err);
          }
        }
      });
  });
}

export function getAccessToken(clientId) {
  return new Promise((resolve, reject) => {
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
    bus.target(properties.IFRAME_SECURE_ORGIN)
      .emit(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, {
        name: frameName,
        options: {
          value,
        },
        isSingleElementAPI: true,
      });
  }
}
