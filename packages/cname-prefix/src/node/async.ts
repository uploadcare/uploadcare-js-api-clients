const unavailable = (name: string): Promise<never> =>
  Promise.reject(
    new TypeError(
      `${name} is available in browsers only, where WebCrypto is the only digest available without bundling one. ` +
        'In Node the synchronous API is already native — use getPrefixedCdnBaseSync.'
    )
  )

/**
 * Not available in Node — see the error message. Present so that a caller who
 * imports it gets an explanation instead of a `ReferenceError` about `window`.
 */
export const getCnamePrefixAsync = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature parity with the browser build
  publicKey: string
): Promise<string> => unavailable('getCnamePrefixAsync')

/** Not available in Node — see {@link getCnamePrefixAsync}. */
export const getPrefixedCdnBaseAsync = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature parity with the browser build
  publicKey: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature parity with the browser build
  cdnBase: string
): Promise<string> => unavailable('getPrefixedCdnBaseAsync')

export { isPrefixedCdnBase } from '../common/isPrefixedCdnBase'
