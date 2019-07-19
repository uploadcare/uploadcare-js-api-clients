import * as FormData from 'form-data'

/**
 * Constructs FormData instance from object
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */
import {Body} from './types'
import defaultSettings from '../../defaultSettings'

export function buildFormData(body: Body): FormData | Body {
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
      const file = body.file as File
      const fileName = file.name || defaultSettings.fileName

      formData.append('file', value, fileName)
    }
    else {
      formData.append(key, value)
    }
  }

  return formData
}
