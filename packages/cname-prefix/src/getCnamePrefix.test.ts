import { getCnamePrefix } from './getCnamePrefix'
import { describe, it, expect } from 'vitest'

describe('getCnamePrefix', () => {
  it('should generate a CNAME prefix from a public key', async () => {
    expect(await getCnamePrefix('demopublickey')).toBe('1s4oyld5dc')
    expect(await getCnamePrefix('c8c237984266090ff9b8')).toBe('127mbvwq3b')
  })
})
