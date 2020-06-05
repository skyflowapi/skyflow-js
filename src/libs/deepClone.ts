export default function deepClone(json: Object): Object {
  return JSON.parse(JSON.stringify(json));
}
