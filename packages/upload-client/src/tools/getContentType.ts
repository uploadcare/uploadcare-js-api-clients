import { defaultContentType } from '../defaultSettings'
import { SupportedFileInput } from '../types'
import { isBlob, isFile, isReactNativeAsset } from './isFileData'

export const getContentType = (file: SupportedFileInput): string => {
  let contentType = ''
  if (isBlob(file) || isFile(file) || isReactNativeAsset(file)) {
    contentType = file.type
  }
  if (contentType) {
    return contentType
  }
  console.warn(
    `Cannot determine content type. Using default content type: ${defaultContentType}`,
    file
  )
  return defaultContentType
}
