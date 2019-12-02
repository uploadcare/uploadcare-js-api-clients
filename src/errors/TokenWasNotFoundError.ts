import {Uuid} from '..'

export default class TokenWasNotFoundError extends Error {
  constructor(token: Uuid) {
    super()

    this.name = 'TokenWasNotFoundError'
    this.message = `Token "${token}" was not found.`

    Object.setPrototypeOf(this, TokenWasNotFoundError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TokenWasNotFoundError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
