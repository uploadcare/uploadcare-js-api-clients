import { cnamePrefix } from '../common/cnamePrefix'
import { sha256EncodeAsync } from './sha256EncodeAsync'

export const getCnamePrefixAsync = async (publicKey: string): Promise<string> =>
  cnamePrefix(await sha256EncodeAsync(publicKey))
