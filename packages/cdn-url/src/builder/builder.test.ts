import { describe, expect, it } from 'vitest'

import { cropByRatio, preview, quality, resize } from '../ops/index'
import { CdnUrl } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('CdnUrl builder', () => {
  it('constructs from cdnBase and uuid', () => {
    const url = new CdnUrl({ cdnBase: 'https://ucarecdn.com', uuid: UUID })
    expect(url.href).toBe(`https://ucarecdn.com/${UUID}/`)
  })

  it('parses an existing url', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/resize/300x/`)
    expect(url.operations).toEqual([{ name: 'resize', params: ['300x'] }])
  })

  it('with() appends operations immutably', () => {
    const base = CdnUrl.parse(`https://ucarecdn.com/${UUID}/`)
    const next = base.with(preview(800, 600), quality('smart'))
    expect(next).not.toBe(base)
    expect(base.operations).toEqual([])
    expect(next.href).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/800x600/-/quality/smart/`
    )
  })

  it('without() removes all occurrences of an operation by name', () => {
    const url = CdnUrl.parse(
      `https://ucarecdn.com/${UUID}/-/resize/300x/-/quality/smart/-/resize/100x/`
    )
    expect(url.without('resize').href).toBe(
      `https://ucarecdn.com/${UUID}/-/quality/smart/`
    )
  })

  it('replace() swaps an operation in place, appending when absent', () => {
    const url = CdnUrl.parse(
      `https://ucarecdn.com/${UUID}/-/resize/300x/-/quality/smart/`
    )
    expect(url.replace(resize({ width: 500 })).href).toBe(
      `https://ucarecdn.com/${UUID}/-/resize/500x/-/quality/smart/`
    )
    expect(
      CdnUrl.parse(`https://ucarecdn.com/${UUID}/`).replace(quality('best'))
        .href
    ).toBe(`https://ucarecdn.com/${UUID}/-/quality/best/`)
  })

  it('filename() sets and clears it', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
    expect(url.filename('img.png').href).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/img.png`
    )
    expect(url.filename('img.png').filename(null).href).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/`
    )
  })

  it('base() rebases the url onto another domain', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
    expect(url.base('https://1zlmtnsbgr.ucarecd.net').href).toBe(
      `https://1zlmtnsbgr.ucarecd.net/${UUID}/-/preview/`
    )
  })

  it('has() and get() inspect operations', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/quality/smart/`)
    expect(url.has('quality')).toBe(true)
    expect(url.get('quality')).toEqual({ name: 'quality', params: ['smart'] })
    expect(url.has('blur')).toBe(false)
    expect(url.get('blur')).toBeNull()
  })

  it('toString() and href agree, toJSON() exposes the parsed shape', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
    expect(String(url)).toBe(url.href)
    expect(url.toJSON()).toMatchObject({ kind: 'file', uuid: UUID })
  })

  it('round-trips group element urls', () => {
    const url = CdnUrl.parse(
      `https://ucarecdn.com/${UUID}~3/nth/1/-/preview/150x150/`
    )
    expect(url.with(quality('smart')).href).toBe(
      `https://ucarecdn.com/${UUID}~3/nth/1/-/preview/150x150/-/quality/smart/`
    )
  })

  describe('operation references', () => {
    it('without() accepts the creator itself', () => {
      const url = CdnUrl.parse(
        `https://ucarecdn.com/${UUID}/-/resize/300x/-/quality/smart/`
      )
      expect(url.without(resize).href).toBe(
        `https://ucarecdn.com/${UUID}/-/quality/smart/`
      )
    })

    it('creator refs resolve aliased operation names (cropByRatio → crop)', () => {
      const url = CdnUrl.parse(
        `https://ucarecdn.com/${UUID}/-/crop/16:9/-/preview/`
      )
      expect(url.without(cropByRatio).href).toBe(
        `https://ucarecdn.com/${UUID}/-/preview/`
      )
      expect(cropByRatio.opName).toBe('crop')
    })

    it('has() and get() accept creator refs', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/quality/smart/`)
      expect(url.has(quality)).toBe(true)
      expect(url.get(quality)).toEqual({ name: 'quality', params: ['smart'] })
      expect(url.has(preview)).toBe(false)
    })

    it('an operation object works as a ref too', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/quality/smart/`)
      expect(url.without(quality('best')).href).toBe(
        `https://ucarecdn.com/${UUID}/`
      )
    })

    it('plain strings keep working', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/quality/smart/`)
      expect(url.without('quality').href).toBe(`https://ucarecdn.com/${UUID}/`)
    })
  })

  describe('getAll()', () => {
    it('collects every match, not just the first', () => {
      const url = CdnUrl.parse(
        `https://ucarecdn.com/${UUID}/-/overlay/${UUID}/50p,50p/-/preview/-/overlay/${UUID}/10p,10p/`
      )
      expect(url.getAll('overlay')).toEqual([
        { name: 'overlay', params: [UUID, '50p,50p'] },
        { name: 'overlay', params: [UUID, '10p,10p'] }
      ])
    })

    it('returns an empty array when nothing matches', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      expect(url.getAll(quality)).toEqual([])
    })

    it('accepts creator refs and resolves aliases', () => {
      const url = CdnUrl.parse(
        `https://ucarecdn.com/${UUID}/-/crop/16:9/-/crop/1:1/`
      )
      expect(url.getAll(cropByRatio)).toHaveLength(2)
    })

    it('is a defensive copy', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      url.getAll('preview').length = 0
      expect(url.operations).toHaveLength(1)
    })
  })

  describe('replace() with counted suffixes', () => {
    it('replaces thumbs~5 with thumbs~3 instead of appending', async () => {
      const { thumbs } = await import('../video/index')
      const url = new CdnUrl({
        cdnBase: 'https://ucarecdn.com',
        uuid: UUID,
        operations: [thumbs(5)]
      })
      expect(url.replace(thumbs(3)).operations).toEqual([
        { name: 'thumbs~3', params: [] }
      ])
    })
  })

  describe('updateOperations()', () => {
    const overlays = `https://ucarecdn.com/${UUID}/-/overlay/${UUID}/50p,50p/-/preview/-/overlay/${UUID}/10p,10p/-/overlay/${UUID}/90p,90p/`

    it('replaces the nth match, keeping position', () => {
      const url = CdnUrl.parse(overlays)
      const next = { name: 'overlay', params: [UUID, '1p,1p'] }
      let seen = -1
      const out = url.updateOperations((ops) =>
        ops.map((op) => (op.name === 'overlay' && ++seen === 1 ? next : op))
      )
      expect(out.operations.map((op) => op.params[1])).toEqual([
        '50p,50p',
        undefined,
        '1p,1p',
        '90p,90p'
      ])
    })

    it('supports insert-at, reorder and filter in one primitive', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      expect(
        url.updateOperations((ops) => [quality('smart'), ...ops]).operations
      ).toEqual([
        { name: 'quality', params: ['smart'] },
        { name: 'preview', params: [] }
      ])
      expect(
        CdnUrl.parse(overlays)
          .updateOperations((ops) => ops.reverse())
          .operations.map((op) => op.name)
      ).toEqual(['overlay', 'overlay', 'preview', 'overlay'])
    })

    it('hands the callback a defensive copy', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      url.updateOperations((ops) => {
        ops.push(quality('smart'))
        return ops
      })
      expect(url.operations).toEqual([{ name: 'preview', params: [] }])
    })

    it('is immutable and returns a new instance', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      const out = url.updateOperations((ops) => [...ops, quality('best')])
      expect(out).not.toBe(url)
      expect(url.operations).toHaveLength(1)
      expect(out.href).toBe(
        `https://ucarecdn.com/${UUID}/-/preview/-/quality/best/`
      )
    })

    it('rejects a callback that does not return an array', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      // a block-bodied arrow with no `return` is the common slip
      expect(() =>
        // @ts-expect-error deliberately wrong callback shape
        url.updateOperations((ops) => {
          ops.push(quality('smart'))
        })
      ).toThrow(TypeError)
    })

    it('rejects a callback that does not return an array', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      // a block-bodied arrow that forgets to return is the common slip
      expect(() =>
        // @ts-expect-error deliberately wrong callback shape
        url.updateOperations((ops) => {
          ops.push(quality('smart'))
        })
      ).toThrow(TypeError)
    })

    it('throws on group root urls, which carry no operations', () => {
      const root = CdnUrl.parse(`https://ucarecdn.com/${UUID}~3/`)
      expect(() => root.updateOperations((ops) => ops)).toThrow(TypeError)
    })

    it('is the primitive the other mutators are sugar over', () => {
      const url = CdnUrl.parse(overlays)
      expect(
        url.updateOperations((ops) => ops.filter((op) => op.name !== 'overlay'))
          .href
      ).toBe(url.without('overlay').href)
    })
  })

  describe('replaceAll()', () => {
    it('collapses every match into one, at the first match position', () => {
      const url = CdnUrl.parse(
        `https://ucarecdn.com/${UUID}/-/overlay/${UUID}/50p,50p/-/preview/-/overlay/${UUID}/10p,10p/`
      )
      expect(url.replaceAll(quality('smart')).operations).toEqual([
        { name: 'overlay', params: [UUID, '50p,50p'] },
        { name: 'preview', params: [] },
        { name: 'overlay', params: [UUID, '10p,10p'] },
        { name: 'quality', params: ['smart'] }
      ])
      expect(
        url.replaceAll({ name: 'overlay', params: [UUID] }).operations
      ).toEqual([
        { name: 'overlay', params: [UUID] },
        { name: 'preview', params: [] }
      ])
    })

    it('appends when nothing matches', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      expect(url.replaceAll(quality('best')).href).toBe(
        `https://ucarecdn.com/${UUID}/-/preview/-/quality/best/`
      )
    })

    it('leaves the original untouched', () => {
      const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
      url.replaceAll(quality('best'))
      expect(url.operations).toEqual([{ name: 'preview', params: [] }])
    })
  })
})
