import { PUBLIC_KEY_PREFIXES } from '../common/publicKeys.fixture'
import { getCnamePrefixSync } from './getCnamePrefixSync'
import { describe, it, expect } from 'vitest'

describe('getCnamePrefixSync', () => {
  it.each(PUBLIC_KEY_PREFIXES)(
    'should generate the CNAME prefix for the public key %s',
    (publicKey, prefix) => {
      expect(getCnamePrefixSync(publicKey)).toBe(prefix)
    }
  )
})
