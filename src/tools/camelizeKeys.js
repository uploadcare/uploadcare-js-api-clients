/* @flow */

export function camelize(str: string): string {
  return (str.split('_'))
    .map((substr, index) => index > 0 ? substr.toUpperCase() : substr)
    .join('')
}

export default function camelizeKeys(source: any): any {
  if (typeof source !== 'object') {
    return source
  }

  return Object.keys(source)
    .reduce((accumulator, key) => {
      accumulator[camelize(key)] = typeof source[key] === 'object' ? camelizeKeys(source[key]) : source[key]

      return accumulator
    }, {})
}
