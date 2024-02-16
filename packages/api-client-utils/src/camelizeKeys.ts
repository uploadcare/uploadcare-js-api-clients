import { isObject } from './isObject'

const SEPARATOR = /\W|_/g

export function camelizeString<T extends string>(text: T): T {
  return text
    .split(SEPARATOR)
    .map(
      (word, index) =>
        word.charAt(0)[index > 0 ? 'toUpperCase' : 'toLowerCase']() +
        word.slice(1)
    )
    .join('') as T
}

type CamelizeKeysOptions = {
  ignoreKeys: string[]
}

export function camelizeArrayItems(
  array: unknown[],
  { ignoreKeys }: CamelizeKeysOptions = { ignoreKeys: [] }
): unknown[] {
  if (!Array.isArray(array)) {
    return array
  }
  return array.map((item) => camelizeKeys(item, { ignoreKeys }))
}

export function camelizeKeys<T>(
  source: Record<string, unknown> | T,
  { ignoreKeys }: CamelizeKeysOptions = { ignoreKeys: [] }
): Record<string, unknown> | T {
  if (Array.isArray(source)) {
    return camelizeArrayItems(source, { ignoreKeys }) as unknown as T
  }
  if (!isObject(source)) {
    return source
  }
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source)) {
    let value = source[key]
    if (ignoreKeys.includes(key)) {
      result[key] = value
      continue
    }
    if (isObject(value)) {
      value = camelizeKeys(value, { ignoreKeys })
    } else if (Array.isArray(value)) {
      value = camelizeArrayItems(value, { ignoreKeys })
    }
    result[camelizeString(key)] = value
  }
  return result
}
