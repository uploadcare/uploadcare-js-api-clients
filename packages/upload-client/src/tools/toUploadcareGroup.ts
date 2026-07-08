import { GroupInfo } from '../api/types'
import { resolveCdnBase } from './resolveCdnBase'
import { UploadcareGroup } from './UploadcareGroup'

/**
 * Build an {@link UploadcareGroup}, resolving the (prefixed-by-default) CDN base
 * from `publicKey` before construction. See {@link resolveCdnBase}.
 */
export const toUploadcareGroup = async (
  groupInfo: GroupInfo,
  {
    publicKey,
    baseCDN,
    prefixedBaseCDN
  }: {
    publicKey: string
    baseCDN?: string
    prefixedBaseCDN?: string
  }
): Promise<UploadcareGroup> => {
  const resolvedBaseCDN = await resolveCdnBase({
    publicKey,
    baseCDN,
    prefixedBaseCDN
  })

  return new UploadcareGroup(groupInfo, { baseCDN: resolvedBaseCDN })
}
