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
 * Whether an operation matches a ref. Counted suffixes match their base
 * name: `thumbs~5` matches the `thumbs` ref.
 */
export function operationMatches(op: CdnOperation, ref: OperationRef): boolean {
  const name = operationNameOf(ref)
  return op.name === name || op.name.startsWith(`${name}~`)
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
