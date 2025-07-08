import { getCnamePrefixSync } from './getCnamePrefixSync'
import { describe, it, expect } from 'vitest'

describe('getCnamePrefixSync', () => {
  it('should generate a CNAME prefix from a public key', () => {
    expect(getCnamePrefixSync('demopublickey')).toBe('1s4oyld5dc')
    expect(getCnamePrefixSync('c8c237984266090ff9b8')).toBe('127mbvwq3b')
    expect(getCnamePrefixSync('3e6ba70c0670de3bef7a')).toBe('u51bthcx6t')
    expect(getCnamePrefixSync('823a5ae6eb3afa5b353f')).toBe('ggiwfssv31')
  })
})
