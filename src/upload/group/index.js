/* @flow */
export type UUID = string
export type CDNUrl = string
export type Options = {
  publicKey?: string,
}

/**
 * Making a group.
 * @param {Array} files Array, where each parameter can be a file UUID or a CDN URL,
 * with or without applied Media Processing operations.
 * @param {Object} options Set of options.
 * @returns {Promise}
 */
const group = (files: Array<UUID> | Array<CDNUrl>, options: Options) => (new Promise())

export default group
