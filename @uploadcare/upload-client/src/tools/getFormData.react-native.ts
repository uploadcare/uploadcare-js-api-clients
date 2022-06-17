import { BrowserFile, NodeFile } from '../request/types'
import {
  FileTransformer,
  GetFormDataFileAppendOptions,
  ReactNativeAsset
} from './types'

export const getFileOptions: GetFormDataFileAppendOptions = ({ name }) =>
  name ? [name] : []

export const transformFile: FileTransformer = (
  file: BrowserFile | NodeFile,
  name?: string
): ReactNativeAsset => {
  if (!file) {
    return file
  }
  const uri = URL.createObjectURL(file as BrowserFile)
  const type = (file as BrowserFile).type
  return { uri, name, type }
}

export default (): FormData => new FormData()
