/**
 * Executes the snippets on `docs/how-to/redact-and-strip-metadata.md` and the
 * library-side claims of `docs/how-to/signed-urls.md` — what survives an edit,
 * what clearing a token does, how the secure-delivery host classifies. The
 * signing snippet itself is Node-only and lives in `docs-signing.node.test.ts`.
 */
import { describe, expect, it } from 'vitest'

import { detectDomainKind, parseCdnUrl, serializeCdnUrl } from './index'
import { blurRegion, preview, stripMeta } from './ops/index'

import { CDN_BASE as cdnBase, myCdn, UUID as uuid } from './docs-fixtures'

describe('redact-and-strip-metadata', () => {
  it('blurs detected faces', () => {
    expect(myCdn.file(uuid).blurRegion({ faces: true }).href).toBe(
      `${cdnBase}/${uuid}/-/blur_region/faces/`
    )
  })

  it('blurs an explicit rectangle', () => {
    expect(
      myCdn.file(uuid).blurRegion({ width: 100, height: 50, x: 10, y: 20 }).href
    ).toBe(`${cdnBase}/${uuid}/-/blur_region/100x50/10,20/`)
  })

  it('takes percentages and an explicit strength', () => {
    expect(
      blurRegion({
        width: '30p',
        height: '20p',
        x: '10p',
        y: '15p',
        strength: 250
      })
    ).toEqual({ name: 'blur_region', params: ['30px20p', '10p,15p', '250'] })
  })

  it('accepts only the three documented strip_meta modes', () => {
    expect(myCdn.file(uuid).stripMeta('sensitive').href).toBe(
      `${cdnBase}/${uuid}/-/strip_meta/sensitive/`
    )
    expect(() =>
      // @ts-expect-error not a strip_meta mode
      stripMeta('nope')
    ).toThrow(/all, none, sensitive/)
  })

  it('strips metadata, and the two are independent operations', () => {
    expect(
      serializeCdnUrl({
        cdnBase,
        uuid,
        operations: [blurRegion({ faces: true }), stripMeta('sensitive')]
      })
    ).toBe(`${cdnBase}/${uuid}/-/blur_region/faces/-/strip_meta/sensitive/`)
  })
})

describe('signed-urls', () => {
  const acl = `/${uuid}/*`
  const token = `?token=exp=1735689600~acl=${acl}~hmac=deadbeef`
  const signed = `${cdnBase}/${uuid}/-/preview/300x300/${token}`

  it('round-trips a signed url verbatim, token and all', () => {
    expect(serializeCdnUrl(parseCdnUrl(signed))).toBe(signed)
  })

  it('carries the token through an edit — the wildcard-acl case', () => {
    const parsed = parseCdnUrl(signed)
    if (!('operations' in parsed)) throw new Error('expected a file url')
    const edited = serializeCdnUrl({
      ...parsed,
      operations: [...parsed.operations, preview(640, 640)]
    })
    expect(edited).toContain('token=exp=1735689600')
    expect(edited).toContain('-/preview/640x640/')
  })

  it('clears a token only when asked', () => {
    expect(serializeCdnUrl({ ...parseCdnUrl(signed), search: '' })).toBe(
      `${cdnBase}/${uuid}/-/preview/300x300/`
    )
  })

  it('classifies the secure-delivery host as prefixed', () => {
    expect(detectDomainKind('https://1s4oyld5dc.s.ucarecd.net')).toBe(
      'prefixed'
    )
  })

  it('builds a srcset off one signed base, as the page shows', () => {
    const parsed = parseCdnUrl(signed)
    if (!('operations' in parsed)) throw new Error('expected a file url')
    const srcset = [320, 640]
      .map((w) => {
        const href = serializeCdnUrl({
          ...parsed,
          operations: [preview(w, w)]
        })
        return `${href} ${w}w`
      })
      .join(', ')
    expect(srcset).toBe(
      `${cdnBase}/${uuid}/-/preview/320x320/${token} 320w, ` +
        `${cdnBase}/${uuid}/-/preview/640x640/${token} 640w`
    )
  })
})
