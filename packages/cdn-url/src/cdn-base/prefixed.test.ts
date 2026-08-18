import { describe, expect, it } from 'vitest'

import { PREFIX_CDN_BASE, prefixedCdnBase, prefixedCdnBaseAsync } from './index'

/**
 * The `@uploadcare/cdn-url/cdn-base` entry in whichever environment the suite
 * runs: `vitest
 * --run` executes this file in Node, `vitest --config vitest.browser.config.ts`
 * in real Chromium.
 *
 * `@uploadcare/cname-prefix` is left external and ships a build per environment,
 * so these expectations are what proves the export conditions resolve to
 * something that works rather than to something that merely imports. The two
 * environments do not offer the same API — WebCrypto only answers
 * asynchronously, and Node has no need for the async entry at all — so the async
 * expectation is deliberately different per environment.
 */
const isBrowser = typeof window !== 'undefined'

const PUBLIC_KEY = 'demopublickey'
const PREFIXED = 'https://1s4oyld5dc.ucarecd.net'

/** Over one SHA-256 block (55 bytes), where a mis-reset block buffer shows up. */
const LONG_KEY = 'demopublickey'.repeat(8)

describe('cdn-base', () => {
  it('derives the documented host from the documented key', () => {
    expect(prefixedCdnBase(PUBLIC_KEY)).toBe(PREFIXED)
  })

  it('is stable, and defaults to the prefixed zone', () => {
    expect(prefixedCdnBase(PUBLIC_KEY)).toBe(prefixedCdnBase(PUBLIC_KEY))
    expect(prefixedCdnBase(PUBLIC_KEY)).toBe(
      prefixedCdnBase(PUBLIC_KEY, PREFIX_CDN_BASE)
    )
  })

  it('prefixes the zone it is given, trailing slash or not', () => {
    const zone = 'https://cdn.example.com'
    expect(prefixedCdnBase(PUBLIC_KEY, `${zone}/`)).toBe(
      prefixedCdnBase(PUBLIC_KEY, zone)
    )
  })

  it('hashes input longer than one block correctly', () => {
    expect(LONG_KEY.length).toBeGreaterThan(55)
    // Derived with node:crypto, independently of @uploadcare/cname-prefix
    // (`BigInt('0x' + sha256(LONG_KEY)).toString(36).slice(0, 10)`), so a
    // regression in the dependency's digest cannot pass silently.
    expect(prefixedCdnBase(LONG_KEY)).toBe('https://5fp75uwtdd.ucarecd.net')
  })

  describe.runIf(isBrowser)('in a browser', () => {
    it('resolves the async helper to WebCrypto and agrees with the sync one', async () => {
      await expect(prefixedCdnBaseAsync(PUBLIC_KEY)).resolves.toBe(PREFIXED)
      await expect(prefixedCdnBaseAsync(LONG_KEY)).resolves.toBe(
        prefixedCdnBase(LONG_KEY)
      )
    })

    it('tolerates a trailing slash on the zone too', async () => {
      await expect(
        prefixedCdnBaseAsync(PUBLIC_KEY, 'https://cdn.example.com/')
      ).resolves.toBe(prefixedCdnBase(PUBLIC_KEY, 'https://cdn.example.com'))
    })
  })

  describe.runIf(!isBrowser)('on Node', () => {
    it('rejects the async helper, pointing at the sync one', async () => {
      await expect(prefixedCdnBaseAsync(PUBLIC_KEY)).rejects.toThrow(
        /browsers only[\s\S]*getPrefixedCdnBaseSync/
      )
    })
  })
})
