import { webcrypto } from 'node:crypto'

import { bigintFromSha256Digest } from '../common/bigintFromSha256Digest'

/**
 * SHA-256 of a UTF-8 string, as a 256-bit bigint, via WebCrypto — the same
 * digest the browser build uses, taken from `node:crypto`'s `webcrypto` rather
 * than off the global scope. That keeps the async API working on every Node the
 * package supports (`webcrypto` has been present since Node 16.15, no flag),
 * not only on the versions where `globalThis.crypto` happens to be exposed.
 *
 * `node:crypto` is a runtime import the bundler leaves external, so nothing is
 * added to the bundle; this file is what the `node` condition of the async
 * entry resolves to.
 */
export const sha256EncodeAsync = async (data: string): Promise<bigint> =>
  bigintFromSha256Digest(
    await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  )
