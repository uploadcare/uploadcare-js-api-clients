import { getCnamePrefixAsync } from './getCnamePrefixAsync'
import { describe, it, expect } from 'vitest'

describe('getCnamePrefixAsync', () => {
  it('should generate a CNAME prefix from a public key', async () => {
    expect(await getCnamePrefixAsync('demopublickey')).toBe('1s4oyld5dc')
    expect(await getCnamePrefixAsync('c8c237984266090ff9b8')).toBe('127mbvwq3b')
    expect(await getCnamePrefixAsync('3e6ba70c0670de3bef7a')).toBe('u51bthcx6t')
    expect(await getCnamePrefixAsync('823a5ae6eb3afa5b353f')).toBe('ggiwfssv31')
  })
})
