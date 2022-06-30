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

  constructor(message?: string | null, options: RestClientErrorOptions = {}) {
    super()

    this.name = 'RestClientError'
    this.request = options.request
    this.response = options.response

    this.status = options.response?.status
    this.statusText = options.response?.statusText

    const msg = message ?? DEFAULT_MESSAGE
    const status =
      this.status || this.statusText
        ? `[${[this.status, msg === this.statusText ? '' : this.statusText]
            .filter(Boolean)
            .join(' ')}] `
        : ''
    this.message = status + msg

    Object.setPrototypeOf(this, RestClientError.prototype)
  }
}
