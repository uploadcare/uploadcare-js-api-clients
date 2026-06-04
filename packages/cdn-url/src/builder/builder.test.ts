import { describe, expect, it } from 'vitest'

import { cropByRatio, preview, quality, resize } from '../ops/index'
import { CdnUrl } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('CdnUrl builder', () => {
  it('constructs from origin and uuid', () => {
    const url = new CdnUrl({ origin: 'https://ucarecdn.com', uuid: UUID })
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

  it('setFilename() sets and clears the filename', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
    expect(url.setFilename('img.png').href).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/img.png`
    )
    expect(url.setFilename('img.png').setFilename(null).href).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/`
    )
  })

  it('setOrigin() rebases the url onto another domain', () => {
    const url = CdnUrl.parse(`https://ucarecdn.com/${UUID}/-/preview/`)
    expect(url.setOrigin('https://1zlmtnsbgr.ucarecd.net').href).toBe(
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
})
