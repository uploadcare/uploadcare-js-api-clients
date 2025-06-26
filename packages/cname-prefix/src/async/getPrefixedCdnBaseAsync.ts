import { addPrefixToCdnBase } from '../common/addPrefixToCdnBase'
import { getCnamePrefixAsync } from './getCnamePrefixAsync'

export const getPrefixedCdnBaseAsync = async (
  publicKey: string,
  cdnBase: string
) => {
  const prefix = await getCnamePrefixAsync(publicKey)
  return addPrefixToCdnBase(prefix, cdnBase)
}
