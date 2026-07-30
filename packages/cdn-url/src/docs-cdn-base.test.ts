/**
 * Executes every snippet in `docs/guide/cdn-base.md`, plus the behaviour claims
 * its prose makes, so the page cannot promise a URL the library does not build.
 * Mirrors the snippets verbatim.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import { base, LEGACY_CDN_BASE, prefixedCdnBase } from './fluent/index'
import { groupUrl } from './group/index'
import {
  detectDomainKind,
  PREFIX_CDN_BASE,
  serializeCdnUrl,
  tinyBuild
} from './index'
import { preview } from './ops/index'
import { defaultProxyEndpoint, proxyUrl } from './proxy/index'
import { documentPath } from './document/index'
import { videoPath } from './video/index'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const group = { uuid, count: 3 }
const PREFIXED = 'https://1s4oyld5dc.ucarecd.net'

describe('cdn-base: the prefixed base', () => {
  it('derives the documented host from the documented key', () => {
    expect(prefixedCdnBase('demopublickey')).toBe(PREFIXED)
  })

  it('is stable — same key, same answer', () => {
    expect(prefixedCdnBase('demopublickey')).toBe(
      prefixedCdnBase('demopublickey')
    )
  })

  it('prefixes the ucarecd.net zone, which is not ucarecdn.com', () => {
    expect(PREFIX_CDN_BASE).toBe('https://ucarecd.net')
    expect(LEGACY_CDN_BASE).toBe('https://ucarecdn.com')
    expect(PREFIX_CDN_BASE).not.toBe(LEGACY_CDN_BASE)
  })
})

describe('cdn-base: the legacy base', () => {
  it('builds on ucarecdn.com when named explicitly', () => {
    expect(LEGACY_CDN_BASE).toBe('https://ucarecdn.com')
    expect(base(LEGACY_CDN_BASE).file(uuid).preview(800, 600).href).toBe(
      `https://ucarecdn.com/${uuid}/-/preview/800x600/`
    )
  })
})

describe('cdn-base: a custom CNAME', () => {
  it('is used as it stands, unprefixed', () => {
    expect(base('https://cdn.example.com').file(uuid).href).toBe(
      `https://cdn.example.com/${uuid}/`
    )
  })
})

describe('cdn-base: passing it to each API layer', () => {
  it('fluent — bind once, rebase per call', () => {
    const cdn = base(prefixedCdnBase('demopublickey'))

    expect(cdn.file(uuid).preview(800, 600).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/800x600/`
    )
    expect(cdn.group(group).nth(1).href).toBe(`${PREFIXED}/${uuid}~3/nth/1/`)
    expect(cdn.base('https://cdn.example.com').file(uuid).href).toBe(
      `https://cdn.example.com/${uuid}/`
    )
    // rebasing leaves the original entry object alone
    expect(cdn.file(uuid).href).toBe(`${PREFIXED}/${uuid}/`)
  })

  it('functional core — a field, or the first argument', () => {
    const cdnBase = prefixedCdnBase('demopublickey')

    expect(
      serializeCdnUrl({ cdnBase, uuid, operations: [preview(800, 600)] })
    ).toBe(`${PREFIXED}/${uuid}/-/preview/800x600/`)
    expect(groupUrl(cdnBase, group)).toBe(`${PREFIXED}/${uuid}~3/`)
  })

  it('builder — constructor field, inherited by parse, replaced by setCdnBase', () => {
    const cdnBase = prefixedCdnBase('demopublickey')
    const stored = `https://ucarecdn.com/${uuid}/-/resize/300x/`

    expect(new CdnUrl({ cdnBase, uuid }).with(preview(800, 600)).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/800x600/`
    )
    expect(CdnUrl.parse(stored).href).toBe(stored)
    expect(CdnUrl.parse(stored).setCdnBase(cdnBase).href).toBe(
      `${PREFIXED}/${uuid}/-/resize/300x/`
    )
  })

  it('string level — the same field', () => {
    expect(tinyBuild({ cdnBase: prefixedCdnBase('demopublickey'), uuid })).toBe(
      `${PREFIXED}/${uuid}/`
    )
  })
})

describe('cdn-base: the two conveniences and the one strictness', () => {
  it('trims a trailing slash everywhere it is accepted', () => {
    expect(base(`${PREFIXED}/`).file(uuid).href).toBe(`${PREFIXED}/${uuid}/`)
    expect(prefixedCdnBase('demopublickey', 'https://ucarecd.net/')).toBe(
      PREFIXED
    )
    expect(serializeCdnUrl({ cdnBase: `${PREFIXED}/`, uuid })).toBe(
      `${PREFIXED}/${uuid}/`
    )
  })

  it('base() refuses an empty base in the dev bundle', () => {
    expect(() => base('')).toThrow(TypeError)
  })

  it('two bases can coexist — the migration shape the page describes', () => {
    const cdn = base(prefixedCdnBase('demopublickey'))
    const legacy = base(LEGACY_CDN_BASE)

    expect(cdn.file(uuid).href).toBe(`${PREFIXED}/${uuid}/`)
    expect(legacy.file(uuid).href).toBe(`https://ucarecdn.com/${uuid}/`)
  })

  it('but the core and the builder take what they are given', () => {
    expect(serializeCdnUrl({ cdnBase: '', uuid })).toBe(`/${uuid}/`)
    expect(new CdnUrl({ cdnBase: '', uuid }).href).toBe(`/${uuid}/`)
  })
})

describe('cdn-base: things that bite', () => {
  it('a proxy endpoint uses the key verbatim, not a prefix', () => {
    expect(defaultProxyEndpoint('demopublickey')).toBe(
      'https://demopublickey.ucr.io'
    )
    expect(defaultProxyEndpoint('demopublickey')).not.toContain('1s4oyld5dc')
  })

  it('and it goes to the proxy entry points, not to base()', () => {
    const endpoint = defaultProxyEndpoint('demopublickey')
    const source = 'https://example.com/photo.jpg'
    const expected = `https://demopublickey.ucr.io/-/preview/800x600/${source}`

    expect(proxyUrl(endpoint, source, [preview(800, 600)])).toBe(expected)
    // on a chain the endpoint is an argument; the bound base goes unused
    expect(base(PREFIXED).proxy(endpoint, source).preview(800, 600).href).toBe(
      expected
    )
  })

  it('conversion paths carry no base at all', () => {
    expect(videoPath(uuid, [])).toBe(`/${uuid}/video/`)
    expect(documentPath(uuid, [])).toBe(`/${uuid}/document/`)
  })

  it('a token survives a rebase — which is exactly why it stops verifying', () => {
    const signed = `https://ucarecdn.com/${uuid}/-/preview/?token=exp=1~hmac=x`
    expect(CdnUrl.parse(signed).setCdnBase(PREFIXED).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/?token=exp=1~hmac=x`
    )
  })

  it('detectDomainKind classifies the three bases', () => {
    expect(detectDomainKind(PREFIXED)).toBe('prefixed')
    expect(detectDomainKind('https://ucarecdn.com')).toBe('legacy')
    expect(detectDomainKind('https://cdn.example.com')).toBe('custom')
  })
})
