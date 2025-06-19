import { base36Encode } from './base36Encode'
import { sha256Encode } from './sha256Encode'

const CNAME_PREFIX_LEN = 10

export const getCnamePrefix = async (publicKey: string) => {
  const sha256HexInt = await sha256Encode(publicKey)
  const base36 = base36Encode(sha256HexInt)
  return base36.slice(0, CNAME_PREFIX_LEN)
}
