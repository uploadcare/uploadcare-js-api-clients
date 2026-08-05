import { createHash, randomBytes } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { PUBLIC_KEY_PREFIXES } from '../common/publicKeys.fixture'
import { getPrefixedCdnBaseSync } from './sync'

const PREFIX_CDN_BASE = 'https://ucarecd.net'

/**
 * The prefix is read back off a built base rather than from the internal
 * `getCnamePrefixSync`, so these assertions run through what the `node`
 * condition actually publishes — which is exactly what the browser condition
 * publishes.
 */
const prefixOf = (publicKey: string): string =>
  new URL(getPrefixedCdnBaseSync(publicKey, PREFIX_CDN_BASE)).hostname.split(
    '.'
  )[0] as string

describe('node build: the prefix', () => {
  it.each(PUBLIC_KEY_PREFIXES)(
    'is the one the other builds produce for %s',
    (publicKey, prefix) => {
      expect(prefixOf(publicKey)).toBe(prefix)
    }
  )

  it('matches node:crypto for arbitrary inputs, including multi-block ones', () => {
    const expected = (input: string) =>
      BigInt(`0x${createHash('sha256').update(input, 'utf8').digest('hex')}`)
        .toString(36)
        .slice(0, 10)

    for (const length of [0, 1, 13, 55, 56, 57, 63, 64, 65, 128, 500]) {
      const input = randomBytes(length).toString('hex').slice(0, length)
      expect(prefixOf(input)).toBe(expected(input))
    }
  })
})

describe('node build: getPrefixedCdnBaseSync', () => {
  it('prefixes the zone with the project subdomain', () => {
    expect(getPrefixedCdnBaseSync('demopublickey', PREFIX_CDN_BASE)).toBe(
      'https://1s4oyld5dc.ucarecd.net'
    )
  })

  it('tolerates a trailing slash and never leaves one behind', () => {
    expect(getPrefixedCdnBaseSync('demopublickey', `${PREFIX_CDN_BASE}/`)).toBe(
      'https://1s4oyld5dc.ucarecd.net'
    )
  })

  it('prefixes a custom host as given', () => {
    expect(
      getPrefixedCdnBaseSync('demopublickey', 'https://cdn.example.com')
    ).toBe('https://1s4oyld5dc.cdn.example.com')
  })
})
