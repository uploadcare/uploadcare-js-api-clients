import getFormData, { transformFile } from './getFormData.node'

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

type FileType = {
  data: BrowserFile | NodeFile
  name?: string
}

type InputValue = FileType | SimpleType | ObjectType

type FormDataOptions = {
  [key: string]: InputValue
}

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
  params: Array<[string, string | BrowserFile | NodeFile, string?]>,
  inputKey: string,
  inputValue: InputValue
): void {
  if (isFileValue(inputValue)) {
    const name = inputValue.name
    const file = transformFile(inputValue.data, name) as Blob // lgtm [js/superfluous-trailing-arguments]
    params.push(name ? [inputKey, file, name] : [inputKey, file])
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

export function getFormDataParams(
  options: FormDataOptions
): Array<[string, string | BrowserFile, string?]> {
  const params: Array<[string, string | BrowserFile, string?]> = []
  for (const [key, value] of Object.entries(options)) {
    collectParams(params, key, value)
  }
  return params
}

function buildFormData(options: FormDataOptions): FormData | NodeFormData {
  const formData = getFormData()

  const params = getFormDataParams(options)
  for (const param of params) {
    formData.append(...param)
  }

  return formData
}

export default buildFormData
