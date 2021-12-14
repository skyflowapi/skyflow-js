import CollectElement from '../core/external/collect/CollectElement';
import { FRAME_ELEMENT, FRAME_REVEAL } from '../core/constants';
import { flattenObject, formatFrameNameToId } from '../utils/helpers';
import { getCollectElementValue, getRevealElementValue } from '../utils/busEvents';
import SkyflowError from './SkyflowError';
import SKYFLOW_ERROR_CODE from '../utils/constants';
import { getElementName } from '../utils/logsHelper';
import RevealElement from '../core/external/reveal/RevealElement';

const set = require('set-value');

export function connectionConfigParser(data, configKey) {
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof RevealElement) {
      if (!value.isMounted()) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED_INVOKE_CONNECTION,
          [getElementName(formatFrameNameToId(value.iframeName()))]);
      }
      data[key] = value.iframeName();
      if (configKey !== 'responseBody') {
        if (!value.hasToken()) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENT_MUST_HAVE_TOKEN);
        }
      }
    } else if (value instanceof CollectElement) {
      if (!value.isMounted()) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED_INVOKE_CONNECTION,
          [getElementName(formatFrameNameToId(value.iframeName()))]);
      }
      data[key] = value.iframeName();
    } else if (value instanceof Object) {
      connectionConfigParser(value, configKey);
    }
  });
}

export function constructInvokeConnectionRequest(data) {
  const flattenData = flattenObject(data);
  const collectElements = {};
  const revealElements = {};

  Object.entries(flattenData).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const isCollectElement = value.startsWith(`${FRAME_ELEMENT}:`);
      const isRevealElememt = value.startsWith(`${FRAME_REVEAL}:`);
      if (isCollectElement) {
        collectElements[key] = value;
      }
      if (isRevealElememt) {
        revealElements[key] = value;
      }
    }
  });

  const promiseList : any = [];

  Object.entries(collectElements).forEach(([key, value]) => {
    promiseList.push(getCollectElementValue(key, value));
  });
  Object.entries(revealElements).forEach(([key, value]) => {
    promiseList.push(getRevealElementValue(key, value));
  });

  return Promise.all(promiseList).then((res) => {
    res.forEach((element:any) => {
      set(data, element.key, element.value);
    });
    return data;
  }).catch((err) => {
    throw err;
  });
}
