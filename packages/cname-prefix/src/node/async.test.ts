import { describe, expect, it } from 'vitest'

import { PUBLIC_KEY_PREFIXES } from '../common/publicKeys.fixture'
import { getPrefixedCdnBaseAsync } from './async'
import { getPrefixedCdnBaseSync } from './sync'

const PREFIX_CDN_BASE = 'https://ucarecd.net'

/**
 * The async API used to reject in Node; it now computes the prefix through
 * `node:crypto`'s WebCrypto, so it must land on exactly what the other builds
 * produce. The prefix is read back off the built base rather than from an
 * internal, so these assertions run through what the `node` condition actually
 * publishes.
 */
const prefixOf = async (publicKey: string): Promise<string> =>
  new URL(
    await getPrefixedCdnBaseAsync(publicKey, PREFIX_CDN_BASE)
  ).hostname.split('.')[0] as string

describe('node build: the async prefix', () => {
  it.each(PUBLIC_KEY_PREFIXES)(
    'is the one the other builds produce for %s',
    async (publicKey, prefix) => {
      expect(await prefixOf(publicKey)).toBe(prefix)
    }
  )

  it('agrees with the native sync build for the same public key', async () => {
    expect(
      await getPrefixedCdnBaseAsync('demopublickey', PREFIX_CDN_BASE)
    ).toBe(getPrefixedCdnBaseSync('demopublickey', PREFIX_CDN_BASE))
  })
})

describe('node build: getPrefixedCdnBaseAsync', () => {
  it('prefixes the zone with the project subdomain', async () => {
    expect(
      await getPrefixedCdnBaseAsync('demopublickey', PREFIX_CDN_BASE)
    ).toBe('https://1s4oyld5dc.ucarecd.net')
  })

  it('tolerates a trailing slash and never leaves one behind', async () => {
    expect(
      await getPrefixedCdnBaseAsync('demopublickey', `${PREFIX_CDN_BASE}/`)
    ).toBe('https://1s4oyld5dc.ucarecd.net')
  })

  it('prefixes a custom host as given', async () => {
    expect(
      await getPrefixedCdnBaseAsync('demopublickey', 'https://cdn.example.com')
    ).toBe('https://1s4oyld5dc.cdn.example.com')
  })
})
