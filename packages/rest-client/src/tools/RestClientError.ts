import { UploadcareError } from '@uploadcare/api-client-utils'

export type RestClientErrorOptions = {
  /** The signed request, when one was built. */
  request?: Request
  /** The response, when one arrived; `status` is read from it. */
  response?: Response
}

const DEFAULT_MESSAGE = 'Unknown error'

/**
 * Anything that went wrong in a request: a transport failure, a non-2xx status,
 * or a missing setting. `status` and `response` are absent for the failures
 * that never reached the API.
 *
 * {@link RestClientValidationError} extends this for the case where the server
 * rejected the request's contents and said which fields were at fault.
 *
 * TODO: it's better to split errors into something like Runtime error and
 * ServerError (RestApiError)
 */
export class RestClientError extends UploadcareError {
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

/**
 * Narrows a caught value, which TypeScript types as `unknown`, without a cast.
 * True for subclasses too, {@link RestClientValidationError} among them.
 *
 * @example
 *   catch (error) {
 *   if (isRestClientError(error)) {
 *   error.status // typed
 *   }
 *   }
 *
 * @param error - Any caught value.
 * @returns Whether it is a `RestClientError` or a subclass of one.
 */
export const isRestClientError = (error: unknown): error is RestClientError =>
  error instanceof RestClientError
