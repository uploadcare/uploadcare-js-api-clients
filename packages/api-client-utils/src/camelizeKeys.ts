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

type SnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head>
      ? `${Head}${SnakeCase<Tail>}` // digit or other non-letter — kept as-is
      : `_${Lowercase<Head>}${SnakeCase<Tail>}` // uppercase letter — prefix an underscore
    : `${Head}${SnakeCase<Tail>}` // lowercase letter
  : S

/**
 * Type-level inverse of {@link camelizeKeys}: recursively rewrite an object's
 * camelCase keys to snake_case. Lets a raw API frame be described as the
 * snake_case form of a camelCase type such as `FileInfo`.
 */
export type SnakeCasedPropertiesDeep<T> = T extends readonly (infer U)[]
  ? SnakeCasedPropertiesDeep<U>[]
  : T extends object
    ? {
        [K in keyof T as K extends string
          ? SnakeCase<K>
          : K]: SnakeCasedPropertiesDeep<T[K]>
      }
    : T

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

/**
 * Recursively rewrite an object's snake_case keys to camelCase.
 *
 * The result is whatever the caller says it is: pass the camelCase type it
 * produces (`camelizeKeys<FileInfo>(raw)`) instead of casting the return value.
 * Defaults to a plain record, so existing untyped calls keep compiling.
 * Non-objects pass through untouched.
 */
export function camelizeKeys<T = Record<string, unknown>>(
  source: unknown,
  { ignoreKeys }: CamelizeKeysOptions = { ignoreKeys: [] }
): T {
  if (Array.isArray(source)) {
    return camelizeArrayItems(source, { ignoreKeys }) as T
  }
  if (!isObject(source)) {
    return source as T
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
  return result as T
}
