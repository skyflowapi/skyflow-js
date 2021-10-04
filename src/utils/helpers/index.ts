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
  if (arr.length > 1) {
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
