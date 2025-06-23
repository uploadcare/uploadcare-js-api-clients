import { sha256Encode } from './sha256Encode'
import { describe, it, expect } from 'vitest'

describe('sha256Encode', () => {
  it('should encode a string to a SHA-256 hash and return it as an base 16 integer', async () => {
    expect(await sha256Encode('demopublickey')).toBe(3.2328368644851214e76)
  })
})
