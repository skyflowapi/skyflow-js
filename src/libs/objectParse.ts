import bus from 'framebus';
import RevealElement from '../container/external/reveal/RevealElement';
import Element from '../container/external/element';
import { FRAME_ELEMENT } from '../container/constants';

export function containerObjectParse(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof RevealElement) {
      data[key] = value.token;
    } else if (value instanceof Element) {
      data[key] = value.iframeName;
    } else if (value instanceof Object) {
      containerObjectParse(value);
    }
  });
}

export function formatFrameNameToId(name: string) {
  const arr = name.split(':');
  if (arr.length > 1) {
    arr.pop();
    return arr.join(':');
  }
  return '';
}

function processIframeElement(elementIframename) {
  // const elementIFrame = window.parent.frames[elementIframename];
  // if (elementIFrame) {
  //   const id = formatFrameNameToId(elementIframename);
  //   const elementInput = elementIFrame.document.getElementById(id) as HTMLInputElement;
  //   if (elementInput) return elementInput.value;
  //   return elementIframename;
  // }
  // return elementIframename;
  // let elementState;
  return new Promise((resolve, reject) => {
    bus.emit('test', { name: formatFrameNameToId(elementIframename) }, (state:any) => {
      // console.log(state);
      if (!state.isValid) {
        reject('Invalid Field');
      }
      resolve(state.value);
    });
  });
}

export function collectObjectParse(data, promiseList) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const isCollectElement = value.startsWith(`${FRAME_ELEMENT}:`);
      if (isCollectElement) {
        promiseList.push(processIframeElement(value));
      }
    }
    if (value instanceof Object) {
      collectObjectParse(value, promiseList);
    }
  });
}

export function responseBodyObjectParse(responseBody:object) {
  Object.entries(responseBody).forEach(([key, value]) => {
    if (value instanceof RevealElement) {
      responseBody[key] = value.iframeName;
    } else if (value instanceof Element) {
      // TODO
    } else if (value instanceof Object) {
      responseBodyObjectParse(value);
    }
  });
}

export function fillUrlWithPathAndQueryParams(gatewayUrl:string,
  pathParams?:object,
  queryParams?:object) {
  let filledGatewayUrl = gatewayUrl;
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      filledGatewayUrl = gatewayUrl.replace(`{${key}}`, value);
    });
  }
  if (queryParams) {
    // TODO
  }
  return filledGatewayUrl;
}

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
