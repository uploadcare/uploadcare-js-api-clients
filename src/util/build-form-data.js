/* @flow */
import FormData from 'form-data'
import {Body} from '../flow-typed'

const DEFAULT_FILE_NAME = 'original'

/**
 * Constructs FormData instance from object
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */
export default function buildFormData(body: Body): FormData {
  const formData = new FormData()

  for (let key of Object.keys(body)) {
    let value = body[key]

    if (typeof value === 'boolean') {
      value = value ? '1' : '0'
    }

    if (Array.isArray(value)) {
      value.forEach(val => formData.append(key + '[]', val))
    }
    else if (key === 'file') {
      formData.append('file', value, body['file_name'] || DEFAULT_FILE_NAME)
    }
    else {
      formData.append(key, value)
    }
  }

  return formData
}
