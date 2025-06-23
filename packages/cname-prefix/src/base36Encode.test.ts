import { base36Encode } from './base36Encode'
import { describe, it, expect } from 'vitest'

describe('base36Encode', () => {
  it('should encode a number to base36', () => {
    expect(base36Encode(0)).toBe('0')
    expect(base36Encode(1)).toBe('1')
    expect(base36Encode(35)).toBe('z')
    expect(base36Encode(36)).toBe('10')
    expect(base36Encode(123456789)).toBe('21i3v9')
    expect(base36Encode(987654321)).toBe('gc0uy9')
    expect(base36Encode(1234567890)).toBe('kf12oi')
    expect(base36Encode(9876543210)).toBe('4jc8lii')
  })
})
