import { trimTrailingSlashes } from '../grammar'
import {
  type OperationRef,
  operationMatches,
  replaceEveryMatch,
  replaceFirstMatch,
  updatedOperations
} from '../operation-ref'
import { parseCdnUrl } from '../parse'
import { serializeCdnUrl } from '../serialize'
import type { CdnOperation, CdnUrlInput, ParsedCdnUrl } from '../types'

/** Normalizes a loose {@link CdnUrlInput} into a full {@link ParsedCdnUrl}. */
function normalizeInput(input: CdnUrlInput | ParsedCdnUrl): ParsedCdnUrl {
  if ('kind' in input) return input
  const origin = trimTrailingSlashes(input.origin)

  if ('sourceUrl' in input) {
    return {
      kind: 'proxy',
      origin,
      operations: input.operations ?? [],
      sourceUrl: input.sourceUrl
    }
  }

  const search = input.search ?? ''
  const hash = input.hash ?? ''

  if ('group' in input) {
    if (input.nth != null) {
      return {
        kind: 'group-element',
        origin,
        group: input.group,
        nth: input.nth,
        operations: input.operations ?? [],
        filename: input.filename ?? null,
        search,
        hash
      }
    }
    return { kind: 'group', origin, group: input.group, search, hash }
  }

  return {
    kind: 'file',
    origin,
    uuid: input.uuid,
    conversion: input.conversion ?? null,
    operations: input.operations ?? [],
    filename: input.filename ?? null,
    search,
    hash
  }
}

/**
 * Immutable, chainable facade over the functional core. Optional import —
 * everything it does is possible with `parseCdnUrl`, `serializeCdnUrl` and
 * plain array operations.
 *
 * Every mutator returns a new instance; the original is never changed.
 *
 * @example
 * ```ts
 * CdnUrl.parse(src).without(resize).with(preview(800, 600)).href
 * ```
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 */
export class CdnUrl {
  readonly #parsed: ParsedCdnUrl

  public constructor(init: CdnUrlInput | ParsedCdnUrl) {
    this.#parsed = normalizeInput(init)
  }

  /**
   * Parses an existing CDN URL.
   *
   * @throws TypeError when the URL cannot be interpreted as a CDN URL.
   */
  public static parse(url: string): CdnUrl {
    return new CdnUrl(parseCdnUrl(url))
  }

  /** A defensive copy of the operation chain (empty for group root urls). */
  public get operations(): CdnOperation[] {
    return 'operations' in this.#parsed ? [...this.#parsed.operations] : []
  }

  /** The serialized URL string. */
  public get href(): string {
    return serializeCdnUrl(this.#parsed)
  }

  /** Alias of {@link CdnUrl.href} for string coercion. */
  public toString(): string {
    return this.href
  }

  /** The underlying {@link ParsedCdnUrl}, discriminated by `kind`. */
  public toJSON(): ParsedCdnUrl {
    return 'operations' in this.#parsed
      ? { ...this.#parsed, operations: [...this.#parsed.operations] }
      : { ...this.#parsed }
  }

  /**
   * Appends operations to the chain.
   *
   * @throws TypeError on group root urls, which cannot carry operations.
   */
  public with(...operations: CdnOperation[]): CdnUrl {
    return this.#withOperations((current) => [...current, ...operations])
  }

  /**
   * Removes every occurrence of an operation. Accepts the operation name,
   * an operation object, or the creator itself: `url.without(resize)`.
   */
  public without(ref: OperationRef): CdnUrl {
    return this.#withOperations((current) =>
      current.filter((op) => !operationMatches(op, ref))
    )
  }

  /**
   * Replaces the first matching operation in place, or appends it. Matching
   * follows {@link operationMatches}, so counted operations are swapped
   * rather than duplicated (`thumbs~5` → `thumbs~3`).
   *
   * Only the first match is touched. For a stackable operation that legitimately
   * repeats (`overlay`, `text`, …) use {@link CdnUrl.replaceAll} instead.
   *
   * @example
   * ```ts
   * CdnUrl.parse(url).replace(resize({ width: 500 })).href
   * ```
   */
  public replace(operation: CdnOperation): CdnUrl {
    return this.#withOperations((current) =>
      replaceFirstMatch(current, operation)
    )
  }

  /**
   * Collapses every matching operation into a single one, kept at the position
   * of the first match; appends when nothing matches. The way to force a
   * stackable operation to occur exactly once.
   *
   * @example
   * ```ts
   * // two overlays in, one overlay out
   * CdnUrl.parse(url).replaceAll(overlay(uuid, { size: ['50p', '50p'] })).href
   * ```
   */
  public replaceAll(operation: CdnOperation): CdnUrl {
    return this.#withOperations((current) =>
      replaceEveryMatch(current, operation)
    )
  }

  /** Whether a matching operation is present (name, object or creator ref). */
  public has(ref: OperationRef): boolean {
    return this.operations.some((op) => operationMatches(op, ref))
  }

  /** First matching operation (name, object or creator ref), or null. */
  public get(ref: OperationRef): CdnOperation | null {
    return this.operations.find((op) => operationMatches(op, ref)) ?? null
  }

  /**
   * Every matching operation, in chain order — the stackable-aware companion
   * to {@link CdnUrl.get}. Returns a fresh array; empty when nothing matches.
   *
   * @example
   * ```ts
   * CdnUrl.parse(url).getAll(overlay) // → [{ name: 'overlay', … }, …]
   * ```
   */
  public getAll(ref: OperationRef): CdnOperation[] {
    return this.operations.filter((op) => operationMatches(op, ref))
  }

  /**
   * Sets or clears (`null`) the trailing filename.
   *
   * @throws TypeError on group root and proxy urls.
   */
  public setFilename(filename: string | null): CdnUrl {
    if (this.#parsed.kind === 'group' || this.#parsed.kind === 'proxy') {
      if (__DEV__) {
        throw new TypeError(`${this.#parsed.kind} urls cannot carry a filename`)
      }
      return this
    }
    return new CdnUrl({ ...this.#parsed, filename })
  }

  /** Rebases the url onto another domain. */
  public setOrigin(origin: string): CdnUrl {
    return new CdnUrl({ ...this.#parsed, origin: trimTrailingSlashes(origin) })
  }

  /**
   * The primitive every other operation mutator is sugar over: rewrites the
   * whole chain through a callback. Reach for it when position matters and
   * {@link CdnUrl.replace} / {@link CdnUrl.replaceAll} do not fit — replacing
   * the *nth* stackable operation, inserting at an index, reordering, or
   * matching on parameters rather than name.
   *
   * The callback receives a defensive copy, so mutating it in place is safe;
   * whatever it returns becomes the new chain.
   *
   * @throws TypeError on group root urls, which cannot carry operations.
   * @see https://uploadcare.com/docs/transformations/image/
   * @example
   * ```ts
   * // replace the second overlay, leaving the others untouched
   * let seen = -1
   * url.updateOperations((ops) =>
   *   ops.map((op) => (operationMatches(op, overlay) && ++seen === 1 ? next : op))
   * )
   * ```
   */
  public updateOperations(
    update: (current: CdnOperation[]) => CdnOperation[]
  ): CdnUrl {
    return this.#withOperations(update)
  }

  #withOperations(update: (current: CdnOperation[]) => CdnOperation[]): CdnUrl {
    if (!('operations' in this.#parsed)) {
      if (__DEV__) {
        throw new TypeError('Group root urls cannot carry operations')
      }
      return this
    }
    const next = updatedOperations(this.#parsed.operations, update)
    if (next === null) return this
    return new CdnUrl({ ...this.#parsed, operations: next })
  }
}
