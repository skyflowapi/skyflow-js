import RevealElement from '../container/external/reveal/RevealElement';
import Element from '../container/external/element';
import { FRAME_ELEMENT, FRAME_REVEAL } from '../container/constants';
import { flattenObject } from '../utils/helpers';
import { getCollectElementValue, getRevealElementValue } from '../utils/busEvents';
import SkyflowError from './SkyflowError';
import SKYFLOW_ERROR_CODE from '../utils/constants';

const set = require('set-value');

export function gatewayConfigParser(data, configKey) {
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof RevealElement) {
      if (!value.isMounted()) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED);
      }
      data[key] = value.iframeName();
      if (configKey !== 'responseBody') {
        if (!value.hasToken()) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENT_MUST_HAVE_TOKEN);
        }
      }
    } else if (value instanceof Element) {
      if (!value.isMounted()) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED);
      }
      data[key] = value.iframeName();
    } else if (value instanceof Object) {
      gatewayConfigParser(value, configKey);
    }
  });
}

export function constructInvokeGatewayRequest(data) {
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
