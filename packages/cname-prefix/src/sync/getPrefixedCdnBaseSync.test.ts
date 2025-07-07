import { getPrefixedCdnBaseSync } from './getPrefixedCdnBaseSync'
import { describe, it, expect } from 'vitest'

describe('getPrefixedCdnBaseSync', () => {
  it('should return the prefixed CDN base URL', () => {
    const publicKey = 'demopublickey'
    const cdnBase = 'https://ucarecdn.com'
    const expected = 'https://1s4oyld5dc.ucarecdn.com'

    const result = getPrefixedCdnBaseSync(publicKey, cdnBase)
    expect(result).toBe(expected)
  })
})
