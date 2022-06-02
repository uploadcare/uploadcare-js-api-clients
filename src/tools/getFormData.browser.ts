import { FileTransformer, GetFormDataFileAppendOptions } from './types'
import { identity } from './identity'

export const getFileOptions: GetFormDataFileAppendOptions = ({ name }) =>
  name ? [name] : []
export const transformFile: FileTransformer = identity
export default (): FormData => new FormData()
