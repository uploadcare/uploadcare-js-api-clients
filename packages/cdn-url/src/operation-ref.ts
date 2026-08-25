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
 * Replaces the first matching operation in place, or appends it when nothing
 * matches. Lives here rather than in the facades so `CdnUrl.replace` and
 * `Chain.replaceOp` cannot drift apart.
 *
 * @internal
 */
export function replaceFirstMatch(
  operations: readonly CdnOperation[],
  operation: CdnOperation
): CdnOperation[] {
  const index = operations.findIndex((op) => operationMatches(op, operation))
  if (index === -1) return [...operations, operation]
  return operations.map((op, i) => (i === index ? operation : op))
}

/**
 * Collapses every matching operation into one, kept at the position of the
 * first match; appends when nothing matches.
 *
 * @internal
 */
export function replaceEveryMatch(
  operations: readonly CdnOperation[],
  operation: CdnOperation
): CdnOperation[] {
  const index = operations.findIndex((op) => operationMatches(op, operation))
  if (index === -1) return [...operations, operation]
  return operations.flatMap((op, i) =>
    i === index ? [operation] : operationMatches(op, operation) ? [] : [op]
  )
}

/**
 * Runs an `updateOperations` callback over a defensive copy.
 *
 * A block-bodied callback with no `return` would otherwise produce a chain whose
 * operations are `undefined` — corrupt rather than merely empty — so a
 * non-array result throws in development and leaves the chain unchanged in
 * production. Total by design: it used to return `null` for that case, which
 * made every caller re-implement the same recovery and put a bundle-flavor
 * signal in the return type.
 *
 * @internal
 */
export function updatedOperations(
  operations: readonly CdnOperation[],
  update: (current: CdnOperation[]) => CdnOperation[]
): CdnOperation[] {
  const next = update([...operations])
  if (!Array.isArray(next)) {
    if (__DEV__) {
      throw new TypeError(
        'updateOperations callback must return an operations array'
      )
    }
    return [...operations]
  }
  return next
}

/** Whether any operation matches the ref. @internal */
export function hasOperation(
  operations: readonly CdnOperation[],
  ref: OperationRef
): boolean {
  return operations.some((op) => operationMatches(op, ref))
}

/** The first operation matching the ref, or null. @internal */
export function findOperation(
  operations: readonly CdnOperation[],
  ref: OperationRef
): CdnOperation | null {
  return operations.find((op) => operationMatches(op, ref)) ?? null
}

/** Every operation matching the ref, in chain order. @internal */
export function filterOperations(
  operations: readonly CdnOperation[],
  ref: OperationRef
): CdnOperation[] {
  return operations.filter((op) => operationMatches(op, ref))
}

/** Every operation *not* matching the ref, in chain order. @internal */
export function withoutOperation(
  operations: readonly CdnOperation[],
  ref: OperationRef
): CdnOperation[] {
  return operations.filter((op) => !operationMatches(op, ref))
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
