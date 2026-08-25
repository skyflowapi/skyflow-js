/*
Copyright (c) 2022 Skyflow, Inc.
*/
/* eslint-disable no-bitwise */
export default function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = ((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}
