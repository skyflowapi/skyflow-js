import { FORMAT_REGEX, FRAME_REVEAL } from '../../core/constants';
import SkyflowElement from '../../core/external/common/SkyflowElement';
import SkyflowError from '../../libs/SkyflowError';

export const flattenObject = (obj, roots = [] as any, sep = '.') => Object.keys(obj).reduce((memo, prop: any) => ({ ...memo, ...(Object.prototype.toString.call(obj[prop]) === '[object Object]' ? flattenObject(obj[prop], roots.concat([prop])) : { [roots.concat([prop]).join(sep)]: obj[prop] }) }), {});

export function deletePropertyPath(obj, path) {
  if (!obj || !path) {
    return;
  }

  if (typeof path === 'string') {
    path = path.split('.');
  }

  for (let i = 0; i < path.length - 1; i += 1) {
    obj = obj[path[i]];

    if (typeof obj === 'undefined') {
      return;
    }
  }

  delete obj[path.pop()];
}

export function clearEmpties(o) {
  const keys = Object.keys(o);

  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    if (!o[k] || typeof o[k] !== 'object') {
      // eslint-disable-next-line no-continue
      continue;
    }

    clearEmpties(o[k]);
    if (Object.keys(o[k]).length === 0) {
      delete o[k];
    }
  }
}

export function formatFrameNameToId(name: string) {
  const arr = name.split(':');
  if (arr.length > 2) {
    arr.pop();
    arr.pop();
    return arr.join(':');
  }
  return '';
}

export function fillUrlWithPathAndQueryParams(url:string,
  pathParams?:object,
  queryParams?:object) {
  let filledUrl = url;
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      filledUrl = url.replace(`{${key}}`, value);
    });
  }
  if (queryParams) {
    filledUrl += '?';
    Object.entries(queryParams).forEach(([key, value]) => {
      filledUrl += `${key}=${value}&`;
    });
    filledUrl = filledUrl.substring(0, filledUrl.length - 1);
  }
  return filledUrl;
}

export function removeSpaces(inputString:string) {
  return inputString.trim().replace(/[\s]/g, '');
}

export function formatVaultURL(vaultURL) {
  if (typeof vaultURL !== 'string') return vaultURL;
  return (vaultURL?.trim().slice(-1) === '/') ? vaultURL.slice(0, -1) : vaultURL.trim();
}

export function checkIfDuplicateExists(arr) {
  return new Set(arr).size !== arr.length;
}

export function replaceIdInXml(xml: string, elementLookup: any, errors: any) {
  const elementids : any = [];
  const result = xml.replace(/<skyflow>([\s\S]*?)<\/skyflow>/gi, (match, key) => {
    const id = key.trim();
    elementids.push(id);
    const element: SkyflowElement = elementLookup[id];
    return `<skyflow>${element?.iframeName()}</skyflow>`;
  });
  if (errors.length > 2 && checkIfDuplicateExists(elementids)) {
    throw new SkyflowError(errors[2], [], true);
  }
  for (let i = 0; i < elementids.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(elementLookup, elementids[i])) {
      throw new SkyflowError(errors[0], [`${elementids[i]}`], true);
    }
    if (!elementLookup[elementids[i]].isMounted()) {
      throw new SkyflowError(errors[1], [`${elementids[i]}`], true);
    }
  }
  return result;
}

export function replaceIdInResponseXml(xml: string, elementLookup: any, errors: any) {
  const elementids : any = [];
  const result = xml.replace(/<skyflow>([\s\S]*?)<\/skyflow>/gi, (match, key) => {
    const id = key.trim();
    elementids.push(id);
    const element: SkyflowElement = elementLookup[id];
    let tempName = element?.iframeName();
    if (tempName?.startsWith(`${FRAME_REVEAL}:`)) {
      // @ts-ignore
      const regex = element?.getFormatRegex();
      if (regex) {
        tempName = tempName + FORMAT_REGEX + regex;
      }
    }

    return `<skyflow>${tempName}</skyflow>`;
  });
  if (errors.length > 2 && checkIfDuplicateExists(elementids)) {
    throw new SkyflowError(errors[2], [], true);
  }
  for (let i = 0; i < elementids.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(elementLookup, elementids[i])) {
      throw new SkyflowError(errors[0], [`${elementids[i]}`], true);
    }
    if (!elementLookup[elementids[i]].isMounted()) {
      throw new SkyflowError(errors[1], [`${elementids[i]}`], true);
    }
  }
  return result;
}

export function getIframeNamesInSoapRequest(requestXml: string) {
  const elementNames = requestXml.match(/<skyflow>([\s\S]*?)<\/skyflow>/gi);
  return elementNames?.map((element) => element.replace('<skyflow>', '').replace('</skyflow>', ''));
}

export function replaceIframeNameWithValues(requestXml: string, elementValuesLookup) {
  const result = requestXml.replace(/<skyflow>([\s\S]*?)<\/skyflow>/gi, (match, key) => {
    const name = key.trim();
    return elementValuesLookup[name];
  });

  return result;
}
