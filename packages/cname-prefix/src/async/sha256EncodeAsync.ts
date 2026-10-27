import { bigintFromSha256Digest } from '../common/bigintFromSha256Digest'

/**
 * SHA-256 of a UTF-8 string, as a 256-bit bigint, via WebCrypto.
 *
 * Reads `crypto` off the global scope rather than off `window`, so this also
 * works inside a Web Worker or a Service Worker, where `window` does not
 * exist.
 */
export const sha256EncodeAsync = async (data: string): Promise<bigint> =>
  bigintFromSha256Digest(
    await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(data)
    )
  )
