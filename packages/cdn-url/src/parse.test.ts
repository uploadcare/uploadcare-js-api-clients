import { describe, expect, it } from 'vitest'

import {
  isFileUrl,
  isGroupElementUrl,
  isGroupUrl,
  isProxyUrl,
  parseCdnUrl,
  parseFileUrl,
  parseGroupElementUrl,
  parseGroupUrl,
  parseOperations,
  parseProxyUrl,
  serializeCdnUrl,
  serializeOperations
} from './index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

describe('parseCdnUrl', () => {
  describe('plain file urls', () => {
    it('parses a bare file url on the legacy domain', () => {
      const parsed = parseCdnUrl(`https://ucarecdn.com/${UUID}/`)
      expect(parsed).toEqual({
        kind: 'file',
        cdnBase: 'https://ucarecdn.com',
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
      expect(parsed.cdnBase).toBe('https://1zlmtnsbgr.ucarecd.net')
      expect(parsed).toMatchObject({ kind: 'file', uuid: UUID })
    })

    it('parses custom domains', () => {
      const parsed = parseCdnUrl(`https://cdn.example.com/${UUID}/`)
      expect(parsed.cdnBase).toBe('https://cdn.example.com')
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
        cdnBase: 'https://ucarecdn.com',
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
        cdnBase: 'https://ucarecdn.com',
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
        cdnBase: 'https://pubkey.ucr.io',
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

  // CHANGED (was: threw a TypeError). The leading `-` marker is now optional,
  // so a bare chain is accepted — and since the parser never rejects unknown
  // operation names, `foo/bar` is an unknown operation rather than an error.
  it('accepts a chain that omits the leading marker', () => {
    expect(parseOperations('foo/bar')).toEqual([
      { name: 'foo', params: ['bar'] }
    ])
  })

  it('parses a marker-less chain of several operations', () => {
    // Operations are still `-`-separated, so this stays unambiguous: `blur` is
    // a second operation, not a third param of `resize`.
    expect(parseOperations('resize/300x/-/blur/10')).toEqual([
      { name: 'resize', params: ['300x'] },
      { name: 'blur', params: ['10'] }
    ])
  })

  it.each([
    ['bare, no delimiters', 'resize/300x'],
    ['leading slash, no marker', '/resize/300x/'],
    ['marker, no trailing slash', '-/resize/300x'],
    ['surrounding whitespace', '  -/resize/300x/  '],
    ['whitespace around a bare chain', ' resize/300x ']
  ])('normalises %s', (_label, modifiers) => {
    expect(parseOperations(modifiers)).toEqual([
      { name: 'resize', params: ['300x'] }
    ])
  })

  it('returns an empty list for a whitespace-only string', () => {
    expect(parseOperations('   ')).toEqual([])
  })

  it.each([
    ['a lone marker', '-'],
    ['a marker with no name', '-/-/resize/300x']
  ])('still throws a TypeError for %s', (_label, modifiers) => {
    expect(() => parseOperations(modifiers)).toThrow(TypeError)
  })

  it('keeps the url parsers strict about the marker', () => {
    // The leniency above is local to `parseOperations`. A non-`-` segment after
    // the uuid is a filename, not an operation, and garbage after it still throws.
    expect(parseCdnUrl(`https://ucarecdn.com/${UUID}/photo.jpg`)).toMatchObject(
      {
        filename: 'photo.jpg',
        operations: []
      }
    )
    expect(() => parseCdnUrl(`https://ucarecdn.com/${UUID}/a/b/`)).toThrow(
      TypeError
    )
  })
})

describe('per-kind parsers', () => {
  const FILE = `https://ucarecdn.com/${UUID}/-/resize/300x/photo.jpg`
  const GROUP = `https://ucarecdn.com/${UUID}~3/`
  const ELEMENT = `https://ucarecdn.com/${UUID}~3/nth/1/-/preview/150x150/`
  const PROXY = 'https://pk.ucr.io/-/preview/https://example.com/a.jpg'

  describe('parseFileUrl', () => {
    it('returns the file shape already narrowed, no kind check needed', () => {
      const file = parseFileUrl(FILE)
      // Type-level: uuid is reachable without narrowing.
      const uuid: string = file.uuid
      expect(uuid).toBe(UUID)
      expect(file).toEqual({
        kind: 'file',
        cdnBase: 'https://ucarecdn.com',
        uuid: UUID,
        conversion: null,
        operations: [{ name: 'resize', params: ['300x'] }],
        filename: 'photo.jpg',
        search: '',
        hash: ''
      })
    })

    it('reads conversion prefixes, query and hash like parseCdnUrl does', () => {
      expect(parseFileUrl(`https://ucarecdn.com/${UUID}/video/?a=1#f`)).toEqual(
        {
          kind: 'file',
          cdnBase: 'https://ucarecdn.com',
          uuid: UUID,
          conversion: 'video',
          operations: [],
          filename: null,
          search: '?a=1',
          hash: '#f'
        }
      )
    })

    it('rejects the other kinds rather than mis-parsing them', () => {
      expect(() => parseFileUrl(GROUP)).toThrow(TypeError)
      expect(() => parseFileUrl(ELEMENT)).toThrow(TypeError)
      expect(() => parseFileUrl(PROXY)).toThrow(TypeError)
      expect(() => parseFileUrl('not-a-url')).toThrow(TypeError)
      expect(() => parseFileUrl('https://ucarecdn.com/')).toThrow(TypeError)
    })
  })

  describe('parseGroupUrl', () => {
    it('returns the group root shape', () => {
      expect(parseGroupUrl(GROUP)).toEqual({
        kind: 'group',
        cdnBase: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 3 },
        search: '',
        hash: ''
      })
    })

    it('rejects element, file and proxy urls', () => {
      expect(() => parseGroupUrl(ELEMENT)).toThrow(TypeError)
      expect(() => parseGroupUrl(FILE)).toThrow(TypeError)
      expect(() => parseGroupUrl(PROXY)).toThrow(TypeError)
    })
  })

  describe('parseGroupElementUrl', () => {
    it('returns the element shape', () => {
      expect(parseGroupElementUrl(ELEMENT)).toEqual({
        kind: 'group-element',
        cdnBase: 'https://ucarecdn.com',
        group: { uuid: UUID, count: 3 },
        nth: 1,
        operations: [{ name: 'preview', params: ['150x150'] }],
        filename: null,
        search: '',
        hash: ''
      })
    })

    it('rejects a group root, which has no nth segment', () => {
      expect(() => parseGroupElementUrl(GROUP)).toThrow(TypeError)
      expect(() => parseGroupElementUrl(FILE)).toThrow(TypeError)
    })
  })

  describe('parseProxyUrl', () => {
    it('returns the proxy shape with the source url intact', () => {
      expect(parseProxyUrl(PROXY)).toEqual({
        kind: 'proxy',
        cdnBase: 'https://pk.ucr.io',
        operations: [{ name: 'preview', params: [] }],
        sourceUrl: 'https://example.com/a.jpg'
      })
    })

    it('keeps the query string with the embedded source', () => {
      const parsed = parseProxyUrl(
        'https://pk.ucr.io/https://example.com/a.jpg?v=2'
      )
      expect(parsed.sourceUrl).toBe('https://example.com/a.jpg?v=2')
    })

    it('rejects urls with no embedded source', () => {
      expect(() => parseProxyUrl(FILE)).toThrow(TypeError)
      expect(() => parseProxyUrl(GROUP)).toThrow(TypeError)
    })
  })

  describe('agreement with parseCdnUrl', () => {
    it('every per-kind parser matches the all-kinds parser exactly', () => {
      expect(parseFileUrl(FILE)).toEqual(parseCdnUrl(FILE))
      expect(parseGroupUrl(GROUP)).toEqual(parseCdnUrl(GROUP))
      expect(parseGroupElementUrl(ELEMENT)).toEqual(parseCdnUrl(ELEMENT))
      expect(parseProxyUrl(PROXY)).toEqual(parseCdnUrl(PROXY))
    })

    it('round-trips through serializeCdnUrl like parseCdnUrl does', () => {
      for (const url of [FILE, GROUP, ELEMENT, PROXY]) {
        expect(serializeCdnUrl(parseCdnUrl(url))).toBe(url)
      }
      expect(serializeCdnUrl(parseFileUrl(FILE))).toBe(FILE)
      expect(serializeCdnUrl(parseGroupUrl(GROUP))).toBe(GROUP)
      expect(serializeCdnUrl(parseGroupElementUrl(ELEMENT))).toBe(ELEMENT)
      expect(serializeCdnUrl(parseProxyUrl(PROXY))).toBe(PROXY)
    })
  })

  describe('guards', () => {
    it('classify a url string without throwing', () => {
      expect(isFileUrl(FILE)).toBe(true)
      expect(isGroupUrl(GROUP)).toBe(true)
      expect(isGroupElementUrl(ELEMENT)).toBe(true)
      expect(isProxyUrl(PROXY)).toBe(true)
    })

    it('are mutually exclusive across the four kinds', () => {
      const guards = { isFileUrl, isGroupUrl, isGroupElementUrl, isProxyUrl }
      for (const [url, expected] of [
        [FILE, 'isFileUrl'],
        [GROUP, 'isGroupUrl'],
        [ELEMENT, 'isGroupElementUrl'],
        [PROXY, 'isProxyUrl']
      ] as const) {
        for (const [name, guard] of Object.entries(guards)) {
          expect([name, guard(url)]).toEqual([name, name === expected])
        }
      }
    })

    it('return false rather than throwing on junk', () => {
      for (const junk of [
        'not-a-url',
        '',
        'https://ucarecdn.com/',
        'https://example.com/x'
      ]) {
        expect(isFileUrl(junk)).toBe(false)
        expect(isGroupUrl(junk)).toBe(false)
        expect(isGroupElementUrl(junk)).toBe(false)
        expect(isProxyUrl(junk)).toBe(false)
      }
    })

    it('a passing guard means the matching parser succeeds', () => {
      for (const url of [FILE, GROUP, ELEMENT, PROXY]) {
        if (isFileUrl(url)) expect(() => parseFileUrl(url)).not.toThrow()
        if (isGroupUrl(url)) expect(() => parseGroupUrl(url)).not.toThrow()
        if (isGroupElementUrl(url))
          expect(() => parseGroupElementUrl(url)).not.toThrow()
        if (isProxyUrl(url)) expect(() => parseProxyUrl(url)).not.toThrow()
      }
    })
  })
})
