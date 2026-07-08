// eslint-disable-next-line import/no-unresolved -- subpath export, resolved by bundler/TS
import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'
import { expect } from '@jest/globals'
import { resolveCdnBase } from '../../src/tools/resolveCdnBase'
import { defaultSettings } from '../../src/defaultSettings'

const publicKey = 'demopublickey'
const expectedPrefixed = getPrefixedCdnBaseSync(
  publicKey,
  defaultSettings.prefixedBaseCDN
)

describe('resolveCdnBase', () => {
  it('derives the prefixed base from the public key by default', async () => {
    await expect(resolveCdnBase({ publicKey })).resolves.toBe(expectedPrefixed)
    expect(expectedPrefixed).toMatch(/^https:\/\/[a-z0-9]+\.ucarecd\.net$/)
  })

  it('keeps the classic domain verbatim when passed explicitly (legacy opt-out)', async () => {
    await expect(
      resolveCdnBase({ publicKey, baseCDN: defaultSettings.baseCDN })
    ).resolves.toBe(defaultSettings.baseCDN)
  })

  it('keeps https://ucarecdn.com verbatim when passed explicitly', async () => {
    await expect(
      resolveCdnBase({ publicKey, baseCDN: 'https://ucarecdn.com' })
    ).resolves.toBe('https://ucarecdn.com')
  })

  it('keeps an explicit base with a trailing slash verbatim', async () => {
    await expect(
      resolveCdnBase({ publicKey, baseCDN: 'https://ucarecdn.com/' })
    ).resolves.toBe('https://ucarecdn.com/')
  })

  it('re-derives when an explicit base already points at the prefixed zone', async () => {
    await expect(
      resolveCdnBase({ publicKey, baseCDN: 'https://stale1234.ucarecd.net' })
    ).resolves.toBe(expectedPrefixed)
  })

  it('leaves a custom baseCDN untouched (opt-out)', async () => {
    await expect(
      resolveCdnBase({ publicKey, baseCDN: 'https://cdn.example.com' })
    ).resolves.toBe('https://cdn.example.com')
  })

  it('honours a custom prefixedBaseCDN', async () => {
    await expect(
      resolveCdnBase({ publicKey, prefixedBaseCDN: 'https://example.net' })
    ).resolves.toBe(getPrefixedCdnBaseSync(publicKey, 'https://example.net'))
  })

  it('returns the base unchanged when no public key is provided', async () => {
    await expect(
      resolveCdnBase({ publicKey: '', baseCDN: defaultSettings.baseCDN })
    ).resolves.toBe(defaultSettings.baseCDN)
  })
})
