import { BrowserFile, NodeFile } from '../types'
import {
  FileTransformer,
  GetFormDataFileAppendOptions,
  ReactNativeAsset
} from './types'

export const getFileOptions: GetFormDataFileAppendOptions = () => []

export const transformFile: FileTransformer = (
  file: BrowserFile | NodeFile,
  name: string,
  contentType: string
): ReactNativeAsset => {
  const uri = URL.createObjectURL(file as BrowserFile)
  return { uri, name, type: contentType }
}

export default (): FormData => new FormData()
