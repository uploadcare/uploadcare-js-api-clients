/**
 * A SHA-256 digest as a 256-bit bigint, read as four big-endian 64-bit words —
 * no intermediate hex string. Shared by every WebCrypto-backed encoder, which
 * differ only in where `crypto.subtle` is reached: the global one in a browser,
 * `node:crypto`'s `webcrypto` on a server.
 */
export const bigintFromSha256Digest = (digest: ArrayBuffer): bigint => {
  const view = new DataView(digest)
  let out = 0n
  for (let i = 0; i < digest.byteLength; i += 8) {
    out = (out << 64n) | view.getBigUint64(i)
  }
  return out
}
