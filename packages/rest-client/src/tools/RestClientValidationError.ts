import { camelizeString } from '@uploadcare/api-client-utils'
import { RestClientError, RestClientErrorOptions } from './RestClientError'
import { ServerValidationErrorResponse } from '../types/ServerErrorResponse'

/** As the server spells it; the key it becomes is {@link NON_FIELD_ERRORS}. */
const SERVER_NON_FIELD_ERRORS = 'non_field_errors'

/** Errors that belong to a level rather than to one of its fields. */
const NON_FIELD_ERRORS = 'nonFieldErrors'

/**
 * Field names become camelCase like everything else the client hands back, with
 * one exception: a segment addressing the caller's own data, `metadata[color]`,
 * is theirs to spell. Camelizing it would produce `metadataColor` and lose both
 * the key and the form.
 */
const toFieldName = (segment: string) =>
  segment.includes('[') ? segment : camelizeString(segment)

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
 *   try {
 *     await searchFiles({ query: 'abc' }, { authSchema })
 *   } catch (error) {
 *     if (error instanceof RestClientValidationError) {
 *       error.errors // { query: ['Must be at least 4 characters.'] }
 *     }
 *   }
 */
export class RestClientValidationError extends RestClientError {
  readonly errors: ServerValidationErrorResponse

  /**
   * Reads a response body as validation errors, or returns `undefined` when it
   * is not that shape, leaving the caller to fall back.
   *
   * The bodies nest: a field maps either to its messages or to its own fields,
   * so `{"size": {"non_field_errors": [...]}}` is a complaint about `size`
   * itself. Those segments are dropped, since they name the level above rather
   * than a field of it, which leaves `nonFieldErrors` only ever at the root.
   * Anything deeper is flattened to a dotted path, and every segment is
   * camelized except one naming the caller's own metadata.
   *
   * @param json - A parsed response body.
   * @returns Errors keyed by field, or `undefined` when the body is shaped some
   *   other way.
   */
  static parse(json: unknown): ServerValidationErrorResponse | undefined {
    const errors: ServerValidationErrorResponse = {}

    const collect = (node: unknown, path: string[]): boolean => {
      if (!isPlainObject(node)) {
        return false
      }
      for (const [key, value] of Object.entries(node)) {
        const nextPath =
          key === SERVER_NON_FIELD_ERRORS ? path : [...path, toFieldName(key)]
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

  /**
   * @param errors - Errors keyed by field, as {@link parse} returns them. The
   *   message is derived from them, so the two cannot disagree.
   * @param options - The request and response that produced them.
   */
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
 *   catch (error) {
 *   if (isRestClientValidationError(error)) {
 *   error.errors.query // typed
 *   }
 *   }
 *
 * @param error - Any caught value.
 * @returns Whether the server rejected the request's contents, as opposed to
 *   failing for some other reason.
 */
export const isRestClientValidationError = (
  error: unknown
): error is RestClientValidationError =>
  error instanceof RestClientValidationError
