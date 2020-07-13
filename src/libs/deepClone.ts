export default function deepClone(json: Object): any {
  return JSON.parse(JSON.stringify(json));
}
