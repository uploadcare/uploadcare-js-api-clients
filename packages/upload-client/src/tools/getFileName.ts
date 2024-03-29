import { defaultFilename } from '../defaultSettings'
import { SupportedFileInput } from '../types'
import { isBlob, isBuffer, isFile, isReactNativeAsset } from './isFileData'

export const getFileName = (file: SupportedFileInput): string => {
  let filename = ''

  if (isFile(file) && file.name) {
    filename = file.name
  } else if (isBlob(file) || isBuffer(file)) {
    filename = ''
  } else if (isReactNativeAsset(file) && file.name) {
    filename = file.name
  }

  return filename || defaultFilename
}
