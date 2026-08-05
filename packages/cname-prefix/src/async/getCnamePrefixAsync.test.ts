import { PUBLIC_KEY_PREFIXES } from '../common/publicKeys.fixture'
import { getCnamePrefixAsync } from './getCnamePrefixAsync'
import { describe, it, expect } from 'vitest'

describe('getCnamePrefixAsync', () => {
  it.each(PUBLIC_KEY_PREFIXES)(
    'should generate the CNAME prefix for the public key %s',
    async (publicKey, prefix) => {
      expect(await getCnamePrefixAsync(publicKey)).toBe(prefix)
    }
  )
})
