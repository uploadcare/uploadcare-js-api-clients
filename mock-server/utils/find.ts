/**
 * Safely get json value.
 *
 * @param {object} json
 * @param {string} value
 */
const find = (json: object, value: string): object =>
  json.hasOwnProperty(value) && json[value] || {}

export default find
