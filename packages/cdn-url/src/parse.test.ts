import { describe, expect, it } from 'vitest'

import { parseCdnUrl, parseOperations, serializeOperations } from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('parseCdnUrl', () => {
  describe('plain file urls', () => {
    it('parses a bare file url on the legacy domain', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/`)
      expect(parsed).toEqual({
        kind: 'file',
        origin: 'https://ucarecdn.com',
        uuid: UUID,
        conversion: null,
        operations: [],
        filename: null,
        search: '',
        hash: ''
      })
    })

    it('narrows by the kind discriminant', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/`)
      // Type-level check: uuid is only reachable after narrowing to 'file'.
      if (parsed.kind === 'file') {
        const uuid: string = parsed.uuid
        expect(uuid).toBe(UUID)
      } else {
        expect.unreachable('expected a file url')
      }
    })

    it('parses prefixed ucarecd.net domains', () => {
      const parsed = parseCdnUrl(`https://1zlmtnsbgr.ucarecd.net/${UUID}/`)
      expect(parsed.origin).toBe('https://1zlmtnsbgr.ucarecd.net')
      expect(parsed).toMatchObject({ kind: 'file', uuid: UUID })
    })

    it('parses custom domains', () => {
      const parsed = parseCdnUrl(`https://cdn.example.com/${UUID}/`)
      expect(parsed.origin).toBe('https://cdn.example.com')
      expect(parsed).toMatchObject({ kind: 'file', uuid: UUID })
    })

    it('tolerates a missing trailing slash', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}`)
      expect(parsed).toMatchObject({ kind: 'file', uuid: UUID, operations: [] })
    })

    it('throws a TypeError on urls without uuid, group or proxy source', () => {
      expect(() => parseCdnUrl('https://ucarecdn.com/')).toThrow(TypeError)
      expect(() => parseCdnUrl('not a url')).toThrow(TypeError)
    })
  })

  describe('operations', () => {
    it('parses a single operation with params', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/-/resize/300x/`)
      expect(parsed).toMatchObject({
        operations: [{ name: 'resize', params: ['300x'] }]
      })
    })

    it('parses chained operations preserving order', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/-/preview/1000x400/-/format/auto/-/quality/smart_retina/`
      )
      expect(parsed).toMatchObject({
        operations: [
          { name: 'preview', params: ['1000x400'] },
          { name: 'format', params: ['auto'] },
          { name: 'quality', params: ['smart_retina'] }
        ]
      })
    })

    it('parses no-param operations', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/-/grayscale/-/mirror/`
      )
      expect(parsed).toMatchObject({
        operations: [
          { name: 'grayscale', params: [] },
          { name: 'mirror', params: [] }
        ]
      })
    })

    it('parses multi-param operations', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/-/scale_crop/100x100/center/`
      )
      expect(parsed).toMatchObject({
        operations: [{ name: 'scale_crop', params: ['100x100', 'center'] }]
      })
    })

    it('preserves unknown and internal @-operations (lenient parsing)', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/-/@clib/uc-blocks/0.1.0/uc-img/-/future_op/whatever/`
      )
      expect(parsed).toMatchObject({
        operations: [
          { name: '@clib', params: ['uc-blocks', '0.1.0', 'uc-img'] },
          { name: 'future_op', params: ['whatever'] }
        ]
      })
    })
  })

  describe('filename', () => {
    it('extracts a trailing filename after operations', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/-/preview/150x150/-/sharp/photo.jpeg`
      )
      expect(parsed).toMatchObject({
        filename: 'photo.jpeg',
        operations: [
          { name: 'preview', params: ['150x150'] },
          { name: 'sharp', params: [] }
        ]
      })
    })

    it('extracts a filename without operations', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/vercel.png`)
      expect(parsed).toMatchObject({ filename: 'vercel.png', operations: [] })
    })
  })

  describe('query and hash', () => {
    it('preserves secure token query strings', () => {
      const parsed = parseCdnUrl(
        `https://cdn.example.com/${UUID}/-/preview/?token=exp=1728524457~hmac=abc123`
      )
      expect(parsed).toMatchObject({
        search: '?token=exp=1728524457~hmac=abc123',
        operations: [{ name: 'preview', params: [] }]
      })
    })

    it('preserves hash fragments', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/#frag`)
      expect(parsed).toMatchObject({ hash: '#frag' })
    })
  })

  describe('groups', () => {
    it('parses a group url into the narrow group shape', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}~11/`)
      expect(parsed).toEqual({
        kind: 'group',
        origin: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 11 },
        search: '',
        hash: ''
      })
      // Group root urls carry no operations — the shape does not even have them.
      if (parsed.kind === 'group') {
        // @ts-expect-error operations do not exist on group root urls
        void parsed.operations
      }
    })

    it('parses a group element accessed via nth', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}~3/nth/2/-/preview/150x150/`
      )
      expect(parsed).toEqual({
        kind: 'group-element',
        origin: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 3 },
        nth: 2,
        operations: [{ name: 'preview', params: ['150x150'] }],
        filename: null,
        search: '',
        hash: ''
      })
    })

    it('parses a group element with filename', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}~3/nth/0/photo.jpg`
      )
      expect(parsed).toMatchObject({
        kind: 'group-element',
        nth: 0,
        filename: 'photo.jpg'
      })
    })
  })

  describe('conversion paths', () => {
    it('parses video conversion urls (no -/ after uuid)', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/video/-/size/720x540/-/format/webm/`
      )
      expect(parsed).toMatchObject({
        kind: 'file',
        conversion: 'video',
        operations: [
          { name: 'size', params: ['720x540'] },
          { name: 'format', params: ['webm'] }
        ]
      })
    })

    it('parses gif2video urls', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/gif2video/-/format/mp4/file.mp4`
      )
      expect(parsed).toMatchObject({
        conversion: 'gif2video',
        operations: [{ name: 'format', params: ['mp4'] }],
        filename: 'file.mp4'
      })
    })

    it('parses document conversion urls', () => {
      const parsed = parseCdnUrl(
        `https://ucarecdn.com/${UUID}/document/-/format/pdf/`
      )
      expect(parsed).toMatchObject({
        conversion: 'document',
        operations: [{ name: 'format', params: ['pdf'] }]
      })
    })

    it('parses a bare video conversion url without operations', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/video/`)
      expect(parsed).toMatchObject({ conversion: 'video', operations: [] })
    })
  })

  describe('proxy urls', () => {
    it('parses a proxified remote source url into the narrow proxy shape', () => {
      const parsed = parseCdnUrl(
        'https://pubkey.ucr.io/https://example.com/image.jpg?q=1#h'
      )
      expect(parsed).toEqual({
        kind: 'proxy',
        origin: 'https://pubkey.ucr.io',
        operations: [],
        sourceUrl: 'https://example.com/image.jpg?q=1#h'
      })
      // Proxy urls have no uuid — the shape does not even have it.
      if (parsed.kind === 'proxy') {
        // @ts-expect-error uuid does not exist on proxy urls
        void parsed.uuid
      }
    })

    it('parses a proxified url with operations before the source', () => {
      const parsed = parseCdnUrl(
        'https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/image.jpg'
      )
      expect(parsed).toMatchObject({
        kind: 'proxy',
        operations: [
          { name: 'preview', params: [] },
          { name: 'resize', params: ['500x'] }
        ],
        sourceUrl: 'https://example.com/image.jpg'
      })
    })

    it('detects proxy by embedded source even on custom domains', () => {
      const parsed = parseCdnUrl(
        'https://proxy.example.com/-/resize/100x/https://site.com/a.png'
      )
      expect(parsed).toMatchObject({
        kind: 'proxy',
        sourceUrl: 'https://site.com/a.png'
      })
    })
  })
})

describe('parseOperations', () => {
  it('parses a bare modifiers string', () => {
    expect(parseOperations('-/crop/640x480/center/-/preview/')).toEqual([
      { name: 'crop', params: ['640x480', 'center'] },
      { name: 'preview', params: [] }
    ])
  })

  it('tolerates leading slash and missing trailing slash', () => {
    expect(parseOperations('/-/resize/300x')).toEqual([
      { name: 'resize', params: ['300x'] }
    ])
  })

  it('returns an empty list for an empty string', () => {
    expect(parseOperations('')).toEqual([])
  })

  it('round-trips with serializeOperations', () => {
    const modifiers = '-/scale_crop/100x100/center/-/quality/smart/'
    expect(serializeOperations(parseOperations(modifiers))).toBe(modifiers)
  })

  it('throws a TypeError on strings that are not operation chains', () => {
    expect(() => parseOperations('foo/bar')).toThrow(TypeError)
  })
})
