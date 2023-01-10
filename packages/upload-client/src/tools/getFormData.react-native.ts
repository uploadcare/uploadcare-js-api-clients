import { SupportedFileInput, ReactNativeAsset } from '../types'
import { isBlob, isReactNativeAsset } from './isFileData'
import { FileTransformer, GetFormDataFileAppendOptions } from './types'

export const getFileOptions: GetFormDataFileAppendOptions = () => []

export const transformFile: FileTransformer = (
  file: SupportedFileInput,
  name: string,
  contentType: string
): ReactNativeAsset => {
  if (isReactNativeAsset(file)) {
    return {
      uri: file.uri,
      name: file.name || name,
      type: file.type || contentType
    }
  }
  if (isBlob(file)) {
    const uri = URL.createObjectURL(file)
    return { uri, name: name, type: file.type || contentType }
  }
  throw new Error(`Unsupported file type.`)
}

export default (): FormData => new FormData()
