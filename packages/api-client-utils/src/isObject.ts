export function isObject(o?: unknown): o is Record<string, unknown> {
  return Object.prototype.toString.call(o) === '[object Object]'
}
