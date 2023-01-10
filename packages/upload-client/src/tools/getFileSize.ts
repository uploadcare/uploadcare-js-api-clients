import { SupportedFileInput } from '../types'
import { getBlobFromReactNativeAsset } from './getBlobFromReactNativeAsset'
import { isBlob, isBuffer, isFile, isReactNativeAsset } from './isFileData'

export const getFileSize = async (file: SupportedFileInput) => {
  if (isBuffer(file)) {
    return file.length
  }
  if (isFile(file) || isBlob(file)) {
    return file.size
  }
  if (isReactNativeAsset(file)) {
    const blob = await getBlobFromReactNativeAsset(file)
    return blob.size
  }
  throw new Error(`Unknown file type. Cannot determine file size.`)
}
