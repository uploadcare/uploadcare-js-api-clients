import { base36Encode } from './base36Encode'
import { describe, it, expect } from 'vitest'

describe('base36Encode', () => {
  it('should encode a number to base36', () => {
    expect(base36Encode(0n)).toBe('0')
    expect(base36Encode(1n)).toBe('1')
    expect(base36Encode(35n)).toBe('z')
    expect(base36Encode(36n)).toBe('10')
    expect(base36Encode(123456789n)).toBe('21i3v9')
    expect(base36Encode(987654321n)).toBe('gc0uy9')
    expect(base36Encode(1234567890n)).toBe('kf12oi')
    expect(base36Encode(9876543210n)).toBe('4jc8lii')
  })
})
