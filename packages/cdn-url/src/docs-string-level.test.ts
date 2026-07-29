/**
 * Executes the snippets on the "String-level API" guide page, so the page cannot
 * claim an output the code does not produce. Mirrors them verbatim.
 */
import { describe, expect, it } from 'vitest'

import { parseFileUrl, parseOperations, serializeOperations } from './index'
import {
  joinModifiers,
  modifiers,
  normalizeModifiers,
  tinyBuild,
  tinyParse
} from './tiny/index'

const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const width = 300

describe('Writing a chain', () => {
  it('joins typed literals', () => {
    expect(modifiers('resize/300x', 'blur/10')).toBe('-/resize/300x/-/blur/10/')
    expect(modifiers()).toBe('')
  })

  it('checks interpolation passed as an argument', () => {
    expect(modifiers(`resize/${width}x`)).toBe('-/resize/300x/')
    // @ts-expect-error not assignable to OperationLiteral
    void modifiers('rezise/300x')
    // @ts-expect-error 'gif' is not a delivery format
    void modifiers('format/gif')
  })

  /**
   * The page claims a template literal in argument position stays checked. That
   * holds for a numeric hole because the union carries `resize/${number}x` — but
   * not for a slot whose union is an enum, where only a literal will do. Pinned
   * because the distinction decides whether a caller needs the /ops creators.
   */
  it('checks a numeric hole, but not a string hole in an enum slot', () => {
    const fromForm: number = Number('300')
    expect(modifiers(`resize/${fromForm}x`)).toBe('-/resize/300x/')
    expect(modifiers(`resize/${fromForm * 2}x`)).toBe('-/resize/600x/')

    const fromConfig: string = 'auto'
    // @ts-expect-error a string-typed hole cannot satisfy `format/${Format}`
    void modifiers(`format/${fromConfig}`)
  })

  it('splits a url with no operations', () => {
    expect(tinyParse(`https://ucarecdn.com/${UUID}/photo.jpg`).modifiers).toBe(
      ''
    )
  })

  it('normalizes values that arrive as strings', () => {
    expect(normalizeModifiers('resize/100x')).toBe('-/resize/100x/')
    expect(normalizeModifiers('-/resize/100x')).toBe('-/resize/100x/')
    expect(normalizeModifiers('/resize/100x/')).toBe('-/resize/100x/')
    expect(normalizeModifiers('resize/300x/-/blur/10')).toBe(
      '-/resize/300x/-/blur/10/'
    )
    expect(normalizeModifiers('  -/resize/100x/  ')).toBe('-/resize/100x/')
    expect(normalizeModifiers('')).toBe('')
  })

  it('appends with joinModifiers', () => {
    const base = modifiers('preview')
    expect(joinModifiers(base, modifiers('resize/300x'))).toBe(
      '-/preview/-/resize/300x/'
    )
  })
})

describe('Splitting and rebuilding a URL', () => {
  it('cuts a url into named strings', () => {
    expect(
      tinyParse(`https://ucarecdn.com/${UUID}/-/resize/300x/photo.jpg`)
    ).toEqual({
      origin: 'https://ucarecdn.com',
      uuid: UUID,
      modifiers: '-/resize/300x/',
      filename: 'photo.jpg',
      search: '',
      hash: ''
    })
  })

  it('keeps a secure-delivery token in search, not in filename', () => {
    const { filename, search } = tinyParse(
      `https://cdn.example.com/${UUID}/-/preview/?token=exp=1728524457~hmac=b79f`
    )
    expect(filename).toBe('')
    expect(search).toBe('?token=exp=1728524457~hmac=b79f')
  })

  it('builds a url from scratch, with every optional field omitted', () => {
    expect(tinyBuild({ origin: 'https://ucarecdn.com', uuid: UUID })).toBe(
      `https://ucarecdn.com/${UUID}/`
    )
    expect(
      tinyBuild({
        origin: 'https://ucarecdn.com',
        uuid: UUID,
        modifiers: modifiers('preview/800x600')
      })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/800x600/`)
  })

  it('edits by replacing one field', () => {
    const stored = `https://ucarecdn.com/${UUID}/-/preview/photo.jpg`
    const parts = tinyParse(stored)

    expect(
      tinyBuild({
        ...parts,
        modifiers: joinModifiers(parts.modifiers, modifiers('blur/10'))
      })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/-/blur/10/photo.jpg`)

    expect(
      tinyBuild({ ...parts, modifiers: modifiers('preview/800x600') })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/800x600/photo.jpg`)

    // the page strips by omitting the optional field
    expect(tinyBuild({ ...parts, modifiers: undefined })).toBe(
      `https://ucarecdn.com/${UUID}/photo.jpg`
    )
    expect(tinyBuild({ ...parts, modifiers: modifiers() })).toBe(
      `https://ucarecdn.com/${UUID}/photo.jpg`
    )
  })

  it('round-trips every url the full parser accepts', () => {
    const urls = [
      `https://ucarecdn.com/${UUID}/`,
      `https://ucarecdn.com/${UUID}/-/preview/150x150/-/enhance/25/photo.jpeg`,
      `https://ucarecdn.com/${UUID}~3/nth/2/-/preview/150x150/`,
      `https://ucarecdn.com/${UUID}/gif2video/-/format/webm/`,
      'https://pubkey.ucr.io/-/preview/https://example.com/image.jpg',
      `https://cdn.example.com/${UUID}/-/preview/?token=exp=1~hmac=b79f`
    ]
    for (const url of urls) {
      expect(tinyBuild(tinyParse(url))).toBe(url)
    }
  })
})

describe('File urls only', () => {
  // The contract is single-file delivery urls. These rows are the shapes the page
  // documents; the fields are only meaningful for these.
  const rows: [url: string, chain: string, filename: string, search: string][] =
    [
      [
        `https://ucarecdn.com/${UUID}/-/preview/photo.jpg`,
        '-/preview/',
        'photo.jpg',
        ''
      ],
      [`https://ucarecdn.com/${UUID}/photo.jpg`, '', 'photo.jpg', ''],
      [`https://ucarecdn.com/${UUID}/`, '', '', ''],
      [
        `https://ucarecdn.com/${UUID}/-/preview/?token=exp=1~hmac=b79f`,
        '-/preview/',
        '',
        '?token=exp=1~hmac=b79f'
      ]
    ]

  for (const [url, chain, filename, search] of rows) {
    it(`splits ${url} as documented, and round-trips it`, () => {
      const parts = tinyParse(url)
      expect(parts.uuid).toBe(UUID)
      expect(parts.modifiers).toBe(chain)
      expect(parts.filename).toBe(filename)
      expect(parts.search).toBe(search)
      expect(tinyBuild(parts)).toBe(url)
    })
  }

  /**
   * A conversion result is a file url — `isFileUrl` says so — and its prefix sits
   * in `modifiers`, so replacing the chain drops it. The one hazard that survives
   * inside the file-only contract, which is why the page warns about it.
   */
  it('loses a conversion prefix when the chain is replaced', () => {
    const conversion = `https://ucarecdn.com/${UUID}/gif2video/-/format/webm/`
    const parts = tinyParse(conversion)
    expect(parts.modifiers).toBe('gif2video/-/format/webm/')
    expect(tinyBuild(parts)).toBe(conversion)
    expect(
      tinyBuild({ ...parts, modifiers: modifiers('preview/800x600') })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/800x600/`)
  })
})

describe('The chain type is nominal', () => {
  it('rejects a hand-written chain and accepts a normalized one', () => {
    const parts = tinyParse(`https://ucarecdn.com/${UUID}/photo.jpg`)
    // @ts-expect-error a hand-written string is not a ModifiersChain
    void tinyBuild({ ...parts, modifiers: '-/resize/300x/' })
    expect(
      tinyBuild({ ...parts, modifiers: normalizeModifiers('-/resize/300x/') })
    ).toBe(`https://ucarecdn.com/${UUID}/-/resize/300x/photo.jpg`)
  })
})

describe('Operation vs modifiers', () => {
  it('serializes one operation into a chain, and parses it back', () => {
    expect(modifiers('resize/300x')).toBe('-/resize/300x/')
    expect(parseOperations(modifiers('resize/300x'))).toEqual([
      { name: 'resize', params: ['300x'] }
    ])
    expect(modifiers('resize/300x', 'blur/10')).toBe('-/resize/300x/-/blur/10/')
  })
})

describe('Editing hazards, as the page tabulates them', () => {
  it('tolerates a trailing slash on the origin', () => {
    expect(tinyBuild({ origin: 'https://ucarecdn.com/', uuid: UUID })).toBe(
      `https://ucarecdn.com/${UUID}/`
    )
    expect(tinyBuild({ origin: 'https://ucarecdn.com///', uuid: UUID })).toBe(
      `https://ucarecdn.com/${UUID}/`
    )
  })

  it('search and hash carry their own punctuation', () => {
    expect(
      tinyBuild({
        origin: 'https://ucarecdn.com',
        uuid: UUID,
        search: '?v=2',
        hash: '#top'
      })
    ).toBe(`https://ucarecdn.com/${UUID}/?v=2#top`)
  })

  it('appending an operation the chain already has leaves both', () => {
    const twice = tinyParse(`https://ucarecdn.com/${UUID}/-/blur/5/photo.jpg`)
    expect(
      tinyBuild({
        ...twice,
        modifiers: joinModifiers(twice.modifiers, modifiers('blur/10'))
      })
    ).toBe(`https://ucarecdn.com/${UUID}/-/blur/5/-/blur/10/photo.jpg`)
  })

  it('omitted, undefined and modifiers() are the same empty chain', () => {
    const base = { origin: 'https://ucarecdn.com', uuid: UUID }
    const bare = `https://ucarecdn.com/${UUID}/`
    expect(tinyBuild(base)).toBe(bare)
    expect(tinyBuild({ ...base, modifiers: undefined })).toBe(bare)
    expect(tinyBuild({ ...base, modifiers: modifiers() })).toBe(bare)
  })

  it('an appended edit keeps the token that it just invalidated', () => {
    const parts = tinyParse(
      `https://ucarecdn.com/${UUID}/-/preview/photo.jpg?token=exp=1~hmac=b79f`
    )
    expect(parts.search).toBe('?token=exp=1~hmac=b79f')
    expect(
      tinyBuild({
        ...parts,
        modifiers: joinModifiers(parts.modifiers, modifiers('blur/10'))
      })
    ).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/-/blur/10/photo.jpg?token=exp=1~hmac=b79f`
    )
  })

  it('tinyParse on junk returns nonsense rather than throwing', () => {
    expect(tinyParse('not a url')).toMatchObject({
      origin: 'not a url',
      uuid: ''
    })
  })
})

describe('Documented hazards', () => {
  it('collapses doubled slashes', () => {
    expect(normalizeModifiers('a//b')).toBe('-/a/b/')
  })

  it('drops a conversion prefix when the chain is replaced', () => {
    const parts = tinyParse(
      `https://ucarecdn.com/${UUID}/gif2video/-/format/webm/`
    )
    expect(
      tinyBuild({ ...parts, modifiers: modifiers('preview/800x600') })
    ).toBe(`https://ucarecdn.com/${UUID}/-/preview/800x600/`)
  })

  it('appends two slashes to a url with no path', () => {
    expect(tinyBuild(tinyParse('https://ucarecdn.com'))).toBe(
      'https://ucarecdn.com//'
    )
  })

  it('keeps a token that no longer matches after an edit', () => {
    const signed = `https://cdn.example.com/${UUID}/-/preview/?token=exp=1~hmac=b79f`
    const edited = tinyBuild({
      ...tinyParse(signed),
      modifiers: modifiers('blur/10')
    })
    expect(edited).toBe(
      `https://cdn.example.com/${UUID}/-/blur/10/?token=exp=1~hmac=b79f`
    )
  })
})

describe('Moving up to the full API', () => {
  it('re-enters the typed model from a string-level url', () => {
    const parts = tinyParse(
      `https://ucarecdn.com/${UUID}/-/resize/300x/-/blur/10/photo.jpg`
    )
    expect(parseOperations(parts.modifiers)).toEqual([
      { name: 'resize', params: ['300x'] },
      { name: 'blur', params: ['10'] }
    ])
    expect(parseFileUrl(tinyBuild(parts)).uuid).toBe(UUID)
  })

  it('bridges operations back down to a chain', () => {
    const ops = [{ name: 'preview', params: ['800x600'] }]
    expect(normalizeModifiers(serializeOperations(ops))).toBe(
      '-/preview/800x600/'
    )
  })

  it('hands a chain to parseOperations unchanged', () => {
    const chain = modifiers('resize/300x', 'blur/10')
    expect(parseOperations(chain)).toEqual([
      { name: 'resize', params: ['300x'] },
      { name: 'blur', params: ['10'] }
    ])
    expect(serializeOperations(parseOperations(chain))).toBe(chain)
  })
})
