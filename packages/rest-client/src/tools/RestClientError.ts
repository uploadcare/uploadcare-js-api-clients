export type RestClientErrorOptions = {
  request?: Request
  response?: Response
}

const DEFAULT_MESSAGE = 'Unknown error'

export class RestClientError extends Error {
  readonly request?: Request
  readonly response?: Response

  constructor(
    message: string = DEFAULT_MESSAGE,
    options: RestClientErrorOptions = {}
  ) {
    super()

    this.name = 'RestClientError'
    this.message = message
    this.request = options.request
    this.response = options.response

    Object.setPrototypeOf(this, RestClientError.prototype)
  }
}
