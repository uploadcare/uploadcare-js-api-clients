import getFormData, { getFileOptions, transformFile } from './getFormData.node'

import NodeFormData from 'form-data'
import { BrowserFile, NodeFile } from '../request/types'
import { isFileData } from '../uploadFile/types'

/**
 * Constructs FormData instance.
 * Uses 'form-data' package in node or native FormData
 * in browsers.
 */

type KeyValue<T> = { [key: string]: T }

type SimpleType = string | number | undefined
type ObjectType = KeyValue<SimpleType>

interface FileOptions {
  name: string
  contentType: string
}

interface FileType extends FileOptions {
  data: BrowserFile | NodeFile
}

type InputValue = FileType | SimpleType | ObjectType

type FormDataOptions = {
  [key: string]: InputValue
}

type Params = Array<
  [
    string,
    string | BrowserFile | NodeFile,
    ...(string | { [key: string]: string | undefined })[]
  ]
>

const isSimpleValue = (value: InputValue): value is SimpleType => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'undefined'
  )
}

const isObjectValue = (value: InputValue): value is ObjectType => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const isFileValue = (value: InputValue): value is FileType =>
  !!value &&
  typeof value === 'object' &&
  'data' in value &&
  isFileData((value as FileType).data)

function collectParams(
  params: Params,
  inputKey: string,
  inputValue: InputValue
): void {
  if (isFileValue(inputValue)) {
    const { name, contentType }: FileOptions = inputValue
    const file = transformFile(inputValue.data, name, contentType) as Blob // lgtm [js/superfluous-trailing-arguments]
    const options = getFileOptions({ name, contentType })
    params.push([inputKey, file, ...options])
  } else if (isObjectValue(inputValue)) {
    for (const [key, value] of Object.entries(inputValue)) {
      if (typeof value !== 'undefined') {
        params.push([`${inputKey}[${key}]`, String(value)])
      }
    }
  } else if (isSimpleValue(inputValue) && inputValue) {
    params.push([inputKey, inputValue.toString()])
  }
}

export function getFormDataParams(options: FormDataOptions): Params {
  const params: Params = []
  for (const [key, value] of Object.entries(options)) {
    collectParams(params, key, value)
  }
  return params
}

function buildFormData(options: FormDataOptions): FormData | NodeFormData {
  const formData = getFormData()

  const paramsList = getFormDataParams(options)
  for (const params of paramsList) {
    const [key, value, ...rest] = params
    // node form-data has another signature for append
    formData.append(key, value as Blob, ...(rest as [string]))
  }

  return formData
}

export default buildFormData
