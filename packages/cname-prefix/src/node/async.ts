/**
 * Not available in Node. Present so that a caller who imports it gets an
 * explanation instead of a `ReferenceError` about `window`: the async API
 * exists because WebCrypto is the only digest a browser offers without shipping
 * an implementation, and Node does not have that problem.
 *
 * It rejects rather than throwing synchronously, so the failure arrives where a
 * caller of an async function is already looking for it.
 */
export const getPrefixedCdnBaseAsync = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature parity with the browser build
  publicKey: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature parity with the browser build
  cdnBase: string
): Promise<string> =>
  Promise.reject(
    new TypeError(
      'getPrefixedCdnBaseAsync is available in browsers only, where WebCrypto is the only digest available without bundling one. ' +
        'In Node the synchronous API is already native — use getPrefixedCdnBaseSync.'
    )
  )

export { isPrefixedCdnBase } from '../common/isPrefixedCdnBase'
