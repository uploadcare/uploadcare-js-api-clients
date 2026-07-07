import { describe, expect, it } from 'vitest'

import type { CdnOperation } from '../index'
import { validateOperations } from './index'

const op = (name: string, ...params: string[]): CdnOperation => ({
  name,
  params
})

const codes = (
  ops: CdnOperation[],
  context?: Parameters<typeof validateOperations>[1]
) => validateOperations(ops, context).map((d) => d.code)

describe('validateOperations', () => {
  it('returns no diagnostics for a sound chain', () => {
    expect(
      validateOperations([
        op('preview', '1000x400'),
        op('format', 'auto'),
        op('quality', 'smart')
      ])
    ).toEqual([])
  })

  it('warns when no core operation is present but processing ops are', () => {
    const diags = validateOperations([op('blur', '20')])
    expect(diags).toContainEqual(
      expect.objectContaining({
        code: 'no-core-operation',
        severity: 'warning'
      })
    )
  })

  it('does not require a core operation for info-only chains', () => {
    expect(codes([op('json')])).not.toContain('no-core-operation')
  })

  it('errors when must-be-last operations are not last', () => {
    const diags = validateOperations([op('main_colors'), op('preview')])
    expect(diags).toContainEqual(
      expect.objectContaining({
        code: 'must-be-last',
        severity: 'error',
        opIndex: 0
      })
    )
    expect(codes([op('preview'), op('main_colors')])).not.toContain(
      'must-be-last'
    )
  })

  it('warns about duplicate operations (last wins)', () => {
    const diags = validateOperations([
      op('preview'),
      op('quality', 'smart'),
      op('quality', 'best')
    ])
    expect(diags).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-operation',
        severity: 'warning',
        opIndex: 2
      })
    )
  })

  it('does not flag legitimately repeatable operations as duplicates', () => {
    expect(
      codes([
        op('preview'),
        op('overlay', 'uuid1'),
        op('overlay', 'uuid2'),
        op('rect', '9f9', '10x10', 'center'),
        op('rect', 'f99', '20x20', 'center'),
        op('blur_region', '10x10', '0,0'),
        op('blur_region', 'faces')
      ])
    ).not.toContain('duplicate-operation')
  })

  it('allows repeated stretch+resize pairs', () => {
    expect(
      codes([
        op('stretch', 'off'),
        op('resize', '100x'),
        op('stretch', 'fill'),
        op('resize', '50x')
      ])
    ).not.toContain('duplicate-operation')
  })

  it('warns when stretch is not followed by resize or scale_crop', () => {
    const diags = validateOperations([op('preview'), op('stretch', 'off')])
    expect(diags).toContainEqual(
      expect.objectContaining({
        code: 'stretch-without-resize',
        severity: 'warning'
      })
    )
    expect(codes([op('stretch', 'off'), op('resize', '100x')])).not.toContain(
      'stretch-without-resize'
    )
  })

  it('errors when output dimensions exceed the 3000px default ceiling', () => {
    const diags = validateOperations([op('resize', '3200x')])
    expect(diags).toContainEqual(
      expect.objectContaining({
        code: 'dimensions-exceed-limit',
        severity: 'error'
      })
    )
  })

  it('allows up to 5000px when format/jpeg is present', () => {
    expect(codes([op('resize', '4500x'), op('format', 'jpeg')])).not.toContain(
      'dimensions-exceed-limit'
    )
    expect(codes([op('resize', '5200x'), op('format', 'jpeg')])).toContain(
      'dimensions-exceed-limit'
    )
  })

  it('reports unknown operations as info', () => {
    const diags = validateOperations([op('preview'), op('future_op', 'x')])
    expect(diags).toContainEqual(
      expect.objectContaining({
        code: 'unknown-operation',
        severity: 'info',
        opIndex: 1
      })
    )
  })

  it('ignores @-prefixed internal operations', () => {
    expect(codes([op('preview'), op('@clib', 'pkg', '1.0.0')])).not.toContain(
      'unknown-operation'
    )
  })

  describe('video context', () => {
    it('validates thumbs must be last', () => {
      const diags = validateOperations([op('thumbs~5'), op('format', 'webm')], {
        conversion: 'video'
      })
      expect(diags).toContainEqual(
        expect.objectContaining({
          code: 'must-be-last',
          severity: 'error',
          opIndex: 0
        })
      )
    })

    it('errors on video size not divisible by 4', () => {
      const diags = validateOperations([op('size', '722x540')], {
        conversion: 'video'
      })
      expect(diags).toContainEqual(
        expect.objectContaining({
          code: 'video-size-not-divisible-by-4',
          severity: 'error'
        })
      )
    })

    it('reports bare thumb/thumbs (without ~N) as unknown operations', () => {
      expect(codes([op('thumb')], { conversion: 'video' })).toContain(
        'unknown-operation'
      )
      expect(codes([op('thumbs')], { conversion: 'video' })).toContain(
        'unknown-operation'
      )
      expect(codes([op('thumbs~5')], { conversion: 'video' })).not.toContain(
        'unknown-operation'
      )
    })

    it('ignores @-prefixed internal operations in video chains', () => {
      expect(
        codes([op('size', '720x540'), op('@clib', 'pkg', '1.0.0')], {
          conversion: 'video'
        })
      ).not.toContain('unknown-operation')
    })

    it('does not apply image rules to video chains', () => {
      expect(
        codes([op('format', 'webm')], { conversion: 'video' })
      ).not.toContain('no-core-operation')
    })
  })
})
