/**
 * Check that environment is Node.js.
 *
 * @return {boolean}
 */
export const isNode = (): boolean => {
  try {
    return Object.prototype.toString.call(global.process) === '[object process]'
  }
  catch (e) {
    return false
  }
}
