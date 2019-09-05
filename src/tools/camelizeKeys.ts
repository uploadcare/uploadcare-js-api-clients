const SEPARATOR = /\W|_/g

/**
 * Transforms a string to camelCased.
 *
 * @param {string} text - Text to camelize.
 * @returns {string}
 */
export function camelize(text: string): string {
  return (text.split(SEPARATOR))
    .map((word, index) => word.charAt(0)[index > 0 ? 'toUpperCase' : 'toLowerCase']() + word.slice(1))
    .join('')
}

/**
 * Transforms keys of an object to camelCased recursively.
 *
 * @param {object} source - Object to camelize.
 * @returns {object}
 */
export default function camelizeKeys(source: object): object {
  if (!source || typeof source !== 'object') {
    return source
  }

  return Object.keys(source)
    .reduce((accumulator, key) => {
      accumulator[camelize(key)] = typeof source[key] === 'object' ? camelizeKeys(source[key]) : source[key]

      return accumulator
    }, {})
}
