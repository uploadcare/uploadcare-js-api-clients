import { describe, expect, it } from 'vitest'

import { cnamePrefix } from './cnamePrefix'

/**
 * The prefix is the leading 10 digits of the digest written in base 36. These
 * values were produced by the implementation this replaced (a hand-rolled
 * base36 encoder), so they pin the switch to `BigInt.prototype.toString(36)` as
 * behaviour-neutral — a changed prefix here means every URL a project ever
 * published points somewhere else.
 */
describe('cnamePrefix', () => {
  it('takes the leading 10 base36 digits of a digest', () => {
    expect(
      cnamePrefix(
        32328368644851216602162954773669835699253099229990596035124766862276663471280n
      )
    ).toBe('1s4oyld5dc')
    expect(
      cnamePrefix(
        19262653239530443141120243149810945104833916728696319435827854527590143399786n
      )
    ).toBe('127mbvwq3b')
  })

  it('agrees with the previous encoder on the values it was tested with', () => {
    // from the deleted base36Encode.test.ts
    expect(cnamePrefix(0n)).toBe('0')
    expect(cnamePrefix(1n)).toBe('1')
    expect(cnamePrefix(35n)).toBe('z')
    expect(cnamePrefix(36n)).toBe('10')
    expect(cnamePrefix(123456789n)).toBe('21i3v9')
    expect(cnamePrefix(987654321n)).toBe('gc0uy9')
    expect(cnamePrefix(1234567890n)).toBe('kf12oi')
    expect(cnamePrefix(9876543210n)).toBe('4jc8lii')
  })

  it('never returns more than 10 digits, whatever the digest', () => {
    expect(cnamePrefix(2n ** 256n - 1n)).toHaveLength(10)
    expect(cnamePrefix(2n ** 255n)).toHaveLength(10)
  })
})
