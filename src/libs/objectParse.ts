/* eslint-disable no-underscore-dangle */
import _ from 'lodash';
import CollectElement from '../core/external/collect/CollectElement';
import { FRAME_ELEMENT, FRAME_REVEAL, PATH_NOT_FOUND_IN_RES_XML } from '../core/constants';
import {
  flattenObject, formatFrameNameToId, getIframeNamesInSoapRequest, replaceIframeNameWithValues,
} from '../utils/helpers';
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

export function constructSoapConnectionRequestXml(requestXml: string) {
  const promiseList : any = [];
  const names = getIframeNamesInSoapRequest(requestXml);
  names?.forEach((iframeName) => {
    if (iframeName.startsWith(`${FRAME_ELEMENT}:`)) {
      promiseList.push(getCollectElementValue(iframeName, iframeName));
    } else if (iframeName.startsWith(`${FRAME_REVEAL}:`)) {
      promiseList.push(getRevealElementValue(iframeName, iframeName));
    }
  });

  return Promise.all(promiseList).then((values) => {
    const elementNameValues = Object.assign({}, ...values.map((o: any) => ({ [o.key]: o.value })));
    const xml = replaceIframeNameWithValues(requestXml, elementNameValues);
    return xml;
  });
}

export function extractSkyflowTagsFromResponseBody(responseBody: any,
  path: string,
  skyflowTags: any,
  connectionResponse: any) {
  Object.entries<any>(responseBody).forEach(([key, value]) => {
    if (key.match(/skyflow/i)) {
      if (skyflowTags.fields) {
        skyflowTags.fields.push({
          key: path,
          value: value._text,
        });
      } else {
        skyflowTags[path] = value._text;
      }
    } else if (Array.isArray(value)) {
      const tempPath = `${path}.${key}`;
      skyflowTags[tempPath] = [];
      value.forEach((obj, index) => {
        skyflowTags[tempPath][index] = {
          identifiers: [],
          fields: [],
        };
        extractSkyflowTagsFromResponseBody(obj, '', skyflowTags[tempPath][index], connectionResponse);
      });
    } else if (value instanceof Object) {
      const dot = path ? '.' : '';
      const tempPath = path + dot + key;
      if (Array.isArray(_.get(connectionResponse, path))) {
        if (!Array.isArray(skyflowTags[path])) {
          skyflowTags[path] = [];
          skyflowTags[path][0] = {
            identifiers: [],
            fields: [],
          };
        }
        extractSkyflowTagsFromResponseBody(value, key, skyflowTags[path][0], connectionResponse);
      } else {
        extractSkyflowTagsFromResponseBody(value, tempPath, skyflowTags, connectionResponse);
      }
    } else if (key === '_text') {
      if (skyflowTags.identifiers) {
        skyflowTags.identifiers.push({
          key: path,
          value,
        });
      } else {
        // unknown value {value} found
        // can be error
        skyflowTags[path] = value;
      }
    }
  });
}

function arraySearchHelper(response, path, identifiers) {
  if (identifiers.length === 0) {
    return undefined;
  }
  const responseArray = _.get(response, path);
  for (let i = 0; i < responseArray.length; i += 1) {
    const responseArrayItem = responseArray[i];

    let matched = true;
    for (let j = 0; j < identifiers.length; j += 1) {
      if (_.get(responseArrayItem, identifiers[j].key)?._text !== identifiers[j].value) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return i;
    }
  }

  return undefined;
}

function renderOnUI(iframeName: string, iframeValue: string) {
  const elementIFrame = window.parent.frames[iframeName as string];
  if (elementIFrame) {
    if (iframeName.startsWith(`${FRAME_ELEMENT}:`)) {
      const elementId = formatFrameNameToId(iframeName);
      const collectInputElement = elementIFrame
        .document.getElementById(elementId) as HTMLInputElement;
      if (collectInputElement) {
        collectInputElement.value = iframeValue;
      }
    } else if (iframeName.startsWith(`${FRAME_REVEAL}:`)) {
      const revealSpanElement = elementIFrame
        .document.getElementById(iframeName) as HTMLSpanElement;
      if (revealSpanElement) {
        revealSpanElement.innerText = iframeValue;
      }
    }
  }
}

// renders on ui and removes it from response
export function soapResponseBodyParser(mainTags, connectionResponse: any) {
  Object.entries(mainTags).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((each) => {
        const arrayIndex = arraySearchHelper(connectionResponse, key, each.identifiers);
        if (arrayIndex === undefined) {
          throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_PATH_IN_ARRAY_RES_XML,
            [key], true);
        }
        each.fields.forEach((secureFields) => {
          const iframeName = secureFields.value;
          const iframeValue = _.get(
            connectionResponse,
            `${key}.${arrayIndex}.${secureFields.key}`, PATH_NOT_FOUND_IN_RES_XML,
          );
          if (iframeValue === PATH_NOT_FOUND_IN_RES_XML) {
            throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_PATH_IN_RES_XML,
              [`${key}.${arrayIndex}.${secureFields.key}`], true);
          }
          renderOnUI(iframeName, iframeValue?._text);
          _.unset(connectionResponse, `${key}.${arrayIndex}.${secureFields.key}`);
        });

        _.unset(each, 'fields');
        _.unset(each, 'identifiers');
        soapResponseBodyParser(each, _.get(connectionResponse, `${key}.${arrayIndex}`));
      });
    } else {
      const iframeName: any = value;
      const iframeValue = _.get(connectionResponse, key, PATH_NOT_FOUND_IN_RES_XML);
      if (iframeValue === PATH_NOT_FOUND_IN_RES_XML) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_PATH_IN_RES_XML,
          [key], true);
      }
      renderOnUI(iframeName, iframeValue?._text);
      _.unset(connectionResponse, key);
    }
  });
}
