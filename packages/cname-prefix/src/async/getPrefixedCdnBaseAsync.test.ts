import { getPrefixedCdnBaseAsync } from './getPrefixedCdnBaseAsync'
import { describe, it, expect } from 'vitest'

describe('getPrefixedCdnBaseAsync', () => {
  it('should return the prefixed CDN base URL', async () => {
    const publicKey = 'demopublickey'
    const cdnBase = 'https://ucarecdn.com'
    const expected = 'https://1s4oyld5dc.ucarecdn.com'

    const result = await getPrefixedCdnBaseAsync(publicKey, cdnBase)
    expect(result).toBe(expected)
  })
})
