export type RestClientErrorOptions = {
  request?: Request
  response?: Response
}

const DEFAULT_MESSAGE = 'Unknown error'

export class RestClientError extends Error {
  readonly status?: number
  readonly statusText?: string

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

    this.status = options.response?.status
    this.statusText = options.response?.statusText

    Object.setPrototypeOf(this, RestClientError.prototype)
  }

  toString() {
    const status =
      this.status || this.statusText
        ? `[${[this.status, this.statusText].filter(Boolean).join(' ')}]`
        : ''
    return `${this.name}${status}: ${this.message}`
  }
}
