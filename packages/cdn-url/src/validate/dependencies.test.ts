import { describe, expect, it } from 'vitest'

import type { CdnOperation } from '../types'
import {
  OPERATION_MODIFIERS,
  operationDependents,
  operationGraph,
  operationInputs
} from './index'

const op = (name: string, ...params: string[]): CdnOperation => ({
  name,
  params
})

/** Compact view of an edge list: `name@index`. */
const edges = (list: { operation: CdnOperation; index: number }[]) =>
  list.map((d) => `${d.operation.name}@${d.index}`)

describe('OPERATION_MODIFIERS', () => {
  it('maps each target to the operations that configure it', () => {
    expect(OPERATION_MODIFIERS.get('text')).toEqual(
      new Set(['text_align', 'font', 'text_box'])
    )
    expect(OPERATION_MODIFIERS.get('resize')).toEqual(new Set(['stretch']))
    expect(OPERATION_MODIFIERS.get('scale_crop')).toEqual(new Set(['stretch']))
  })

  it('has no entry for operations with no modelled dependencies', () => {
    expect(OPERATION_MODIFIERS.get('blur')).toBeUndefined()
    expect(OPERATION_MODIFIERS.get('quality')).toBeUndefined()
  })
})

describe('operationInputs', () => {
  it('accepts a plain name ref', () => {
    const ops = [
      op('font', '24', 'fff'),
      op('text_align', 'center', 'bottom'),
      op('preview'),
      op('text', '80px20p', 'bottom', 'Hi')
    ]
    expect(edges(operationInputs(ops, 'text'))).toEqual([
      'font@0',
      'text_align@1'
    ])
  })

  it('accepts a creator ref', async () => {
    const { resize, stretch } = await import('../ops/index')
    const ops = [stretch('fill'), resize({ width: 100 })]
    expect(edges(operationInputs(ops, resize))).toEqual(['stretch@0'])
  })

  it('accepts an element of the chain, pinning the exact occurrence', () => {
    const first = op('text', '1x1', 'top', 'A')
    const second = op('text', '1x1', 'top', 'B')
    const ops = [op('font', '10'), first, op('font', '24'), second]
    expect(edges(operationInputs(ops, first))).toEqual(['font@0'])
    expect(edges(operationInputs(ops, second))).toEqual(['font@2'])
  })

  it('falls back to the first match for a ref that is not in the chain', () => {
    const ops = [op('font', '10'), op('text', '1x1', 'top', 'A')]
    expect(edges(operationInputs(ops, op('text', '9x9', 'top', 'Z')))).toEqual([
      'font@0'
    ])
  })

  it('takes the nearest modifier when one is overridden', () => {
    const ops = [
      op('font', '10'),
      op('font', '24'),
      op('text', '1x1', 'top', 'Hi')
    ]
    expect(edges(operationInputs(ops, 'text'))).toEqual(['font@1'])
  })

  it('ignores modifiers that come after the target', () => {
    expect(
      operationInputs(
        [op('text', '1x1', 'top', 'Hi'), op('font', '24')],
        'text'
      )
    ).toEqual([])
  })

  it('reports format/jpeg as a ceiling input to a core operation', () => {
    const ops = [op('format', 'jpeg'), op('resize', '4000x')]
    const inputs = operationInputs(ops, 'resize')
    expect(edges(inputs)).toEqual(['format@0'])
    expect(inputs[0]?.kind).toBe('ceiling')
  })

  it('does not treat a non-jpeg format as a ceiling input', () => {
    expect(
      operationInputs([op('format', 'webp'), op('resize', '100x')], 'resize')
    ).toEqual([])
  })

  it('finds a chain-global ceiling declared after the target', () => {
    expect(
      edges(
        operationInputs([op('resize', '4000x'), op('format', 'jpeg')], 'resize')
      )
    ).toEqual(['format@1'])
  })

  it('returns nothing for an operation with no dependencies', () => {
    expect(operationInputs([op('blur', '10'), op('preview')], 'blur')).toEqual(
      []
    )
  })

  it('returns nothing for a ref absent from the chain', () => {
    expect(operationInputs([op('preview')], 'text')).toEqual([])
  })
})

describe('operationDependents', () => {
  it('is the inverse of operationInputs', () => {
    const ops = [op('font', '24'), op('text', '1x1', 'top', 'Hi')]
    expect(edges(operationDependents(ops, 'font'))).toEqual(['text@1'])
    expect(edges(operationInputs(ops, 'text'))).toEqual(['font@0'])
  })

  it('reaches every target until the modifier is overridden', () => {
    const firstFont = op('font', '24')
    const secondFont = op('font', '10')
    const ops = [
      firstFont,
      op('text', '1x1', 'top', 'A'),
      op('text', '1x1', 'top', 'B'),
      secondFont,
      op('text', '1x1', 'top', 'C')
    ]
    expect(edges(operationDependents(ops, firstFont))).toEqual([
      'text@1',
      'text@2'
    ])
    expect(edges(operationDependents(ops, secondFont))).toEqual(['text@4'])
  })

  it('reports stretch reaching resize and scale_crop', () => {
    const ops = [
      op('stretch', 'fill'),
      op('resize', '100x'),
      op('scale_crop', '50x50')
    ]
    expect(edges(operationDependents(ops, 'stretch'))).toEqual([
      'resize@1',
      'scale_crop@2'
    ])
  })

  it('returns nothing for a modifier with no following target', () => {
    expect(
      operationDependents([op('preview'), op('stretch', 'off')], 'stretch')
    ).toEqual([])
  })

  it('returns nothing for an operation that modifies nothing', () => {
    expect(
      operationDependents([op('blur', '10'), op('preview')], 'blur')
    ).toEqual([])
  })
})

describe('operationGraph', () => {
  it('returns one node per operation, in chain order', () => {
    const ops = [op('font', '24'), op('text', '1x1', 'top', 'Hi')]
    const graph = operationGraph(ops)
    expect(graph.map((n) => n.operation.name)).toEqual(['font', 'text'])
    expect(graph.map((n) => n.index)).toEqual([0, 1])
  })

  it('carries both directions on every node', () => {
    const graph = operationGraph([
      op('font', '24'),
      op('text', '1x1', 'top', 'Hi')
    ])
    expect(edges(graph[0]?.dependents ?? [])).toEqual(['text@1'])
    expect(graph[0]?.inputs).toEqual([])
    expect(edges(graph[1]?.inputs ?? [])).toEqual(['font@0'])
    expect(graph[1]?.dependents).toEqual([])
  })

  it('distinguishes repeated occurrences by position, not identity', () => {
    const shared = op('font', '24')
    // the *same object* twice — index-based nodes must still differ
    const ops = [shared, op('text', '1x1', 'top', 'A'), shared]
    const graph = operationGraph(ops)
    expect(edges(graph[0]?.dependents ?? [])).toEqual(['text@1'])
    expect(graph[2]?.dependents).toEqual([])
  })

  it('is empty-safe', () => {
    expect(operationGraph([])).toEqual([])
  })

  it('finds orphaned modifiers without any index arithmetic', () => {
    const orphans = operationGraph([op('preview'), op('font', '24')])
      .filter((n) => n.operation.name === 'font' && n.dependents.length === 0)
      .map((n) => n.operation.name)
    expect(orphans).toEqual(['font'])
  })
})

describe('the model agrees with validateOperations', () => {
  it('an orphaned modifier is exactly what the diagnostics report', async () => {
    const { validateOperations } = await import('./index')
    const orphaned = [op('preview'), op('stretch', 'off')]
    expect(operationDependents(orphaned, 'stretch')).toEqual([])
    expect(validateOperations(orphaned).map((d) => d.code)).toContain(
      'stretch-without-resize'
    )

    const paired = [op('stretch', 'off'), op('resize', '100x')]
    expect(operationDependents(paired, 'stretch')).toHaveLength(1)
    expect(validateOperations(paired).map((d) => d.code)).not.toContain(
      'stretch-without-resize'
    )
  })
})
