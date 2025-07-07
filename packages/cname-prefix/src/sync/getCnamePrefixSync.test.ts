import { getCnamePrefixSync } from './getCnamePrefixSync'
import { describe, it, expect } from 'vitest'

describe('getCnamePrefixSync', () => {
  it('should generate a CNAME prefix from a public key', () => {
    expect(getCnamePrefixSync('demopublickey')).toBe('1s4oyld5dc')
    expect(getCnamePrefixSync('c8c237984266090ff9b8')).toBe('127mbvwq3b')
  })
})
