import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import type { CdnUrlInput } from './types'
import {
  parseCdnUrl,
  serializeCdnUrl,
  serializeFileUrl,
  serializeGroupUrl,
  serializeOperations,
  serializeProxyUrl
} from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const CDN_BASE = 'https://ucarecdn.com'

describe('serializeOperations', () => {
  it('serializes operations into a -/-delimited string', () => {
    expect(
      serializeOperations([
        { name: 'preview', params: ['100x100'] },
        { name: 'quality', params: ['smart'] }
      ])
    ).toBe('-/preview/100x100/-/quality/smart/')
  })

  it('returns an empty string for no operations', () => {
    expect(serializeOperations([])).toBe('')
  })

  it('serializes no-param operations', () => {
    expect(serializeOperations([{ name: 'grayscale', params: [] }])).toBe(
      '-/grayscale/'
    )
  })
})

describe('serializeCdnUrl', () => {
  it('builds a minimal file url', () => {
    expect(
      serializeCdnUrl({ cdnBase: 'https://ucarecdn.com', uuid: UUID })
    ).toBe(`https://ucarecdn.com/${UUID}/`)
  })

  it('builds a file url with operations and filename', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://ucarecdn.com',
        uuid: UUID,
        operations: [
          { name: 'preview', params: ['150x150'] },
          { name: 'enhance', params: ['25'] }
        ],
        filename: '2.jpeg'
      })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/150x150/-/enhance/25/2.jpeg`)
  })

  it('normalizes trailing slash in cdnBase', () => {
    expect(
      serializeCdnUrl({ cdnBase: 'https://ucarecdn.com/', uuid: UUID })
    ).toBe(`https://ucarecdn.com/${UUID}/`)
  })

  it('builds group urls', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 11 }
      })
    ).toBe(`https://ucarecdn.com/${UUID}~11/`)
  })

  it('builds group element urls with operations', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 3 },
        nth: 1,
        operations: [{ name: 'resize', params: ['256x'] }]
      })
    ).toBe(`https://ucarecdn.com/${UUID}~3/nth/1/-/resize/256x/`)
  })

  it('builds conversion urls without -/ after the uuid', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://ucarecdn.com',
        uuid: UUID,
        conversion: 'video',
        operations: [{ name: 'size', params: ['720x540'] }]
      })
    ).toBe(`https://ucarecdn.com/${UUID}/video/-/size/720x540/`)
  })

  it('builds proxy urls with embedded source', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://pubkey.ucr.io',
        sourceUrl: 'https://example.com/image.jpg?q=1',
        operations: [{ name: 'resize', params: ['500x'] }]
      })
    ).toBe(
      'https://pubkey.ucr.io/-/resize/500x/https://example.com/image.jpg?q=1'
    )
  })

  it('appends preserved query and hash', () => {
    expect(
      serializeCdnUrl({
        cdnBase: 'https://cdn.example.com',
        uuid: UUID,
        operations: [{ name: 'preview', params: [] }],
        search: '?token=exp=1~hmac=x',
        hash: '#frag'
      })
    ).toBe(`https://cdn.example.com/${UUID}/-/preview/?token=exp=1~hmac=x#frag`)
  })

  it('throws when neither uuid, group nor sourceUrl is given', () => {
    // @ts-expect-error the input union requires an addressing field
    expect(() => serializeCdnUrl({ cdnBase: 'https://ucarecdn.com' })).toThrow(
      TypeError
    )
  })

  describe('round-trips', () => {
    const urls = [
      `https://ucarecdn.com/${UUID}/`,
      `https://ucarecdn.com/${UUID}/-/preview/150x150/-/enhance/25/-/sharp/2.jpeg`,
      `https://1zlmtnsbgr.ucarecd.net/${UUID}/-/scale_crop/36x36/center/`,
      `https://ucarecdn.com/${UUID}~3/nth/2/-/preview/150x150/`,
      `https://ucarecdn.com/${UUID}/gif2video/-/size/1200x/-/format/webm/`,
      `https://ucarecdn.com/${UUID}/video/-/size/720x540/-/thumbs~20/3/`,
      'https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/image.jpg',
      `https://cdn.example.com/${UUID}/-/scale_crop/36x36/center/?token=exp=1728524457~hmac=b79f`
    ]

    for (const url of urls) {
      it(`round-trips ${url}`, () => {
        expect(serializeCdnUrl(parseCdnUrl(url))).toBe(url)
      })
    }

    /**
     * The per-kind serializers exist so a caller that only builds one kind can drop
     * the other branches. That is only safe if they agree with the dispatcher on
     * every url it accepts, so the same corpus runs through them, routed by kind.
     */
    for (const url of urls) {
      it(`round-trips ${url} through its per-kind serializer`, () => {
        const parsed = parseCdnUrl(url)
        let serialized: string
        if (parsed.kind === 'proxy') {
          serialized = serializeProxyUrl(parsed)
        } else if (parsed.kind === 'file') {
          serialized = serializeFileUrl(parsed)
        } else {
          serialized = serializeGroupUrl(parsed)
        }
        expect(serialized).toBe(url)
        expect(serialized).toBe(serializeCdnUrl(parsed))
      })
    }
  })

  describe('per-kind serializers', () => {
    it('builds a file url, tolerating a trailing slash on the cdnBase', () => {
      expect(
        serializeFileUrl({ cdnBase: 'https://ucarecdn.com/', uuid: UUID })
      ).toBe(`https://ucarecdn.com/${UUID}/`)
    })

    it('builds a group root url with no operations', () => {
      // A group root addresses the whole group, so operations do not apply without
      // an element index — passing them is a no-op rather than an error.
      expect(
        serializeGroupUrl({
          cdnBase: 'https://ucarecdn.com',
          group: { uuid: UUID, count: 3 },
          operations: [{ name: 'preview', params: [] }]
        })
      ).toBe(`https://ucarecdn.com/${UUID}~3/`)
    })

    it('builds a group element url with operations and a filename', () => {
      expect(
        serializeGroupUrl({
          cdnBase: 'https://ucarecdn.com',
          group: { uuid: UUID, count: 3 },
          nth: 0,
          operations: [{ name: 'preview', params: ['150x150'] }],
          filename: 'photo.jpg'
        })
      ).toBe(`https://ucarecdn.com/${UUID}~3/nth/0/-/preview/150x150/photo.jpg`)
    })

    it('embeds the proxy source after the operations, verbatim', () => {
      expect(
        serializeProxyUrl({
          cdnBase: 'https://pubkey.ucr.io',
          sourceUrl: 'https://example.com/a.jpg?v=2',
          operations: [{ name: 'resize', params: ['500x'] }]
        })
      ).toBe(
        'https://pubkey.ucr.io/-/resize/500x/https://example.com/a.jpg?v=2'
      )
    })

    it('keeps the conversion prefix ahead of the operations on a file url', () => {
      expect(
        serializeFileUrl({
          cdnBase: 'https://ucarecdn.com',
          uuid: UUID,
          conversion: 'video',
          operations: [{ name: 'size', params: ['720x540'] }]
        })
      ).toBe(`https://ucarecdn.com/${UUID}/video/-/size/720x540/`)
    })
  })
})

describe('one owner for "which kind is this input?"', () => {
  // The serializer and the builder used to discriminate `CdnUrlInput`
  // separately, with different rules: a key present but `undefined` counted as
  // intent for one and not the other, so this input produced a file url through
  // `serializeCdnUrl` and a `TypeError` through `new CdnUrl(...)`.
  const cases: CdnUrlInput[] = [
    { cdnBase: CDN_BASE, uuid: UUID, sourceUrl: undefined },
    { cdnBase: CDN_BASE, uuid: UUID, group: undefined },
    { cdnBase: CDN_BASE, group: { uuid: UUID, count: 3 }, uuid: undefined },
    {
      cdnBase: CDN_BASE,
      sourceUrl: 'https://example.com/a.jpg',
      uuid: undefined
    }
  ]

  it.each(cases)('the two facades agree on %j', (input) => {
    const viaCore = (() => {
      try {
        return serializeCdnUrl(input)
      } catch {
        return 'throws'
      }
    })()
    const viaBuilder = (() => {
      try {
        return new CdnUrl(input).href
      } catch {
        return 'throws'
      }
    })()
    expect(viaBuilder).toBe(viaCore)
  })

  it('an input with no addressing value at all throws in both', () => {
    const empty: CdnUrlInput = { cdnBase: CDN_BASE, uuid: undefined }
    expect(() => serializeCdnUrl(empty)).toThrow(TypeError)
    expect(() => new CdnUrl(empty)).toThrow(TypeError)
  })
})
