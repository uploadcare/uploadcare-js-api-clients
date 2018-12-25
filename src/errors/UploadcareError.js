/* @flow */

export default class UploadcareError extends Error {
  constructor(message, code) {
    super(message)

    this.name = 'UploadcareError'
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UploadcareError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
