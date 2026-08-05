import { sha256 } from './sha256'

/**
 * SHA-256 of a UTF-8 string, as a 256-bit bigint, which is the form the prefix
 * is derived from. The digest words come from {@link sha256}, the portable
 * implementation this build carries; the Node build reads them from
 * `node:crypto` instead.
 */
export function sha256EncodeSync(message: string): bigint {
  let digest = 0n
  for (const word of sha256(message)) digest = (digest << 32n) | BigInt(word)
  return digest
}
