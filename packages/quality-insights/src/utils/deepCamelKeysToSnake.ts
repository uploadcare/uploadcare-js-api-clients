function camelToSnake(str: string): string {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/__/g, '_')
}

export function deepCamelKeysToSnake<T extends object>(
  obj: T
): { [k: string]: unknown } {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? deepCamelKeysToSnake(item)
        : item
    ) as unknown as { [k: string]: unknown }
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj as unknown as { [k: string]: unknown }
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const snakeKey = camelToSnake(key)
      if (typeof value === 'object' && value !== null) {
        return [snakeKey, deepCamelKeysToSnake(value)]
      }
      return [snakeKey, value]
    })
  )
}
