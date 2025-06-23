import { addPrefixToCdnBase } from './addPrefixToCdnBase'
import { getCnamePrefix } from './getCnamePrefix'

export const getPrefixedCdnBase = async (
  publicKey: string,
  cdnBase: string
) => {
  const prefix = await getCnamePrefix(publicKey)
  return addPrefixToCdnBase(prefix, cdnBase)
}
