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

function formatFrameNameToId(name: string) {
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
      console.log(state);
      if (!state.isValid) {
        reject('Invalid Field');
      }
      resolve(state.value);
    });
  });
}

export function collectObjectParse(data, promiseList) {
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
