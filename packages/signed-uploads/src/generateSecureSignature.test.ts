import { generateSecureSignature } from './generateSecureSignature'
import { vi, expect } from 'vitest'

const FIXTURE_SECRET = 'YOUR_SECRET_KEY'
const FIXTURE_DATE = new Date(1678359840000)
const FIXTURE_LIFETIME = 60 * 30 * 1000 // 30 minutes
const EXPECTED_SIGNATURE =
  '93b69d086a487fbdfc36172b96a5d7f5afa7cb209e43e5f25890bc037e638584'
const EXPECTED_EXPIRE = '1678361640'

describe('generateSecureSignature', () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(FIXTURE_DATE)
  })

  it('should return signature and expire by `expire` as number', () => {
    const { secureSignature, secureExpire } = generateSecureSignature(
      FIXTURE_SECRET,
      {
        expire: Date.now() + FIXTURE_LIFETIME
      }
    )
    expect(secureSignature).toBe(EXPECTED_SIGNATURE)
    expect(secureExpire).toBe(EXPECTED_EXPIRE)
  })

  it('should return signature and expire by `expire` as Date', () => {
    const { secureSignature, secureExpire } = generateSecureSignature(
      FIXTURE_SECRET,
      {
        expire: new Date(FIXTURE_DATE.getTime() + FIXTURE_LIFETIME)
      }
    )
    expect(secureSignature).toBe(EXPECTED_SIGNATURE)
    expect(secureExpire).toBe(EXPECTED_EXPIRE)
  })

  it('should return signature by `lifetime`', () => {
    const { secureSignature, secureExpire } = generateSecureSignature(
      FIXTURE_SECRET,
      {
        lifetime: FIXTURE_LIFETIME
      }
    )
    expect(secureSignature).toBe(EXPECTED_SIGNATURE)
    expect(secureExpire).toBe(EXPECTED_EXPIRE)
  })
})
