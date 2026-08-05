import { RestClientError, RestClientErrorOptions } from './RestClientError'
import { ServerValidationErrorResponse } from '../types/ServerErrorResponse'

/** Errors that belong to a level rather than to one of its fields. */
const NON_FIELD_ERRORS = 'non_field_errors'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const formatErrors = (errors: ServerValidationErrorResponse) =>
  Object.entries(errors)
    .map(([field, messages]) =>
      field === NON_FIELD_ERRORS
        ? messages.join(' ')
        : `${field}: ${messages.join(', ')}`
    )
    .join('; ')

/**
 * A request rejected for its contents rather than for what it addressed: `POST
 * /files/search/` answers this way when a condition is malformed or missing.
 *
 * It extends {@link RestClientError}, so code that catches that keeps working
 * and `status`, `request` and `response` are where they always were. What it
 * adds is {@link errors}: the server's complaints keyed by field, for callers
 * that want to react per field instead of reading the message.
 *
 * @example
 *   ;```ts
 *   try {
 *     await searchFiles({ query: 'abc' }, { authSchema })
 *   } catch (error) {
 *     if (error instanceof RestClientValidationError) {
 *       error.errors // { query: ['Must be at least 4 characters.'] }
 *     }
 *   }
 *   ```
 */
export class RestClientValidationError extends RestClientError {
  readonly errors: ServerValidationErrorResponse

  /**
   * Reads a response body as validation errors, or returns `undefined` when it
   * is not that shape, leaving the caller to fall back.
   *
   * The bodies nest: a field maps either to its messages or to its own fields,
   * so `{"size": {"non_field_errors": [...]}}` is a complaint about `size`.
   * Paths are flattened with dots, dropping `non_field_errors` segments because
   * they name the level above rather than a field of it.
   */
  static parse(json: unknown): ServerValidationErrorResponse | undefined {
    const errors: ServerValidationErrorResponse = {}

    const collect = (node: unknown, path: string[]): boolean => {
      if (!isPlainObject(node)) {
        return false
      }
      for (const [key, value] of Object.entries(node)) {
        const nextPath = key === NON_FIELD_ERRORS ? path : [...path, key]
        if (isStringArray(value)) {
          const field = nextPath.join('.') || NON_FIELD_ERRORS
          errors[field] = [...(errors[field] ?? []), ...value]
          continue
        }
        if (!collect(value, nextPath)) {
          return false
        }
      }
      return true
    }

    return collect(json, []) && Object.keys(errors).length > 0
      ? errors
      : undefined
  }

  constructor(
    errors: ServerValidationErrorResponse,
    options: RestClientErrorOptions = {}
  ) {
    super(formatErrors(errors), options)

    this.name = 'RestClientValidationError'
    this.errors = errors

    Object.setPrototypeOf(this, RestClientValidationError.prototype)
  }
}

/**
 * Narrows a caught value, which TypeScript types as `unknown`, without a cast.
 *
 * @example
 *   ;```ts
 *   catch (error) {
 *     if (isRestClientValidationError(error)) {
 *       error.errors.query // typed
 *     }
 *   }
 *   ```
 */
export const isRestClientValidationError = (
  error: unknown
): error is RestClientValidationError =>
  error instanceof RestClientValidationError
