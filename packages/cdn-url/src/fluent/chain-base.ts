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
    const Ctor = this.constructor as new (state: S) => this
    return new Ctor({ ...this._s, ...patch })
  }

  /** @internal */
  protected _add(...operations: CdnOperation[]): this {
    return this._next({
      operations: [...this._s.operations, ...operations]
    } as Partial<S>)
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
    return this._next({
      operations: this._s.operations.filter((op) => !operationMatches(op, ref))
    } as Partial<S>)
  }

  /** The operations accumulated so far (defensive copy). */
  public get operations(): CdnOperation[] {
    return [...this._s.operations]
  }
}
