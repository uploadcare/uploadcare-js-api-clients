import { getPrefixedCdnBase } from './getPrefixedCdnBase'
import { describe, it, expect } from 'vitest'

describe('getPrefixedCdnBase', () => {
  it('should return the prefixed CDN base URL', async () => {
    const publicKey = 'demopublickey'
    const cdnBase = 'https://ucarecdn.com'
    const expected = 'https://1s4oyld5dc.ucarecdn.com'

    const result = await getPrefixedCdnBase(publicKey, cdnBase)
    expect(result).toBe(expected)
  })
})
