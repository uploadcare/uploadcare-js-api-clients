import { addPrefixToCdnBase } from '../common/addPrefixToCdnBase'
import { getCnamePrefixSync } from './getCnamePrefixSync'

export const getPrefixedCdnBaseSync = (publicKey: string, cdnBase: string) => {
  const prefix = getCnamePrefixSync(publicKey)
  return addPrefixToCdnBase(prefix, cdnBase)
}
