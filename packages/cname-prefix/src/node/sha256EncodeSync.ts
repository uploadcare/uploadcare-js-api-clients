import { createHash } from 'node:crypto'

/**
 * SHA-256 of a UTF-8 string, as a 256-bit bigint — Node's native OpenSSL-backed
 * digest, which is synchronous, so no JavaScript implementation is needed here.
 * Roughly 3× faster than the portable one and, more to the point, absent from
 * the bundle: this file is what the `node` export condition resolves to.
 */
export const sha256EncodeSync = (message: string): bigint =>
  BigInt(`0x${createHash('sha256').update(message, 'utf8').digest('hex')}`)
