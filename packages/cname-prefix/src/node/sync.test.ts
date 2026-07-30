import { createHash, randomBytes } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getCnamePrefixSync, getPrefixedCdnBaseSync } from './sync'

const PREFIX_CDN_BASE = 'https://ucarecd.net'

describe('node build: getCnamePrefixSync', () => {
  it('produces the prefixes the browser build produces', () => {
    expect(getCnamePrefixSync('demopublickey')).toBe('1s4oyld5dc')
    expect(getCnamePrefixSync('c8c237984266090ff9b8')).toBe('127mbvwq3b')
    expect(getCnamePrefixSync('3e6ba70c0670de3bef7a')).toBe('u51bthcx6t')
    expect(getCnamePrefixSync('823a5ae6eb3afa5b353f')).toBe('ggiwfssv31')
  })

  it('matches node:crypto for arbitrary inputs, including multi-block ones', () => {
    const expected = (input: string) =>
      BigInt(`0x${createHash('sha256').update(input, 'utf8').digest('hex')}`)
        .toString(36)
        .slice(0, 10)

    for (const length of [0, 1, 13, 55, 56, 57, 63, 64, 65, 128, 500]) {
      const input = randomBytes(length).toString('hex').slice(0, length)
      expect(getCnamePrefixSync(input)).toBe(expected(input))
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
