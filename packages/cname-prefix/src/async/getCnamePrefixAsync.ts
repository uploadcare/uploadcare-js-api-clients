import { base36Encode } from '../common/base36Encode'
import { sha256EncodeAsync } from './sha256EncodeAsync'

const CNAME_PREFIX_LEN = 10

export const getCnamePrefixAsync = async (publicKey: string) => {
  const sha256HexInt = await sha256EncodeAsync(publicKey)
  const base36 = base36Encode(sha256HexInt)
  return base36.slice(0, CNAME_PREFIX_LEN)
}
