import { isObject } from './isObject'

const SEPARATOR = /\W|_/g

export type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>

export type CamelCaseKeys<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Record<string, unknown>
    ? CamelCaseKeys<T[K]>
    : T[K]
}

export type KebabCase<
  T extends string,
  A extends string = ''
> = T extends `${infer F}${infer R}`
  ? KebabCase<R, `${A}${F extends Lowercase<F> ? '' : '-'}${Lowercase<F>}`>
  : A

export type KebabKeys<T> = {
  [K in keyof T as K extends string ? KebabCase<K> : K]: T[K]
}

export function camelize<T extends string>(text: T): T {
  return text
    .split(SEPARATOR)
    .map(
      (word, index) =>
        word.charAt(0)[index > 0 ? 'toUpperCase' : 'toLowerCase']() +
        word.slice(1)
    )
    .join('') as T
}

export function camelizeObject<T extends Record<string, T | unknown>>(
  source: T
): CamelCaseKeys<T> {
  const result = {}
  for (const key of Object.keys(source)) {
    let value = source[key]
    if (isObject(value)) {
      value = camelizeObject(value as T)
    } else if (Array.isArray(value)) {
      value = value.map((item) =>
        isObject(item) ? camelizeObject(item) : item
      )
    }
    result[camelize(key)] = value
  }
  return result as CamelCaseKeys<T>
}
