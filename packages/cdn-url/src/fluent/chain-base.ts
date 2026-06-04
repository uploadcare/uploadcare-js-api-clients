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

  /** The operations accumulated so far (defensive copy). */
  public get operations(): CdnOperation[] {
    return [...this._s.operations]
  }
}
