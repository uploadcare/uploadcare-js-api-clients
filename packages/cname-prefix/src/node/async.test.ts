import { describe, expect, it } from 'vitest'

import { getCnamePrefixAsync, getPrefixedCdnBaseAsync } from './async'

/**
 * The async API is the browser's: it exists because WebCrypto is the only
 * digest a browser offers without shipping an implementation. In Node the sync
 * API is already native, so reaching for the async one means a caller has the
 * environments mixed up — say so, instead of failing later with a
 * `ReferenceError` about `window`.
 */
describe('node build: the async API is not available', () => {
  it('rejects with an explanation naming the sync alternative', async () => {
    await expect(
      getPrefixedCdnBaseAsync('demopublickey', 'https://ucarecd.net')
    ).rejects.toThrow(/getPrefixedCdnBaseSync/)
  })

  it('rejects rather than throwing synchronously, so callers can catch it', async () => {
    const promise = getCnamePrefixAsync('demopublickey')
    expect(promise).toBeInstanceOf(Promise)
    await expect(promise).rejects.toThrow(TypeError)
  })
})
