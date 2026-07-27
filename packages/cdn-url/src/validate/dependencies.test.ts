import { describe, expect, it } from 'vitest'

import type { CdnOperation } from '../types'
import {
  OPERATION_MODIFIERS,
  operationDependents,
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
    expect([...(OPERATION_MODIFIERS.get('resize') ?? [])]).toEqual(['stretch'])
    expect([...(OPERATION_MODIFIERS.get('scale_crop') ?? [])]).toEqual([
      'stretch'
    ])
  })

  it('has no entry for operations with no modelled dependencies', () => {
    expect(OPERATION_MODIFIERS.get('blur')).toBeUndefined()
    expect(OPERATION_MODIFIERS.get('quality')).toBeUndefined()
  })
})

describe('operationInputs', () => {
  it('collects the modifiers that reach a text operation', () => {
    const ops = [
      op('font', '24', 'fff'),
      op('text_align', 'center', 'bottom'),
      op('preview'),
      op('text', '80px20p', 'bottom', 'Hi')
    ]
    expect(edges(operationInputs(ops, 3))).toEqual(['font@0', 'text_align@1'])
  })

  it('takes the nearest modifier when one is overridden', () => {
    const ops = [
      op('font', '10'),
      op('font', '24'),
      op('text', '80px20p', 'bottom', 'Hi')
    ]
    expect(edges(operationInputs(ops, 2))).toEqual(['font@1'])
  })

  it('ignores modifiers that come after the target', () => {
    const ops = [op('text', '80px20p', 'bottom', 'Hi'), op('font', '24')]
    expect(operationInputs(ops, 0)).toEqual([])
  })

  it('resolves stretch for a following resize', () => {
    const ops = [op('stretch', 'fill'), op('resize', '100x')]
    expect(edges(operationInputs(ops, 1))).toEqual(['stretch@0'])
  })

  it('reports format/jpeg as a ceiling input to a core operation', () => {
    const ops = [op('format', 'jpeg'), op('resize', '4000x')]
    const inputs = operationInputs(ops, 1)
    expect(edges(inputs)).toEqual(['format@0'])
    expect(inputs[0]?.kind).toBe('ceiling')
  })

  it('does not treat a non-jpeg format as a ceiling input', () => {
    expect(
      operationInputs([op('format', 'webp'), op('resize', '100x')], 1)
    ).toEqual([])
  })

  it('finds a chain-global ceiling declared after the target', () => {
    const ops = [op('resize', '4000x'), op('format', 'jpeg')]
    expect(edges(operationInputs(ops, 0))).toEqual(['format@1'])
  })

  it('returns nothing for an operation with no dependencies', () => {
    expect(operationInputs([op('blur', '10'), op('preview')], 0)).toEqual([])
  })

  it('returns nothing for an out-of-range index', () => {
    expect(operationInputs([op('preview')], 5)).toEqual([])
  })
})

describe('operationDependents', () => {
  it('is the inverse of operationInputs', () => {
    const ops = [op('font', '24'), op('text', '80px20p', 'bottom', 'Hi')]
    expect(edges(operationDependents(ops, 0))).toEqual(['text@1'])
    expect(edges(operationInputs(ops, 1))).toEqual(['font@0'])
  })

  it('reaches every target until the modifier is overridden', () => {
    const ops = [
      op('font', '24'),
      op('text', '1x1', 'top', 'A'),
      op('text', '1x1', 'top', 'B'),
      op('font', '10'),
      op('text', '1x1', 'top', 'C')
    ]
    expect(edges(operationDependents(ops, 0))).toEqual(['text@1', 'text@2'])
    expect(edges(operationDependents(ops, 3))).toEqual(['text@4'])
  })

  it('reports stretch reaching resize and scale_crop', () => {
    const ops = [
      op('stretch', 'fill'),
      op('resize', '100x'),
      op('scale_crop', '50x50')
    ]
    expect(edges(operationDependents(ops, 0))).toEqual([
      'resize@1',
      'scale_crop@2'
    ])
  })

  it('returns nothing for a modifier with no following target', () => {
    expect(
      operationDependents([op('preview'), op('stretch', 'off')], 1)
    ).toEqual([])
  })

  it('returns nothing for an operation that modifies nothing', () => {
    expect(operationDependents([op('blur', '10'), op('preview')], 0)).toEqual(
      []
    )
  })
})

describe('the model agrees with validateOperations', () => {
  it('an orphaned modifier is exactly what stretch-without-resize detects', async () => {
    const { validateOperations } = await import('./index')
    const orphaned = [op('preview'), op('stretch', 'off')]
    expect(operationDependents(orphaned, 1)).toEqual([])
    expect(validateOperations(orphaned).map((d) => d.code)).toContain(
      'stretch-without-resize'
    )

    const paired = [op('stretch', 'off'), op('resize', '100x')]
    expect(operationDependents(paired, 0)).toHaveLength(1)
    expect(validateOperations(paired).map((d) => d.code)).not.toContain(
      'stretch-without-resize'
    )
  })
})
