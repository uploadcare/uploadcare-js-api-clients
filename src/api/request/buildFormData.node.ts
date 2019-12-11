import * as FormData from "form-data"

/**
 * Constructs FormData instance from object.
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env.
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */

type FileTyple = ["file", Blob | File | NodeJS.ReadableStream | Buffer, string]
type BaseType = string | number | void
type FormDataTyple = [string, BaseType | BaseType[]]

function getFormData(body: (FormDataTyple | FileTyple)[]): FormData {
  const formData = new FormData()

  for (const [key, value, name] of body) {
    if (Array.isArray(value)) {
      // refactor this
      value.forEach(val => formData.append(key + "[]", val))
    } else if (value != null) {
      formData.append(key, value, name)
    }
  }

  return formData
}

export default getFormData
