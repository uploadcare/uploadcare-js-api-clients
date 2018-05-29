/* @flow */
export type Options = {
  publicKey: string,
  store?: boolean,
  fileName?: string,
}
/**
 * Uploading files from URL.
 * @param {string} sourceUrl Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Options} options Set of options.
 * @returns {Promise}
 */
export const fromUrl = (sourceUrl: string, options: Options) => (new Promise())
