/**
 * Safely get json value.
 * @param {object} json
 * @param {string} value
 */
const find = (json: object, value: string): object =>
  (Object.prototype.hasOwnProperty.apply(json, [value]) && json[value]) || {}

export default find
