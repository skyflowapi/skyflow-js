/*
Copyright (c) 2022 Skyflow, Inc.
*/
export default function deepClone(json: Object): any {
  return JSON.parse(JSON.stringify(json));
}
