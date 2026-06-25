import { FileInfo, GroupFileInfo } from '../api/types'
import { resolveCdnBase } from './resolveCdnBase'
import { UploadcareFile } from './UploadcareFile'

/**
 * Build an {@link UploadcareFile}, resolving the (prefixed-by-default) CDN base
 * from `publicKey` before construction. See {@link resolveCdnBase}.
 */
export const toUploadcareFile = async (
  fileInfo: FileInfo | GroupFileInfo,
  {
    publicKey,
    baseCDN,
    prefixedBaseCDN,
    fileName
  }: {
    publicKey: string
    baseCDN?: string
    prefixedBaseCDN?: string
    fileName?: string
  }
): Promise<UploadcareFile> => {
  const resolvedBaseCDN = await resolveCdnBase({
    publicKey,
    baseCDN,
    prefixedBaseCDN
  })

  return new UploadcareFile(fileInfo, { baseCDN: resolvedBaseCDN, fileName })
}
