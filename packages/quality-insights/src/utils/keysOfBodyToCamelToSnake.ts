function camelToSnake(str: string): string {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/__/g, '_')
}

export function keysOfBodyToCamelToSnake<T extends object>(
  obj: T
): { [k: string]: unknown } {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const snakeKey = camelToSnake(key)
      return [snakeKey, value]
    })
  )
}
