import { type OperationRef, operationMatches } from '../operation-ref'
import type { CdnOperation } from '../types'

/** @internal */
export interface ChainState {
  operations: CdnOperation[]
}

/**
 * Shared machinery for all fluent chains: immutable state, forking, and the
 * raw-operation escape hatches.
 *
 * @internal
 */
export abstract class Chain<S extends ChainState> {
  /** @internal */
  protected readonly _s: S

  /** @internal */
  public constructor(state: S) {
    this._s = state
  }

  /** @internal */
  protected _next(patch: Partial<S>): this {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- this.constructor is typed Function
    const Ctor = this.constructor as new (state: S) => this
    return new Ctor({ ...this._s, ...patch })
  }

  /**
   * Forks with a new operations array. The single place the `Partial<S>`
   * cast lives: `{ operations }` is a valid `Partial<S>` (S extends
   * ChainState), but TS cannot prove it for an unresolved generic S.
   * @internal
   */
  protected _withOperations(operations: CdnOperation[]): this {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see jsdoc
    const patch = { operations } as Partial<S>
    return this._next(patch)
  }

  /** @internal */
  protected _add(...operations: CdnOperation[]): this {
    return this._withOperations([...this._s.operations, ...operations])
  }

  /** Appends an arbitrary operation without validation (escape hatch). */
  public op(name: string, ...params: string[]): this {
    return this._add({ name, params })
  }

  /**
   * Removes every occurrence of an operation. Accepts the operation name,
   * an operation object, or the creator itself: `chain.withoutOp(resize)`.
   */
  public withoutOp(ref: OperationRef): this {
    return this._withOperations(
      this._s.operations.filter((op) => !operationMatches(op, ref))
    )
  }

  /**
   * The primitive the other operation mutators are sugar over: rewrites the
   * whole chain through a callback, preserving the chain subtype. Mirrors
   * `CdnUrl.updateOperations`, and is the only way to edit by position —
   * replacing the *nth* stackable operation, inserting at an index, or
   * reordering. It is also the sole edit path for conversion chains
   * (`video`/`document`/`gif2video`), which cannot be re-parsed from output.
   *
   * The callback receives a defensive copy; whatever it returns becomes the
   * new chain.
   *
   * @example
   * ```ts
   * cdn.video(uuid).size({ width: 720 }).thumbs(5)
   *   .updateOperations((ops) =>
   *     ops.map((op) => (op.name === 'size' ? size({ width: 480 }) : op))
   *   ).path // → /uuid/video/-/size/480x/-/thumbs~5/
   * ```
   */
  public updateOperations(
    update: (current: CdnOperation[]) => CdnOperation[]
  ): this {
    return this._withOperations(update([...this._s.operations]))
  }

  /**
   * Whether a matching operation is present. Mirrors `CdnUrl.has`; named with
   * the `Op` suffix so it can never collide with a transformation method.
   *
   * @example
   * ```ts
   * cdn.file(uuid).quality('smart').hasOp(quality) // → true
   * ```
   */
  public hasOp(ref: OperationRef): boolean {
    return this._s.operations.some((op) => operationMatches(op, ref))
  }

  /**
   * First matching operation, or `null`. Mirrors `CdnUrl.get`.
   *
   * @example
   * ```ts
   * cdn.file(uuid).quality('smart').getOp('quality')
   * // → { name: 'quality', params: ['smart'] }
   * ```
   */
  public getOp(ref: OperationRef): CdnOperation | null {
    return this._s.operations.find((op) => operationMatches(op, ref)) ?? null
  }

  /**
   * Every matching operation, in chain order. Mirrors `CdnUrl.getAll`.
   *
   * @example
   * ```ts
   * chain.getAllOps('overlay') // → [{ name: 'overlay', … }, …]
   * ```
   */
  public getAllOps(ref: OperationRef): CdnOperation[] {
    return this._s.operations.filter((op) => operationMatches(op, ref))
  }

  /**
   * Replaces the first matching operation in place, or appends it. Mirrors
   * `CdnUrl.replace`.
   *
   * @example
   * ```ts
   * cdn.file(uuid).resize({ width: 300 }).replaceOp(resize({ width: 500 })).href
   * ```
   */
  public replaceOp(operation: CdnOperation): this {
    const current = this._s.operations
    const index = current.findIndex((op) => operationMatches(op, operation))
    if (index === -1) return this._add(operation)
    const next = [...current]
    next[index] = operation
    return this._withOperations(next)
  }

  /**
   * Collapses every matching operation into one, kept at the position of the
   * first match; appends when nothing matches. Mirrors `CdnUrl.replaceAll`.
   *
   * @example
   * ```ts
   * chain.replaceAllOps({ name: 'overlay', params: [uuid] }).operations
   * ```
   */
  public replaceAllOps(operation: CdnOperation): this {
    const current = this._s.operations
    const index = current.findIndex((op) => operationMatches(op, operation))
    if (index === -1) return this._add(operation)
    return this._withOperations(
      current.flatMap((op, i) =>
        i === index ? [operation] : operationMatches(op, operation) ? [] : [op]
      )
    )
  }

  /** The operations accumulated so far (defensive copy). */
  public get operations(): CdnOperation[] {
    return [...this._s.operations]
  }
}
