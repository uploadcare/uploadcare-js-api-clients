import { base36Encode } from '../common/base36Encode'
import { sha256EncodeSync } from './sha256EncodeSync'

const CNAME_PREFIX_LEN = 10

export const getCnamePrefixSync = (publicKey: string) => {
  const sha256HexInt = sha256EncodeSync(publicKey)
  const base36 = base36Encode(sha256HexInt)
  return base36.slice(0, CNAME_PREFIX_LEN)
}
