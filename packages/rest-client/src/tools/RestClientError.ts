import { UploadcareError } from '@uploadcare/api-client-utils'

export type RestClientErrorOptions = {
  request?: Request
  response?: Response
  /**
   * Validation errors keyed by field, when the server sent them instead of a
   * `detail` string.
   */
  errors?: Record<string, string[]>
}

const DEFAULT_MESSAGE = 'Unknown error'

/**
 * TODO: it's better to split errors into something like Runtime error and
 * ServerError (RestApiError)
 */
export class RestClientError extends UploadcareError {
  readonly status?: number
  readonly statusText?: string

  readonly request?: Request
  readonly response?: Response

  /**
   * Validation errors keyed by field, present when the server sent them instead
   * of a `detail` string — `POST /files/search/` answers a 400 that way. The
   * message names the same fields; this is for branching on them.
   */
  readonly errors?: Record<string, string[]>

  constructor(message?: string | null, options: RestClientErrorOptions = {}) {
    super()

    this.name = 'RestClientError'
    this.request = options.request
    this.response = options.response
    this.errors = options.errors

    this.status = options.response?.status
    this.statusText = options.response?.statusText

    const msg = message ?? this.statusText ?? DEFAULT_MESSAGE
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
