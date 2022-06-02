import NodeFormData from 'form-data'
import { FileTransformer, GetFormDataFileAppendOptions } from './types'
import { identity } from './identity'

// node form-data has another append signature
// see docs at https://www.npmjs.com/package/formdata-node
export const getFileOptions: GetFormDataFileAppendOptions = ({
  name,
  contentType
}) =>
  [
    Object.entries({
      filename: name,
      contentType
    })
      .filter(([, value]) => !!value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  ].filter((value) => !!value)

export const transformFile: FileTransformer = identity
export default (): NodeFormData | FormData => new NodeFormData()
