import { describe, expect, it } from 'vitest'
import { joinModifiers, modifiers, normalizeModifiers } from './literals'
import { tinyBuild, tinyParse, type TinyFileUrl } from './url'

const UUID = '1bac376c-aa7e-4356-861b-dd2ee0510f79'

describe('tinyParse', () => {
  it('splits cdnBase, uuid, modifiers, filename and search', () => {
    expect(
      tinyParse(`https://ucarecdn.com/${UUID}/-/resize/300x/photo.jpg`)
    ).toEqual({
      cdnBase: 'https://ucarecdn.com',
      uuid: UUID,
      modifiers: '-/resize/300x/',
      filename: 'photo.jpg',
      search: '',
      hash: ''
    })
  })

  it('leaves modifiers empty on a bare url', () => {
    expect(tinyParse(`https://ucarecdn.com/${UUID}/`)).toEqual({
      cdnBase: 'https://ucarecdn.com',
      uuid: UUID,
      modifiers: '',
      filename: '',
      search: '',
      hash: ''
    })
  })

  it('splits a query string into search, keeping filename honest', () => {
    const {
      modifiers: chain,
      filename,
      search
    } = tinyParse(
      `https://cdn.example.com/${UUID}/-/preview/?token=exp=1~hmac=b79f`
    )
    expect(chain).toBe('-/preview/')
    expect(filename).toBe('')
    expect(search).toBe('?token=exp=1~hmac=b79f')
  })

  it('separates a filename from its query string and fragment', () => {
    expect(
      tinyParse(`https://ucarecdn.com/${UUID}/-/preview/photo.jpg?v=2#frag`)
    ).toMatchObject({
      filename: 'photo.jpg',
      search: '?v=2',
      hash: '#frag'
    })
  })

  it('puts a conversion prefix in the modifiers, where it round-trips', () => {
    expect(
      tinyParse(`https://ucarecdn.com/${UUID}/gif2video/-/format/webm/`)
        .modifiers
    ).toBe('gif2video/-/format/webm/')
  })

  it('normalizes a missing trailing slash instead of throwing', () => {
    expect(tinyBuild(tinyParse(`https://ucarecdn.com/${UUID}`))).toBe(
      `https://ucarecdn.com/${UUID}/`
    )
  })
})

describe('tinyBuild', () => {
  it('appends literals to the existing chain in a template literal', () => {
    const parts = tinyParse(`https://ucarecdn.com/${UUID}/-/preview/a.jpg`)
    expect(
      tinyBuild({
        ...parts,
        modifiers: joinModifiers(
          parts.modifiers,
          modifiers('resize/300x', 'blur/10')
        )
      })
    ).toBe(
      `https://ucarecdn.com/${UUID}/-/preview/-/resize/300x/-/blur/10/a.jpg`
    )
  })

  it('replaces the chain by assigning a fresh one', () => {
    const parts = tinyParse(`https://ucarecdn.com/${UUID}/-/preview/a.jpg`)
    expect(tinyBuild({ ...parts, modifiers: modifiers('resize/300x') })).toBe(
      `https://ucarecdn.com/${UUID}/-/resize/300x/a.jpg`
    )
  })

  it('drops the modifiers entirely', () => {
    const parts = tinyParse(`https://ucarecdn.com/${UUID}/-/preview/a.jpg`)
    expect(tinyBuild({ ...parts, modifiers: modifiers() })).toBe(
      `https://ucarecdn.com/${UUID}/a.jpg`
    )
  })

  it('rejects any chain that did not come from a producer', () => {
    const parts: TinyFileUrl = tinyParse(`https://ucarecdn.com/${UUID}/`)
    // The brand rejects hand-written chains whatever their shape — a stored value
    // pasted raw, one missing its trailing slash, and even a well-formed one.
    // @ts-expect-error stored value, not normalized
    const pastedRaw: TinyFileUrl = { ...parts, modifiers: 'resize/300x' }
    // @ts-expect-error not slash-terminated
    const noTrailingSlash: TinyFileUrl = {
      ...parts,
      modifiers: '-/resize/300x'
    }
    // @ts-expect-error well-formed, but still not from a producer
    const handWritten: TinyFileUrl = { ...parts, modifiers: '-/resize/300x/' }
    // @ts-expect-error the empty chain needs a producer too
    const empty: TinyFileUrl = { ...parts, modifiers: '' }
    // @ts-expect-error template concatenation widens back to string
    const concatenated: TinyFileUrl = {
      ...parts,
      modifiers: `${parts.modifiers}${modifiers('blur/10')}`
    }
    void [pastedRaw, noTrailingSlash, handWritten, empty, concatenated]
    // @ts-expect-error 'resize/300' is not a valid resize literal
    void modifiers('resize/300')
    const fromConfig: string = 'blur/10'
    // @ts-expect-error a bare string is never an OperationLiteral
    void modifiers(fromConfig)
  })
})

describe('tinyBuild with a normalized chain', () => {
  it('builds a url from a stored value of any shape', () => {
    const parts = tinyParse(`https://ucarecdn.com/${UUID}/photo.jpg`)
    expect(
      tinyBuild({ ...parts, modifiers: normalizeModifiers('//resize/100x') })
    ).toBe(`https://ucarecdn.com/${UUID}/-/resize/100x/photo.jpg`)
  })
})

/**
 * The contract covers single-file urls, but the cuts are purely lexical, so the
 * round trip holds for the other kinds too. That is incidental rather than
 * promised — pinned here because it is what makes passing an unexpected url
 * through harmless, and a regression would turn a no-op into corruption. Copies
 * the corpus from `serialize.test.ts` rather than sharing a fixture module.
 */
describe('round-trips every url the full parser accepts', () => {
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
      expect(tinyBuild(tinyParse(url))).toBe(url)
    })
  }
})
