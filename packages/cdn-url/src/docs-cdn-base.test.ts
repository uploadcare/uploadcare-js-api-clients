/**
 * Executes every snippet in `docs/guide/cdn-base.md`, plus the behaviour claims
 * its prose makes, so the page cannot promise a URL the library does not build.
 * Mirrors the snippets verbatim.
 */
import { describe, expect, it } from 'vitest'

import { CdnUrl } from './builder/index'
import { cdn, LEGACY_CDN_BASE } from './fluent/index'
import { prefixedCdnBase, prefixedCdnBaseAsync } from './cdn-base/index'
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

import {
  CDN_BASE as PREFIXED,
  GROUP as group,
  UUID as uuid
} from './docs-fixtures'

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

// `prefixedCdnBaseAsync` uses WebCrypto, which is the browser's digest; the
// dependency deliberately refuses it under Node, where the sync path is native.
// So these run in the Chromium project only.
const inBrowser = typeof globalThis.window !== 'undefined'

describe('cdn-base: the async variant', () => {
  it.skipIf(!inBrowser)(
    'agrees with the sync one, digit for digit',
    async () => {
      await expect(prefixedCdnBaseAsync('demopublickey')).resolves.toBe(
        prefixedCdnBase('demopublickey')
      )
      await expect(prefixedCdnBaseAsync('demopublickey')).resolves.toBe(
        PREFIXED
      )
    }
  )

  it.skipIf(!inBrowser)('feeds base() once awaited', async () => {
    const awaited = cdn.base(await prefixedCdnBaseAsync('demopublickey'))
    expect(awaited.file(uuid).preview(800, 600).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/800x600/`
    )
  })

  it.skipIf(!inBrowser)(
    'takes the same zone argument and trims it',
    async () => {
      await expect(
        prefixedCdnBaseAsync('demopublickey', 'https://cdn.example.com/')
      ).resolves.toBe('https://1s4oyld5dc.cdn.example.com')
    }
  )
})

describe('cdn-base: the legacy base', () => {
  it('builds on ucarecdn.com when named explicitly', () => {
    expect(LEGACY_CDN_BASE).toBe('https://ucarecdn.com')
    expect(cdn.base(LEGACY_CDN_BASE).file(uuid).preview(800, 600).href).toBe(
      `https://ucarecdn.com/${uuid}/-/preview/800x600/`
    )
  })
})

describe('cdn-base: a custom CNAME', () => {
  it('is used as it stands, unprefixed', () => {
    expect(cdn.base('https://cdn.example.com').file(uuid).href).toBe(
      `https://cdn.example.com/${uuid}/`
    )
  })
})

describe('cdn-base: passing it to each API layer', () => {
  it('fluent — bind once, rebase a single url with base()', () => {
    const myCdn = cdn.base(prefixedCdnBase('demopublickey'))

    expect(myCdn.file(uuid).preview(800, 600).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/800x600/`
    )
    expect(myCdn.group(group).nth(1).href).toBe(`${PREFIXED}/${uuid}~3/nth/1/`)
    expect(myCdn.file(uuid).base('https://cdn.example.com').href).toBe(
      `https://cdn.example.com/${uuid}/`
    )
    // rebasing one url leaves the entry object alone
    expect(myCdn.file(uuid).href).toBe(`${PREFIXED}/${uuid}/`)
  })

  it('functional core — a field, or the first argument', () => {
    const cdnBase = prefixedCdnBase('demopublickey')

    expect(
      serializeCdnUrl({ cdnBase, uuid, operations: [preview(800, 600)] })
    ).toBe(`${PREFIXED}/${uuid}/-/preview/800x600/`)
    expect(groupUrl(cdnBase, group)).toBe(`${PREFIXED}/${uuid}~3/`)
  })

  it('builder — constructor field, inherited by parse, replaced by base()', () => {
    const cdnBase = prefixedCdnBase('demopublickey')
    const stored = `https://ucarecdn.com/${uuid}/-/resize/300x/`

    expect(new CdnUrl({ cdnBase, uuid }).with(preview(800, 600)).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/800x600/`
    )
    expect(CdnUrl.parse(stored).href).toBe(stored)
    expect(CdnUrl.parse(stored).base(cdnBase).href).toBe(
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
    expect(cdn.base(`${PREFIXED}/`).file(uuid).href).toBe(
      `${PREFIXED}/${uuid}/`
    )
    expect(prefixedCdnBase('demopublickey', 'https://ucarecd.net/')).toBe(
      PREFIXED
    )
    expect(serializeCdnUrl({ cdnBase: `${PREFIXED}/`, uuid })).toBe(
      `${PREFIXED}/${uuid}/`
    )
  })

  it('base() refuses an empty base in the dev bundle', () => {
    expect(() => cdn.base('')).toThrow(TypeError)
  })

  it('two bases can coexist — the migration shape the page describes', () => {
    const myCdn = cdn.base(prefixedCdnBase('demopublickey'))
    const legacy = cdn.base(LEGACY_CDN_BASE)

    expect(myCdn.file(uuid).href).toBe(`${PREFIXED}/${uuid}/`)
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
    expect(
      cdn.base(PREFIXED).proxy(endpoint, source).preview(800, 600).href
    ).toBe(expected)
  })

  it('conversion paths carry no base at all', () => {
    expect(videoPath(uuid, [])).toBe(`/${uuid}/video/`)
    expect(documentPath(uuid, [])).toBe(`/${uuid}/document/`)
  })

  it('a token survives a rebase — which is exactly why it stops verifying', () => {
    const signed = `https://ucarecdn.com/${uuid}/-/preview/?token=exp=1~hmac=x`
    expect(CdnUrl.parse(signed).base(PREFIXED).href).toBe(
      `${PREFIXED}/${uuid}/-/preview/?token=exp=1~hmac=x`
    )
  })

  it('detectDomainKind classifies the three bases', () => {
    expect(detectDomainKind(PREFIXED)).toBe('prefixed')
    expect(detectDomainKind('https://ucarecdn.com')).toBe('legacy')
    expect(detectDomainKind('https://cdn.example.com')).toBe('custom')
  })
})
