import { sha256EncodeAsync } from './sha256EncodeAsync'
import { describe, it, expect } from 'vitest'

describe('sha256EncodeAsync', () => {
  it('should encode a string to a SHA-256 hash and return it as an base 16 integer', async () => {
    expect(await sha256EncodeAsync('demopublickey')).toBe(3.2328368644851214e76)
  })
})
