/**
 * SHA-256 of a UTF-8 string, as a 256-bit bigint, via WebCrypto.
 *
 * Reads `crypto` off the global scope rather than off `window`, so this also
 * works inside a Web Worker or a Service Worker, where `window` does not exist.
 * The digest bytes become a bigint through four 64-bit reads — no hex string in
 * between.
 */
export const sha256EncodeAsync = async (data: string): Promise<bigint> => {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(data)
  )
  const view = new DataView(digest)
  let out = 0n
  for (let i = 0; i < digest.byteLength; i += 8) {
    out = (out << 64n) | view.getBigUint64(i)
  }
  return out
}
