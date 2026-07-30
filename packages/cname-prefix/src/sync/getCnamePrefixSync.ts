import { cnamePrefix } from '../common/cnamePrefix'
import { sha256EncodeSync } from './sha256EncodeSync'

export const getCnamePrefixSync = (publicKey: string): string =>
  cnamePrefix(sha256EncodeSync(publicKey))
