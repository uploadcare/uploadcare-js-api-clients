import { sha256EncodeSync } from './sha256EncodeSync'
import { describe, it, expect } from 'vitest'

describe('sha256EncodeSync', () => {
  it('should encode a string to a SHA-256 hash and return it as an base 16 integer', async () => {
    expect(sha256EncodeSync('demopublickey')).toBe(3.2328368644851214e76)
  })
})
