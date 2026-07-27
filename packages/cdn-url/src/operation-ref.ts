import type { CdnOperation } from './types'

/**
 * Brand carried by every operation creator: the CDN directive name it
 * produces. Lets creators themselves act as {@link OperationRef}s —
 * `url.without(resize)` instead of `url.without('resize')`.
 */
export interface NamedOperationCreator {
  /** The CDN operation name this creator produces, e.g. `crop` for `cropByRatio`. */
  readonly opName: string
}

/**
 * Anything that identifies an operation: its name as a string, an operation
 * object, or the creator function itself.
 *
 * @example
 * ```ts
 * url.without(resize) // creator — typo-proof, alias-aware (cropByRatio → 'crop')
 * url.without('resize') // plain string — for parsed/unknown ops
 * ```
 */
export type OperationRef = string | CdnOperation | NamedOperationCreator

/**
 * Resolves an {@link OperationRef} to the operation name it identifies.
 */
export function operationNameOf(ref: OperationRef): string {
  if (typeof ref === 'string') return ref
  if ('opName' in ref) return ref.opName
  return ref.name
}

/**
 * Resolves an {@link OperationRef} to its directive name with any counted
 * suffix stripped — `thumbs~5` and `thumbs~3` both reduce to `thumbs`.
 *
 * @see https://uploadcare.com/docs/transformations/video-encoding/#operation-thumbs
 * @example
 * ```ts
 * operationBaseName(thumbs(5)) // → 'thumbs'
 * operationBaseName('resize') // → 'resize'
 * ```
 */
export function operationBaseName(ref: OperationRef): string {
  const name = operationNameOf(ref)
  const separator = name.indexOf('~')
  return separator === -1 ? name : name.slice(0, separator)
}

/**
 * Whether an operation matches a ref, comparing base names so that counted
 * suffixes line up in both directions: `thumbs~5` matches the `thumbs` ref,
 * the `thumbs` operation matches a `thumbs~5` ref, and `thumbs~5` matches
 * `thumbs~3`.
 *
 * @example
 * ```ts
 * operationMatches(thumbs(5), 'thumbs') // → true
 * operationMatches(thumbs(5), thumbs(3)) // → true
 * operationMatches({ name: 'resize', params: [] }, 'preview') // → false
 * ```
 */
export function operationMatches(op: CdnOperation, ref: OperationRef): boolean {
  return operationBaseName(op) === operationBaseName(ref)
}

/**
 * Brands an operation creator with the directive name it produces.
 *
 * @internal
 */
export function namedOp<F extends (...args: never[]) => CdnOperation>(
  opName: string,
  create: F
): F & NamedOperationCreator {
  return Object.assign(create, { opName })
}
