import getFormData, { transformFile } from './getFormData.node'

import * as NodeFormData from 'form-data'
import { BrowserFile, NodeFile } from '../request/types'

/**
 * Constructs FormData instance from array.
 * Uses 'form-data' package in node or native FormData
 * in browsers.
 */

type FileTriple = ['file', BrowserFile | NodeFile, string]
type BaseType = string | number | void
type FormDataTuple = [string, BaseType | BaseType[]]

const isFileTriple = (tuple: FormDataTuple | FileTriple): tuple is FileTriple =>
  tuple[0] === 'file'

function buildFormData(
  body: (FormDataTuple | FileTriple)[]
): FormData | NodeFormData {
  const formData = getFormData()

  for (const tuple of body) {
    if (Array.isArray(tuple[1])) {
      // refactor this
      tuple[1].forEach(val => val && formData.append(tuple[0] + '[]', `${val}`))
    } else if (isFileTriple(tuple)) {
      const name = tuple[2]
      const file = transformFile(tuple[1], name) as Blob
      formData.append(tuple[0], file, name)
    } else if (tuple[1] != null) {
      formData.append(tuple[0], `${tuple[1]}`)
    }
  }

  return formData
}

export default buildFormData
