import { trimTrailingSlashes } from '../grammar'
import { type OperationRef, operationMatches } from '../operation-ref'
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

  /** Replaces the first same-named operation in place, or appends it. */
  public replace(operation: CdnOperation): CdnUrl {
    return this.#withOperations((current) => {
      const index = current.findIndex((op) => op.name === operation.name)
      if (index === -1) return [...current, operation]
      const next = [...current]
      next[index] = operation
      return next
    })
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

  #withOperations(update: (current: CdnOperation[]) => CdnOperation[]): CdnUrl {
    if (!('operations' in this.#parsed)) {
      if (__DEV__) {
        throw new TypeError('Group root urls cannot carry operations')
      }
      return this
    }
    return new CdnUrl({
      ...this.#parsed,
      operations: update(this.#parsed.operations)
    })
  }
}
