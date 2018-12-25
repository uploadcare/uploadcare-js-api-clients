/* @flow */

export default class RequestError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'RequestError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
