/**
 * Order-dependent relationships between operations in a chain.
 *
 * The CDN chain is a flat list — no operation nests inside another. What some
 * operations do have is a *positional* relationship: `font` configures the
 * `text` that comes after it, `stretch` configures the following `resize`.
 * This module makes those edges queryable in both directions.
 *
 * Only relationships the package can source are modelled: the text-overlay
 * state operations (documented as applying to the **following** `text`), the
 * `stretch` rule the validator already enforces, and the `format/jpeg`
 * dimension ceiling. Everything else — overlay z-order, `blur_region` versus
 * `blur` — is deliberately absent rather than guessed at; the engine's exact
 * rules are not public.
 */
import {
  type OperationRef,
  operationBaseName,
  operationMatches
} from '../operation-ref'
import type { CdnOperation } from '../types'

/**
 * How one operation relates to another.
 *
 * - `modifier` — state that applies to a **later** target operation, and is
 *   replaced when the same modifier appears again (`font` → `text`).
 * - `ceiling` — changes a limit applied to the target, wherever it sits in the
 *   chain (`format/jpeg` raises the output dimension cap).
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * operationInputs(ops, i)[0]?.kind // → 'modifier'
 * ```
 */
export type DependencyKind = 'modifier' | 'ceiling'

/**
 * One edge of the dependency graph: a related operation and where it sits.
 *
 * @see https://uploadcare.com/docs/transformations/image/
 * @example
 * ```ts
 * // → { kind: 'modifier', operation: { name: 'font', … }, index: 0, reason: '…' }
 * operationInputs([font(24), text(['1x1'], 'top', 'Hi')], 1)[0]
 * ```
 */
export interface OperationDependency {
  /** Whether the edge is positional state or a chain-wide limit. */
  kind: DependencyKind
  /** The operation on the other end of the edge. */
  operation: CdnOperation
  /** Its index in the chain that was queried. */
  index: number
  /** Why the two are related, for diagnostics and tooling. */
  reason: string
}

/**
 * Target operation → the operations that configure it. The table this model is
 * built on; exported so callers can enumerate rather than probe.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * OPERATION_MODIFIERS.get('text') // → Set { 'text_align', 'font', 'text_box' }
 * ```
 */
export const OPERATION_MODIFIERS: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map([
  ['text', new Set(['text_align', 'font', 'text_box'])],
  ['resize', new Set(['stretch'])],
  ['scale_crop', new Set(['stretch'])]
])

/** Reverse index: modifier name → the targets it can configure. */
const MODIFIER_TARGETS: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const reversed = new Map<string, Set<string>>()
  for (const [target, modifiers] of OPERATION_MODIFIERS) {
    for (const modifier of modifiers) {
      const targets = reversed.get(modifier) ?? new Set<string>()
      targets.add(target)
      reversed.set(modifier, targets)
    }
  }
  return reversed
})()

/**
 * Whether an operation is state for a later one, rather than an effect in its
 * own right — the operations for which {@link operationDependents} can be
 * non-empty.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * isOperationModifier(font) // → true
 * isOperationModifier(blur) // → false
 * ```
 */
export function isOperationModifier(ref: OperationRef): boolean {
  return MODIFIER_TARGETS.has(operationBaseName(ref))
}

/** Core operations whose output dimensions the `format/jpeg` ceiling applies to. */
const CEILING_TARGETS = new Set([
  'preview',
  'resize',
  'smart_resize',
  'scale_crop'
])

function isJpegFormat(op: CdnOperation): boolean {
  return op.name === 'format' && op.params[0] === 'jpeg'
}

/**
 * The operations feeding the one at `index` — the state that configures it,
 * plus any chain-wide limit that applies to it. Returns an empty array when
 * the operation has no modelled dependencies or the index is out of range.
 *
 * A modifier reaches a target only if no later occurrence of the same modifier
 * sits between them, so the nearest one wins.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * const ops = [font(24), textAlign('center', 'bottom'), text(['1x1'], 'top', 'Hi')]
 * operationInputs(ops, 2).map((d) => d.operation.name) // → ['font', 'text_align']
 * ```
 */
function inputsAt(
  operations: readonly CdnOperation[],
  index: number
): OperationDependency[] {
  const target = operations[index]
  if (target === undefined) return []

  const targetName = operationBaseName(target)
  const dependencies: OperationDependency[] = []

  const modifiers = OPERATION_MODIFIERS.get(targetName)
  if (modifiers !== undefined) {
    for (const modifier of modifiers) {
      for (let i = index - 1; i >= 0; i--) {
        const candidate = operations[i]
        if (candidate === undefined) continue
        if (operationBaseName(candidate) !== modifier) continue
        dependencies.push({
          kind: 'modifier',
          operation: candidate,
          index: i,
          reason: `${modifier} sets state for the following ${targetName}`
        })
        break
      }
    }
    dependencies.sort((a, b) => a.index - b.index)
  }

  if (CEILING_TARGETS.has(targetName)) {
    const i = operations.findIndex(isJpegFormat)
    const ceiling = operations[i]
    if (ceiling !== undefined) {
      dependencies.push({
        kind: 'ceiling',
        operation: ceiling,
        index: i,
        reason: 'format/jpeg raises the output dimension limit to 5000px'
      })
    }
  }

  return dependencies
}

/**
 * The inverse of {@link operationInputs}: the operations that the one at
 * `index` affects. For a modifier that is every following target it still
 * reaches; for `format/jpeg` it is every core operation in the chain.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * // a font with no text after it affects nothing
 * operationDependents([preview(), font(24)], 1) // → []
 * ```
 */
function dependentsAt(
  operations: readonly CdnOperation[],
  index: number
): OperationDependency[] {
  const source = operations[index]
  if (source === undefined) return []

  const sourceName = operationBaseName(source)
  const dependents: OperationDependency[] = []

  const targets = MODIFIER_TARGETS.get(sourceName)
  if (targets !== undefined) {
    for (let i = index + 1; i < operations.length; i++) {
      const candidate = operations[i]
      if (candidate === undefined) continue
      const name = operationBaseName(candidate)
      if (name === sourceName) break
      if (!targets.has(name)) continue
      dependents.push({
        kind: 'modifier',
        operation: candidate,
        index: i,
        reason: `${sourceName} sets state for the following ${name}`
      })
    }
  }

  if (isJpegFormat(source)) {
    operations.forEach((candidate, i) => {
      if (!CEILING_TARGETS.has(operationBaseName(candidate))) return
      dependents.push({
        kind: 'ceiling',
        operation: candidate,
        index: i,
        reason: 'format/jpeg raises the output dimension limit to 5000px'
      })
    })
  }

  return dependents
}

/**
 * Resolves a ref to a position in the chain. An operation that is an element of
 * `operations` pins its exact occurrence by identity, which is what makes
 * repeated operations addressable; anything else falls back to the first match,
 * matching how `CdnUrl.get` behaves.
 */
function indexOf(
  operations: readonly CdnOperation[],
  ref: OperationRef
): number {
  if (typeof ref !== 'string' && 'params' in ref) {
    const identity = operations.indexOf(ref)
    if (identity !== -1) return identity
  }
  return operations.findIndex((op) => operationMatches(op, ref))
}

/**
 * The operations feeding the one identified by `ref` — the state that
 * configures it, plus any chain-wide limit that applies to it. Empty when the
 * operation has no modelled dependencies or is absent from the chain.
 *
 * A modifier reaches a target only if no later occurrence of the same modifier
 * sits between them, so the nearest one wins. Pass an element of `operations`
 * to pin a specific occurrence; a name or creator resolves to the first match.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * const ops = [font(24), textAlign('center', 'bottom'), text(['80p','20p'], 'bottom', 'Hi')]
 * operationInputs(ops, 'text').map((d) => d.operation.name) // → ['font', 'text_align']
 * ```
 */
export function operationInputs(
  operations: readonly CdnOperation[],
  ref: OperationRef
): OperationDependency[] {
  return inputsAt(operations, indexOf(operations, ref))
}

/**
 * The inverse of {@link operationInputs}: the operations that the one
 * identified by `ref` affects. For a modifier that is every following target it
 * still reaches; for `format/jpeg` it is every core operation in the chain.
 *
 * @see https://uploadcare.com/docs/transformations/image/overlay/#overlay-text
 * @example
 * ```ts
 * operationDependents([preview(), font(24)], 'font') // → [] — it affects nothing
 * ```
 */
export function operationDependents(
  operations: readonly CdnOperation[],
  ref: OperationRef
): OperationDependency[] {
  return dependentsAt(operations, indexOf(operations, ref))
}

/**
 * One node of {@link operationGraph}: an operation with both of its edge lists
 * already resolved.
 *
 * @see https://uploadcare.com/docs/transformations/image/
 * @example
 * ```ts
 * operationGraph(ops).filter((node) => node.dependents.length === 0)
 * ```
 */
export interface OperationNode {
  /** The operation this node describes. */
  operation: CdnOperation
  /** Its position in the chain. */
  index: number
  /** What configures it — see {@link operationInputs}. */
  inputs: OperationDependency[]
  /** What it affects — see {@link operationDependents}. */
  dependents: OperationDependency[]
}

/**
 * The whole chain as a dependency graph, one node per operation in order. Use
 * this instead of querying node by node: it needs no ref lookup, addresses
 * repeated operations unambiguously by position, and is what the validator
 * itself runs on.
 *
 * @see https://uploadcare.com/docs/transformations/image/
 * @example
 * ```ts
 * // every modifier that never reaches a target
 * operationGraph(ops).filter(
 *   (node) => isOperationModifier(node.operation) && node.dependents.length === 0
 * )
 * ```
 */
export function operationGraph(
  operations: readonly CdnOperation[]
): OperationNode[] {
  return operations.map((operation, index) => ({
    operation,
    index,
    inputs: inputsAt(operations, index),
    dependents: dependentsAt(operations, index)
  }))
}
